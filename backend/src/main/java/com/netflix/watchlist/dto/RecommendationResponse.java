package com.netflix.watchlist.dto;

public class RecommendationResponse {
    private Long movieId;
    private String title;
    private String description;
    private String genre;
    private String thumbnailUrl;
    private String bannerUrl;
    private String videoUrl;
    private Double rating;
    private String reason;
    private double matchScore;

    public RecommendationResponse() {}

    public RecommendationResponse(Long movieId, String title, String description, String genre,
                                String thumbnailUrl, String bannerUrl, String videoUrl,
                                Double rating, String reason, double matchScore) {
        this.movieId = movieId;
        this.title = title;
        this.description = description;
        this.genre = genre;
        this.thumbnailUrl = thumbnailUrl;
        this.bannerUrl = bannerUrl;
        this.videoUrl = videoUrl;
        this.rating = rating;
        this.reason = reason;
        this.matchScore = matchScore;
    }

    public Long getMovieId() { return movieId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getGenre() { return genre; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public String getBannerUrl() { return bannerUrl; }
    public String getVideoUrl() { return videoUrl; }
    public Double getRating() { return rating; }
    public String getReason() { return reason; }
    public double getMatchScore() { return matchScore; }
}
