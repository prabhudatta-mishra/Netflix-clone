package com.netflix.user.dto;

import java.time.LocalDateTime;

public class AdminFeedbackResponse {
    private Long id;
    private String username;
    private String movieTitle;
    private String eventType;
    private String context;
    private LocalDateTime createdAt;

    public AdminFeedbackResponse(Long id, String username, String movieTitle, String eventType,
                                 String context, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.movieTitle = movieTitle;
        this.eventType = eventType;
        this.context = context;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getMovieTitle() { return movieTitle; }
    public String getEventType() { return eventType; }
    public String getContext() { return context; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
