package com.netflix.movie.service;

import com.netflix.movie.dto.PlaybackInfoResponse;
import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

@Service
public class NetflixPlaybackService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.offline.import-dir:offline-import}")
    private String importDir;

    @Autowired
    private MovieRepository movieRepository;

    public PlaybackInfoResponse getPlaybackInfo(Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        String streamUrl = "/api/movies/" + movieId + "/stream";
        String videoUrl = movie.getVideoUrl();
        Optional<Path> localMatch = findMatchingLocalVideo(movie.getTitle());
        boolean seededDemoUrl = videoUrl != null && videoUrl.contains("commondatastorage.googleapis.com/gtv-videos-bucket/sample");

        if (localMatch.isPresent() && (videoUrl == null || videoUrl.isBlank() || seededDemoUrl)) {
            Path file = localMatch.get();
            return plan(movie, streamUrl, true,
                    "Ready to play local file: " + file.getFileName(),
                    "local", "byte-range", extension(file.getFileName().toString()),
                    codecHint(file.getFileName().toString()), fileSize(file), true,
                    "Local file takes priority over demo URLs.");
        }

        if (videoUrl == null || videoUrl.isBlank()) {
            String demoUrl = demoVideoUrl(movie.getTitle());
            return plan(movie, demoUrl, true,
                    "Streaming from online demo source.",
                    "remote", "redirect", extension(demoUrl), codecHint(demoUrl), 0, true,
                    "For production, upload or import the movie file locally.");
        }

        if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
            return plan(movie, videoUrl, true,
                    "Streaming from online demo source.",
                    "remote", "redirect", extension(videoUrl), codecHint(videoUrl), 0, true,
                    "For production, upload or import the movie file locally.");
        }

        Path file = resolveLocalFile(videoUrl);
        if (!Files.isRegularFile(file)) {
            return plan(movie, streamUrl, false,
                    "Video file missing on server. Admin: copy movie to offline-import folder -> Sync Movies.",
                    "missing", "none", extension(videoUrl), codecHint(videoUrl), 0, false,
                    "Re-import the movie so the database points to an existing file.");
        }

        String codecHint = codecHint(file.getFileName().toString());
        String message = "Ready to play with byte-range streaming.";
        String nextUpgrade = "Generate HLS/DASH adaptive renditions: 360p, 720p, 1080p, subtitles, and preview thumbnails.";
        if (codecHint.contains("HEVC")) {
            message = "HEVC/x265 file may not play in Chrome. Convert to H.264 MP4 for best browser playback.";
            nextUpgrade = "Transcode this movie to H.264 MP4 first, then add adaptive HLS renditions.";
        }

        return plan(movie, streamUrl, true, message,
                "local", "byte-range", extension(file.getFileName().toString()), codecHint,
                fileSize(file), true, nextUpgrade);
    }

    private Path resolveLocalFile(String videoUrl) {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (videoUrl.startsWith("/uploads/")) {
            return base.resolve(videoUrl.substring("/uploads/".length()));
        }
        if (videoUrl.startsWith("uploads/")) {
            return base.resolve(videoUrl.substring("uploads/".length()));
        }
        return base.resolve("videos").resolve(videoUrl);
    }

    private PlaybackInfoResponse plan(Movie movie, String streamUrl, boolean ready, String message,
                                      String sourceType, String deliveryMode, String container,
                                      String codecHint, long fileSizeBytes, boolean rangeRequestsSupported,
                                      String nextUpgrade) {
        return new PlaybackInfoResponse(
                movie.getId(),
                movie.getTitle(),
                streamUrl,
                ready,
                message,
                sourceType,
                deliveryMode,
                container,
                codecHint,
                fileSizeBytes,
                rangeRequestsSupported,
                nextUpgrade
        );
    }

    private String extension(String value) {
        if (value == null) {
            return "";
        }
        int query = value.indexOf('?');
        String clean = query >= 0 ? value.substring(0, query) : value;
        int dot = clean.lastIndexOf('.');
        return dot >= 0 ? clean.substring(dot + 1).toLowerCase(Locale.ROOT) : "";
    }

    private String codecHint(String filenameOrUrl) {
        String value = filenameOrUrl == null ? "" : filenameOrUrl.toLowerCase(Locale.ROOT);
        if (value.contains("hevc") || value.contains("x265") || value.contains("h265") || value.contains("10bit")) {
            return "HEVC/x265; limited browser support";
        }
        if (value.endsWith(".mp4") || value.contains(".mp4?")) {
            return "Likely H.264/AAC MP4; best browser support";
        }
        if (value.endsWith(".webm") || value.contains(".webm?")) {
            return "WebM; good browser support";
        }
        if (value.endsWith(".mkv") || value.endsWith(".avi") || value.endsWith(".mov")) {
            return "Container may need transcoding for browser playback";
        }
        return "unknown";
    }

    private long fileSize(Path file) {
        try {
            return Files.size(file);
        } catch (IOException e) {
            return 0;
        }
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
