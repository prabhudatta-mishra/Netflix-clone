package com.netflix.recommendation.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_behavior_events",
        indexes = {
                @Index(name = "idx_behavior_user_time", columnList = "user_id,created_at"),
                @Index(name = "idx_behavior_movie", columnList = "movie_id"),
                @Index(name = "idx_behavior_type", columnList = "event_type")
        })
public class UserBehaviorEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "movie_id")
    private Long movieId;

    @Column(name = "event_type", nullable = false, length = 40)
    private String eventType;

    @Column(name = "query_text", length = 255)
    private String queryText;

    @Column(name = "watch_seconds")
    private Integer watchSeconds;

    @Column(name = "context", length = 120)
    private String context;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getQueryText() { return queryText; }
    public void setQueryText(String queryText) { this.queryText = queryText; }
    public Integer getWatchSeconds() { return watchSeconds; }
    public void setWatchSeconds(Integer watchSeconds) { this.watchSeconds = watchSeconds; }
    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
