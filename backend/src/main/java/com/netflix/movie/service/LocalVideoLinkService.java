package com.netflix.movie.service;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.movie.util.VideoFileValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

@Service
public class LocalVideoLinkService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.offline.import-dir:offline-import}")
    private String importDir;

    @Autowired
    private MovieRepository movieRepository;

    public List<String> linkVideosFromDisk() throws IOException {
        Path videosDir = Paths.get(uploadDir).toAbsolutePath().resolve("videos");
        Path importedDir = Paths.get(importDir).toAbsolutePath().normalize().resolve("imported");
        Files.createDirectories(videosDir);

        List<String> results = new ArrayList<>();
        List<Movie> movies = movieRepository.findAll();

        linkVideosInDirectory(videosDir, videosDir, movies, results);
        if (Files.isDirectory(importedDir)) {
            linkVideosInDirectory(importedDir, videosDir, movies, results);
        }

        if (results.isEmpty()) {
            results.add("No video files found to link.");
        }
        return results;
    }

    private void linkVideosInDirectory(Path sourceDir, Path videosDir, List<Movie> movies, List<String> results) throws IOException {
        try (Stream<Path> files = Files.list(sourceDir)) {
            files.filter(Files::isRegularFile)
                    .filter(p -> VideoFileValidator.isAllowedVideoFilename(p.getFileName().toString()))
                    .forEach(file -> linkVideoFile(file, videosDir, movies, results));
        }
    }

    private void linkVideoFile(Path file, Path videosDir, List<Movie> movies, List<String> results) {
        String fileName = file.getFileName().toString();
        String url = "/uploads/videos/" + fileName;
        Movie match = findMatchingMovie(fileName, movies);
        if (match == null) {
            results.add("No match for file: " + fileName);
            return;
        }

        Path target = videosDir.resolve(fileName);
        if (!file.toAbsolutePath().normalize().equals(target.toAbsolutePath().normalize())) {
            try {
                Files.copy(file, target, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                results.add("Could not copy " + fileName + " to uploads/videos: " + e.getMessage());
                return;
            }
        }

        if (url.equals(match.getVideoUrl())) {
            results.add("Already linked: " + match.getTitle());
            return;
        }

        match.setVideoUrl(url);
        movieRepository.save(match);
        results.add("Linked \"" + match.getTitle() + "\" -> " + fileName);
    }

    private Movie findMatchingMovie(String fileName, List<Movie> movies) {
        String normalizedFile = normalize(cleanReleaseName(baseName(fileName)));
        for (Movie movie : movies) {
            String normalizedTitle = normalize(movie.getTitle());
            if (normalizedTitle.length() < 3) {
                continue;
            }
            if (normalizedFile.equals(normalizedTitle)
                    || normalizedFile.startsWith(normalizedTitle + "19")
                    || normalizedFile.startsWith(normalizedTitle + "20")) {
                return movie;
            }
        }
        return null;
    }

    private String baseName(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(0, dot) : filename;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "");
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
}
