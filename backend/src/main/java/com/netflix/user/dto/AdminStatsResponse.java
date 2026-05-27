package com.netflix.user.dto;

public class AdminStatsResponse {
    private long totalMovies;
    private long totalUsers;
    private long totalWatchlists;

    public AdminStatsResponse() {}

    public AdminStatsResponse(long totalMovies, long totalUsers, long totalWatchlists) {
        this.totalMovies = totalMovies;
        this.totalUsers = totalUsers;
        this.totalWatchlists = totalWatchlists;
    }

    public long getTotalMovies() { return totalMovies; }
    public long getTotalUsers() { return totalUsers; }
    public long getTotalWatchlists() { return totalWatchlists; }
}
