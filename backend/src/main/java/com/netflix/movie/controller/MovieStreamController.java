package com.netflix.movie.controller;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.movie.util.VideoFileValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/movies")
public class MovieStreamController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.offline.import-dir:offline-import}")
    private String importDir;

    @Autowired
    private MovieRepository movieRepository;

    @GetMapping("/{id}/stream")
    public ResponseEntity<?> streamMovie(
            @PathVariable Long id,
            @RequestHeader HttpHeaders headers) throws IOException {

        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        String videoUrl = movie.getVideoUrl();
        Optional<Path> localMatch = findMatchingLocalVideo(movie.getTitle());
        boolean seededDemoUrl = videoUrl != null && videoUrl.contains("commondatastorage.googleapis.com/gtv-videos-bucket/sample");

        if (localMatch.isPresent() && (videoUrl == null || videoUrl.isBlank() || seededDemoUrl)) {
            return streamLocalFile(localMatch.get(), headers);
        }

        if (videoUrl == null || videoUrl.isBlank()) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(demoVideoUrl(movie.getTitle())))
                    .build();
        }

        if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(videoUrl)).build();
        }

        Path file = resolveLocalVideoPath(videoUrl);
        if (!Files.isRegularFile(file)) {
            throw new RuntimeException(
                    "Video file missing on server. Re-upload the MP4 from Admin Panel. Expected: " + file);
        }

        return streamLocalFile(file, headers);
    }

    private ResponseEntity<?> streamLocalFile(Path file, HttpHeaders headers) throws IOException {
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
        long end = Math.min(range.getRangeEnd(contentLength), contentLength - 1);
        long rangeLength = end - start + 1;
        StreamingResponseBody body = outputStream -> {
            try (InputStream inputStream = Files.newInputStream(file)) {
                inputStream.skipNBytes(start);
                byte[] buffer = new byte[64 * 1024];
                long remaining = rangeLength;
                while (remaining > 0) {
                    int read = inputStream.read(buffer, 0, (int) Math.min(buffer.length, remaining));
                    if (read == -1) {
                        break;
                    }
                    outputStream.write(buffer, 0, read);
                    remaining -= read;
                }
            }
        };

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_RANGE,
                        "bytes " + start + "-" + end + "/" + contentLength)
                .contentLength(rangeLength)
                .body(body);
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

    private Optional<Path> findMatchingLocalVideo(String title) {
        String normalizedTitle = normalize(title);
        if (normalizedTitle.length() < 3) {
            return Optional.empty();
        }
        Path uploads = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("videos");
        Path offline = Paths.get(importDir).toAbsolutePath().normalize();
        Path imported = offline.resolve("imported");
        for (Path dir : new Path[] { uploads, offline, imported }) {
            Optional<Path> match = findMatchingLocalVideoIn(dir, normalizedTitle);
            if (match.isPresent()) {
                return match;
            }
        }
        return Optional.empty();
    }

    private Optional<Path> findMatchingLocalVideoIn(Path dir, String normalizedTitle) {
        if (!Files.isDirectory(dir)) {
            return Optional.empty();
        }
        try (Stream<Path> files = Files.list(dir)) {
            return files
                    .filter(Files::isRegularFile)
                    .filter(path -> VideoFileValidator.isAllowedVideoFilename(path.getFileName().toString()))
                    .filter(path -> normalize(cleanReleaseName(baseName(path.getFileName().toString()))).equals(normalizedTitle))
                    .findFirst();
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    private String baseName(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(0, dot) : filename;
    }

    private String cleanReleaseName(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replaceAll("(?i)[\\._-]+", " ")
                .replaceAll("(?i)\\b(19|20)\\d{2}\\b.*$", "")
                .replaceAll("(?i)\\b(480p|720p|1080p|2160p|4k|hdr|bluray|brrip|webrip|web-dl|x264|x265|hevc|aac|dual audio)\\b.*$", "")
                .trim();
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "");
    }

    private String demoVideoUrl(String title) {
        String key = title == null ? "" : title.toLowerCase(Locale.ROOT);
        if (key.contains("interstellar")) {
            return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
        }
        if (key.contains("dark knight")) {
            return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
        }
        if (key.contains("inception")) {
            return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
        }
        if (key.contains("avatar")) {
            return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
        }
        if (key.contains("matrix")) {
            return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";
        }
        if (key.contains("gladiator")) {
            return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
        }
        if (key.contains("spirited")) {
            return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4";
        }
        return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";
    }
}
