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

@Service
public class NetflixPlaybackService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Autowired
    private MovieRepository movieRepository;

    public PlaybackInfoResponse getPlaybackInfo(Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        String streamUrl = "/api/movies/" + movieId + "/stream";
        String videoUrl = movie.getVideoUrl();

        if (videoUrl == null || videoUrl.isBlank()) {
            return plan(movie, streamUrl, false,
                    "No video file for this movie. Admin: add file to offline-import and click Sync Movies.",
                    "missing", "none", "", "unknown", 0, false,
                    "Import a browser-playable H.264 MP4, then click Sync Movies.");
        }

        if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
            return plan(movie, streamUrl, true,
                    "Streaming from online source through playback redirect.",
                    "remote", "redirect", extension(videoUrl), codecHint(videoUrl), 0, true,
                    "Cache or mirror remote files locally, then add adaptive HLS renditions.");
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
}
