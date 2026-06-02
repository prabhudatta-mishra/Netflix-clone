package com.netflix.user.dto;

import java.util.List;

public class AdminUserSummaryResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private List<String> moviesCanWatch;
    private List<String> watchedMovies;
    private List<String> watchlistMovies;
    private int playableMovieCount;
    private int watchedMovieCount;
    private int watchlistMovieCount;
    private int totalWatchEvents;

    public AdminUserSummaryResponse() {}

    public AdminUserSummaryResponse(Long id, String username, String email, String role,
                                    List<String> moviesCanWatch,
                                    List<String> watchedMovies,
                                    List<String> watchlistMovies,
                                    int totalWatchEvents) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.moviesCanWatch = moviesCanWatch;
        this.watchedMovies = watchedMovies;
        this.watchlistMovies = watchlistMovies;
        this.playableMovieCount = moviesCanWatch.size();
        this.watchedMovieCount = watchedMovies.size();
        this.watchlistMovieCount = watchlistMovies.size();
        this.totalWatchEvents = totalWatchEvents;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public List<String> getMoviesCanWatch() { return moviesCanWatch; }
    public List<String> getWatchedMovies() { return watchedMovies; }
    public List<String> getWatchlistMovies() { return watchlistMovies; }
    public int getPlayableMovieCount() { return playableMovieCount; }
    public int getWatchedMovieCount() { return watchedMovieCount; }
    public int getWatchlistMovieCount() { return watchlistMovieCount; }
    public int getTotalWatchEvents() { return totalWatchEvents; }
}
