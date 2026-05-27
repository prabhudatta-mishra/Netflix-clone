package com.netflix.movie.controller;

import com.netflix.movie.dto.MovieResponse;
import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.movie.util.VideoFileValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/movies")
public class MovieUploadController {

    private static final Set<String> IMAGE_EXT = Set.of("jpg", "jpeg", "png", "gif", "webp");

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Autowired
    private MovieRepository movieRepository;

    @PostMapping("/upload")
    public ResponseEntity<MovieResponse> uploadMovie(
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam String genre,
            @RequestParam(required = false) Integer releaseYear,
            @RequestParam(required = false) Double rating,
            @RequestParam(required = false) MultipartFile thumbnail,
            @RequestParam(required = false) MultipartFile video) throws IOException {

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path thumbnailsDir = uploadPath.resolve("thumbnails");
        Path videosDir = uploadPath.resolve("videos");
        Files.createDirectories(thumbnailsDir);
        Files.createDirectories(videosDir);

        if (thumbnail == null || thumbnail.isEmpty()) {
            throw new IllegalArgumentException("Thumbnail image is required.");
        }
        VideoFileValidator.validate(video);

        double movieRating = rating != null ? rating : 7.0;
        if (movieRating < 0 || movieRating > 10) {
            throw new IllegalArgumentException("Rating must be between 0 and 10.");
        }

        String thumbnailUrl;
        String videoUrl;

        {
            String ext = VideoFileValidator.extension(thumbnail.getOriginalFilename());
            if (!IMAGE_EXT.contains(ext)) {
                throw new IllegalArgumentException(
                        "Thumbnail must be an image (jpg, png, gif, webp). Got: ." + ext);
            }
            String name = UUID.randomUUID() + "." + ext;
            Path file = thumbnailsDir.resolve(name);
            thumbnail.transferTo(file);
            thumbnailUrl = "/uploads/thumbnails/" + name;
        }

        {
            String ext = VideoFileValidator.extension(video.getOriginalFilename());
            if (ext.isEmpty()) {
                ext = "mp4";
            }
            String name = UUID.randomUUID() + "." + ext;
            Path file = videosDir.resolve(name);
            video.transferTo(file);
            videoUrl = "/uploads/videos/" + name;
        }

        Movie movie = new Movie();
        movie.setTitle(title);
        movie.setDescription(description);
        movie.setGenre(genre);
        movie.setReleaseYear(releaseYear != null ? releaseYear : LocalDateTime.now().getYear());
        movie.setThumbnailUrl(thumbnailUrl);
        movie.setBannerUrl(thumbnailUrl);
        movie.setVideoUrl(videoUrl);
        movie.setRating(movieRating);
        movie.setCreatedAt(LocalDateTime.now());

        Movie saved = movieRepository.save(movie);
        return ResponseEntity.ok(toResponse(saved));
    }

    private MovieResponse toResponse(Movie movie) {
        return new MovieResponse(
                movie.getId(), movie.getTitle(), movie.getDescription(), movie.getGenre(),
                movie.getReleaseYear(), movie.getThumbnailUrl(), movie.getBannerUrl(),
                movie.getVideoUrl(), movie.getRating(), movie.getCreatedAt()
        );
    }
}
