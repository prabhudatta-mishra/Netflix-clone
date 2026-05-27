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
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

@Service
public class LocalVideoLinkService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Autowired
    private MovieRepository movieRepository;

    public List<String> linkVideosFromDisk() throws IOException {
        Path videosDir = Paths.get(uploadDir).toAbsolutePath().resolve("videos");
        if (!Files.isDirectory(videosDir)) {
            return List.of("No uploads/videos folder found.");
        }

        List<String> results = new ArrayList<>();
        List<Movie> movies = movieRepository.findAll();

        try (Stream<Path> files = Files.list(videosDir)) {
            files.filter(Files::isRegularFile)
                    .filter(p -> VideoFileValidator.isAllowedVideoFilename(p.getFileName().toString()))
                    .forEach(file -> {
                        String fileName = file.getFileName().toString();
                        String url = "/uploads/videos/" + fileName;
                        Movie match = findMatchingMovie(fileName, movies);
                        if (match == null) {
                            results.add("No match for file: " + fileName);
                            return;
                        }
                        if (url.equals(match.getVideoUrl())) {
                            results.add("Already linked: " + match.getTitle());
                            return;
                        }
                        match.setVideoUrl(url);
                        movieRepository.save(match);
                        results.add("Linked \"" + match.getTitle() + "\" → " + fileName);
                    });
        }
        return results;
    }

    private Movie findMatchingMovie(String fileName, List<Movie> movies) {
        String lowerFile = fileName.toLowerCase(Locale.ROOT);
        Movie best = null;
        int bestLen = 0;
        for (Movie movie : movies) {
            String title = movie.getTitle().toLowerCase(Locale.ROOT).trim();
            if (title.length() < 3) {
                continue;
            }
            if (lowerFile.contains(title.replace(" ", "")) || lowerFile.contains(title)) {
                if (title.length() > bestLen) {
                    best = movie;
                    bestLen = title.length();
                }
            }
        }
        return best;
    }
}
