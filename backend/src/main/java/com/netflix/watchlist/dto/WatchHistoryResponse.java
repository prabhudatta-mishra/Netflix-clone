package com.netflix.watchlist.dto;

import java.time.LocalDateTime;

public class WatchHistoryResponse {
    private Long id;
    private Long movieId;
    private String title;
    private String genre;
    private String thumbnailUrl;
    private LocalDateTime watchedAt;

    public WatchHistoryResponse() {}

    public WatchHistoryResponse(Long id, Long movieId, String title, String genre,
                                String thumbnailUrl, LocalDateTime watchedAt) {
        this.id = id;
        this.movieId = movieId;
        this.title = title;
        this.genre = genre;
        this.thumbnailUrl = thumbnailUrl;
        this.watchedAt = watchedAt;
    }

    public Long getId() { return id; }
    public Long getMovieId() { return movieId; }
    public String getTitle() { return title; }
    public String getGenre() { return genre; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public LocalDateTime getWatchedAt() { return watchedAt; }
}
