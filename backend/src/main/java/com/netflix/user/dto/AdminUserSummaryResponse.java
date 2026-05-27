package com.netflix.user.dto;

import java.util.List;

public class AdminUserSummaryResponse {
    private String username;
    private String email;
    private String role;
    private List<String> moviesCanWatch;
    private List<String> watchedMovies;
    private List<String> watchlistMovies;

    public AdminUserSummaryResponse() {}

    public AdminUserSummaryResponse(String username, String email, String role,
                                    List<String> moviesCanWatch,
                                    List<String> watchedMovies,
                                    List<String> watchlistMovies) {
        this.username = username;
        this.email = email;
        this.role = role;
        this.moviesCanWatch = moviesCanWatch;
        this.watchedMovies = watchedMovies;
        this.watchlistMovies = watchlistMovies;
    }

    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public List<String> getMoviesCanWatch() { return moviesCanWatch; }
    public List<String> getWatchedMovies() { return watchedMovies; }
    public List<String> getWatchlistMovies() { return watchlistMovies; }
}
