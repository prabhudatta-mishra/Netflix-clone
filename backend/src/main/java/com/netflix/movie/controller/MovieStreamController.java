package com.netflix.movie.controller;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.movie.util.VideoFileValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/movies")
public class MovieStreamController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Autowired
    private MovieRepository movieRepository;

    @GetMapping("/{id}/stream")
    public ResponseEntity<?> streamMovie(
            @PathVariable Long id,
            @RequestHeader HttpHeaders headers) throws IOException {

        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        String videoUrl = movie.getVideoUrl();
        if (videoUrl == null || videoUrl.isBlank()) {
            throw new RuntimeException("This movie has no video file.");
        }

        if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(videoUrl)).build();
        }

        Path file = resolveLocalVideoPath(videoUrl);
        if (!Files.isRegularFile(file)) {
            throw new RuntimeException(
                    "Video file missing on server. Re-upload the MP4 from Admin Panel. Expected: " + file);
        }

        Resource resource = new FileSystemResource(file);
        long contentLength = resource.contentLength();
        String ext = VideoFileValidator.extension(file.getFileName().toString());
        MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.parseMediaType(VideoFileValidator.contentTypeForExtension(ext)));

        List<HttpRange> ranges = headers.getRange();
        if (ranges.isEmpty()) {
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentLength(contentLength)
                    .body(resource);
        }

        HttpRange range = ranges.get(0);
        long start = range.getRangeStart(contentLength);
        long end = range.getRangeEnd(contentLength);
        long rangeLength = Math.min(end - start + 1, contentLength - start);
        ResourceRegion region = new ResourceRegion(resource, start, rangeLength);

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_RANGE,
                        "bytes " + start + "-" + (start + rangeLength - 1) + "/" + contentLength)
                .body(region);
    }

    private Path resolveLocalVideoPath(String videoUrl) {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (videoUrl.startsWith("/uploads/")) {
            return base.resolve(videoUrl.substring("/uploads/".length()));
        }
        if (videoUrl.startsWith("uploads/")) {
            return base.resolve(videoUrl.substring("uploads/".length()));
        }
        return base.resolve("videos").resolve(videoUrl);
    }
}
