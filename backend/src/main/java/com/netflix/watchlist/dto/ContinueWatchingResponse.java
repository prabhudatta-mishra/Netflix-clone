package com.netflix.watchlist.dto;

import java.time.LocalDateTime;

public class ContinueWatchingResponse {
    private Long movieId;
    private String title;
    private String genre;
    private String thumbnailUrl;
    private String videoUrl;
    private int progressSeconds;
    private int durationSeconds;
    private int progressPercent;
    private LocalDateTime updatedAt;

    public ContinueWatchingResponse() {}

    public ContinueWatchingResponse(Long movieId, String title, String genre, String thumbnailUrl,
                                  String videoUrl, int progressSeconds, int durationSeconds,
                                  int progressPercent, LocalDateTime updatedAt) {
        this.movieId = movieId;
        this.title = title;
        this.genre = genre;
        this.thumbnailUrl = thumbnailUrl;
        this.videoUrl = videoUrl;
        this.progressSeconds = progressSeconds;
        this.durationSeconds = durationSeconds;
        this.progressPercent = progressPercent;
        this.updatedAt = updatedAt;
    }

    public Long getMovieId() { return movieId; }
    public String getTitle() { return title; }
    public String getGenre() { return genre; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public String getVideoUrl() { return videoUrl; }
    public int getProgressSeconds() { return progressSeconds; }
    public int getDurationSeconds() { return durationSeconds; }
    public int getProgressPercent() { return progressPercent; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
