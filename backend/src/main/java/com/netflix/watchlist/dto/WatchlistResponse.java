package com.netflix.watchlist.dto;

import java.time.LocalDateTime;

public class WatchlistResponse {

    private Long id;
    private Long movieId;
    private String title;
    private String genre;
    private String thumbnailUrl;
    private String videoUrl;
    private Double rating;
    private LocalDateTime addedAt;

    public WatchlistResponse() {}

    public WatchlistResponse(Long id, Long movieId, String title, String genre,
                             String thumbnailUrl, String videoUrl, Double rating, LocalDateTime addedAt) {
        this.id = id;
        this.movieId = movieId;
        this.title = title;
        this.genre = genre;
        this.thumbnailUrl = thumbnailUrl;
        this.videoUrl = videoUrl;
        this.rating = rating;
        this.addedAt = addedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public LocalDateTime getAddedAt() { return addedAt; }
    public void setAddedAt(LocalDateTime addedAt) { this.addedAt = addedAt; }
}
