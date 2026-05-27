package com.netflix.watchlist.dto;

public class CatalogMovieDto {
    private Long id;
    private String title;
    private String description;
    private String genre;
    private Integer releaseYear;
    private String thumbnailUrl;
    private String bannerUrl;
    private String videoUrl;
    private Double rating;
    private Double matchScore;
    private String reason;

    public CatalogMovieDto() {}

    public CatalogMovieDto(Long id, String title, String description, String genre,
                           Integer releaseYear, String thumbnailUrl, String bannerUrl,
                           String videoUrl, Double rating, Double matchScore, String reason) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.genre = genre;
        this.releaseYear = releaseYear;
        this.thumbnailUrl = thumbnailUrl;
        this.bannerUrl = bannerUrl;
        this.videoUrl = videoUrl;
        this.rating = rating;
        this.matchScore = matchScore;
        this.reason = reason;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getGenre() { return genre; }
    public Integer getReleaseYear() { return releaseYear; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public String getBannerUrl() { return bannerUrl; }
    public String getVideoUrl() { return videoUrl; }
    public Double getRating() { return rating; }
    public Double getMatchScore() { return matchScore; }
    public String getReason() { return reason; }
}
