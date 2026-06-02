package com.netflix.recommendation.dto;

public class BehaviorEventRequest {
    private Long movieId;
    private String eventType;
    private String queryText;
    private Integer watchSeconds;
    private String context;

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
}
