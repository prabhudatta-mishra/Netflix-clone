package com.netflix.movie.service;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.movie.util.VideoFileValidator;
import com.netflix.user.dto.OfflineImportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;

@Service
public class OfflineMovieImportService {

    private static final Set<String> IMAGE_EXT = Set.of("jpg", "jpeg", "png", "gif", "webp");
    @Value("${app.offline.import-dir:offline-import}")
    private String importDir;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Autowired
    private MovieRepository movieRepository;

    public OfflineImportResponse importFromInbox() throws IOException {
        Path inbox = Paths.get(importDir).toAbsolutePath().normalize();
        Path importedDir = inbox.resolve("imported");
        Path videosDir = Paths.get(uploadDir).toAbsolutePath().resolve("videos");
        Path thumbsDir = Paths.get(uploadDir).toAbsolutePath().resolve("thumbnails");

        Files.createDirectories(inbox);
        Files.createDirectories(importedDir);
        Files.createDirectories(videosDir);
        Files.createDirectories(thumbsDir);

        List<String> imported = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        List<Path> videoFiles = findVideos(inbox, importedDir);
        for (Path videoPath : videoFiles) {
            try {
                String title = importVideoFile(videoPath, videosDir, thumbsDir, importedDir);
                imported.add(title);
            } catch (Exception e) {
                errors.add(videoPath.getFileName() + ": " + e.getMessage());
            }
        }

        return new OfflineImportResponse(inbox.toString(), imported, skipped, errors);
    }

    private List<Path> findVideos(Path inbox, Path importedDir) throws IOException {
        List<Path> result = new ArrayList<>();
        if (!Files.isDirectory(inbox)) {
            return result;
        }

        try (Stream<Path> stream = Files.walk(inbox, 3)) {
            stream.filter(Files::isRegularFile)
                    .filter(p -> !isUnderImported(p, importedDir))
                    .filter(this::isVideoFile)
                    .sorted()
                    .forEach(result::add);
        }
        return result;
    }

    private boolean isUnderImported(Path file, Path importedDir) {
        Path normalized = file.toAbsolutePath().normalize();
        return normalized.startsWith(importedDir.toAbsolutePath().normalize());
    }

    private boolean isVideoFile(Path path) {
        return VideoFileValidator.isAllowedVideoFilename(path.getFileName().toString());
    }

    private String importVideoFile(Path videoPath, Path videosDir, Path thumbsDir, Path importedDir)
            throws IOException {
        String baseName = baseName(videoPath.getFileName().toString());
        Path parent = videoPath.getParent();

        Properties meta = loadMeta(parent, baseName);
        String title = meta.getProperty("title", humanize(cleanReleaseName(baseName)));
        String genre = meta.getProperty("genre", "General");
        String description = meta.getProperty("description", "Imported from offline folder.");
        double rating = parseRating(meta.getProperty("rating", "7.0"));
        int year = parseYear(meta.getProperty("year", String.valueOf(LocalDateTime.now().getYear())));

        String videoExt = VideoFileValidator.extension(videoPath.getFileName().toString());
        if (videoExt.isEmpty()) {
            videoExt = "mp4";
        }
        String videoStored = UUID.randomUUID() + "." + videoExt;
        Path videoTarget = videosDir.resolve(videoStored);
        Files.copy(videoPath, videoTarget, StandardCopyOption.REPLACE_EXISTING);

        String thumbnailUrl = defaultThumbnail();
        Path thumbSource = findThumbnail(parent, baseName);
        if (thumbSource != null) {
            String thumbExt = VideoFileValidator.extension(thumbSource.getFileName().toString());
            String thumbStored = UUID.randomUUID() + "." + thumbExt;
            Files.copy(thumbSource, thumbsDir.resolve(thumbStored), StandardCopyOption.REPLACE_EXISTING);
            thumbnailUrl = "/uploads/thumbnails/" + thumbStored;
            moveToImported(thumbSource, importedDir);
        }

        Movie movie = movieRepository.findAll().stream()
                .filter(existing -> sameTitle(existing.getTitle(), title))
                .findFirst()
                .orElseGet(Movie::new);

        movie.setTitle(title);
        movie.setDescription(description);
        movie.setGenre(genre);
        movie.setReleaseYear(year);
        movie.setThumbnailUrl(thumbnailUrl);
        movie.setBannerUrl(thumbnailUrl);
        movie.setVideoUrl("/uploads/videos/" + videoStored);
        movie.setRating(rating);
        if (movie.getCreatedAt() == null) {
            movie.setCreatedAt(LocalDateTime.now());
        }
        movieRepository.save(movie);

        moveToImported(videoPath, importedDir);
        Path metaFile = parent.resolve(baseName + ".properties");
        if (Files.isRegularFile(metaFile)) {
            moveToImported(metaFile, importedDir);
        }
        return title;
    }

    private void moveToImported(Path source, Path importedDir) throws IOException {
        Path target = importedDir.resolve(source.getFileName().toString());
        if (Files.exists(target)) {
            Files.delete(target);
        }
        Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
    }

    private Properties loadMeta(Path parent, String baseName) throws IOException {
        Properties props = new Properties();
        Path meta = parent.resolve(baseName + ".properties");
        if (Files.isRegularFile(meta)) {
            try (InputStream in = Files.newInputStream(meta)) {
                props.load(in);
            }
        }
        return props;
    }

    private String readTitle(Path videoPath) throws IOException {
        String baseName = baseName(videoPath.getFileName().toString());
        Properties meta = loadMeta(videoPath.getParent(), baseName);
        return meta.getProperty("title", humanize(baseName));
    }

    private Path findThumbnail(Path parent, String baseName) throws IOException {
        for (String ext : IMAGE_EXT) {
            Path candidate = parent.resolve(baseName + "." + ext);
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private String baseName(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(0, dot) : filename;
    }

    private String humanize(String baseName) {
        return baseName.replace('_', ' ').replace('-', ' ').trim();
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

    private boolean sameTitle(String left, String right) {
        return normalize(left).equals(normalize(right));
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "");
    }

    private double parseRating(String value) {
        try {
            double r = Double.parseDouble(value.trim());
            return Math.max(0, Math.min(10, r));
        } catch (NumberFormatException e) {
            return 7.0;
        }
    }

    private int parseYear(String value) {
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return LocalDateTime.now().getYear();
        }
    }

    private String defaultThumbnail() {
        return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400";
    }
}
