package com.netflix.movie.dto;

public class MovieRatingSummary {
    private Long movieId;
    private double averageRating;
    private long reviewCount;

    public MovieRatingSummary() {}

    public MovieRatingSummary(Long movieId, double averageRating, long reviewCount) {
        this.movieId = movieId;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
    }

    public Long getMovieId() { return movieId; }
    public double getAverageRating() { return averageRating; }
    public long getReviewCount() { return reviewCount; }
}
