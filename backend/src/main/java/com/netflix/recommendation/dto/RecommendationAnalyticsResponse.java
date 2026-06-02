package com.netflix.recommendation.dto;

import java.util.List;
import java.util.Map;

public class RecommendationAnalyticsResponse {
    private String cluster;
    private Map<String, Long> eventCounts;
    private Map<String, Double> genreAffinity;
    private List<String> topSignals;

    public RecommendationAnalyticsResponse(String cluster, Map<String, Long> eventCounts,
                                           Map<String, Double> genreAffinity, List<String> topSignals) {
        this.cluster = cluster;
        this.eventCounts = eventCounts;
        this.genreAffinity = genreAffinity;
        this.topSignals = topSignals;
    }

    public String getCluster() { return cluster; }
    public Map<String, Long> getEventCounts() { return eventCounts; }
    public Map<String, Double> getGenreAffinity() { return genreAffinity; }
    public List<String> getTopSignals() { return topSignals; }
}
