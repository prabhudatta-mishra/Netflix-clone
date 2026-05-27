package com.netflix.movie.dto;

import java.time.LocalDateTime;

public class ReviewResponse {

    private Long id;
    private String username;
    private Long movieId;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;

    public ReviewResponse() {}

    public ReviewResponse(Long id, String username, Long movieId, int rating,
                          String comment, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.movieId = movieId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public Long getMovieId() { return movieId; }
    public int getRating() { return rating; }
    public String getComment() { return comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
