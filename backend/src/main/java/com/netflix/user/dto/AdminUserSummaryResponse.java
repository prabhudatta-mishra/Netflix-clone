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
    private List<String> likedMovies;
    private List<String> dislikedMovies;
    private int playableMovieCount;
    private int watchedMovieCount;
    private int watchlistMovieCount;
    private int likedMovieCount;
    private int dislikedMovieCount;
    private int totalWatchEvents;

    public AdminUserSummaryResponse() {}

    public AdminUserSummaryResponse(Long id, String username, String email, String role,
                                    List<String> moviesCanWatch,
                                    List<String> watchedMovies,
                                    List<String> watchlistMovies,
                                    List<String> likedMovies,
                                    List<String> dislikedMovies,
                                    int totalWatchEvents) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.moviesCanWatch = moviesCanWatch;
        this.watchedMovies = watchedMovies;
        this.watchlistMovies = watchlistMovies;
        this.likedMovies = likedMovies;
        this.dislikedMovies = dislikedMovies;
        this.playableMovieCount = moviesCanWatch.size();
        this.watchedMovieCount = watchedMovies.size();
        this.watchlistMovieCount = watchlistMovies.size();
        this.likedMovieCount = likedMovies.size();
        this.dislikedMovieCount = dislikedMovies.size();
        this.totalWatchEvents = totalWatchEvents;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public List<String> getMoviesCanWatch() { return moviesCanWatch; }
    public List<String> getWatchedMovies() { return watchedMovies; }
    public List<String> getWatchlistMovies() { return watchlistMovies; }
    public List<String> getLikedMovies() { return likedMovies; }
    public List<String> getDislikedMovies() { return dislikedMovies; }
    public int getPlayableMovieCount() { return playableMovieCount; }
    public int getWatchedMovieCount() { return watchedMovieCount; }
    public int getWatchlistMovieCount() { return watchlistMovieCount; }
    public int getLikedMovieCount() { return likedMovieCount; }
    public int getDislikedMovieCount() { return dislikedMovieCount; }
    public int getTotalWatchEvents() { return totalWatchEvents; }
}
