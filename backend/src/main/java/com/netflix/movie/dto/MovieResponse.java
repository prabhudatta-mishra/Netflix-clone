package com.netflix.movie.dto;

import java.time.LocalDateTime;

public class MovieResponse {

    private Long id;
    private String title;
    private String description;
    private String genre;
    private Integer releaseYear;
    private String thumbnailUrl;
    private String bannerUrl;
    private String videoUrl;
    private String fallbackVideoUrls;
    private Double rating;
    private LocalDateTime createdAt;

    public MovieResponse() {}

    public MovieResponse(Long id, String title, String description, String genre,
                         Integer releaseYear, String thumbnailUrl, String bannerUrl,
                         String videoUrl, String fallbackVideoUrls, Double rating, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.genre = genre;
        this.releaseYear = releaseYear;
        this.thumbnailUrl = thumbnailUrl;
        this.bannerUrl = bannerUrl;
        this.videoUrl = videoUrl;
        this.fallbackVideoUrls = fallbackVideoUrls;
        this.rating = rating;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public Integer getReleaseYear() { return releaseYear; }
    public void setReleaseYear(Integer releaseYear) { this.releaseYear = releaseYear; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public String getFallbackVideoUrls() { return fallbackVideoUrls; }
    public void setFallbackVideoUrls(String fallbackVideoUrls) { this.fallbackVideoUrls = fallbackVideoUrls; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
