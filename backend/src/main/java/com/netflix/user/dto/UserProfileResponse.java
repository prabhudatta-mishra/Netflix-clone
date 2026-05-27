package com.netflix.user.dto;

import com.netflix.watchlist.dto.WatchHistoryResponse;

import java.util.List;

public class UserProfileResponse {
    private String username;
    private String email;
    private String role;
    private int watchlistCount;
    private List<WatchHistoryResponse> watchHistory;

    public UserProfileResponse() {}

    public UserProfileResponse(String username, String email, String role,
                               int watchlistCount, List<WatchHistoryResponse> watchHistory) {
        this.username = username;
        this.email = email;
        this.role = role;
        this.watchlistCount = watchlistCount;
        this.watchHistory = watchHistory;
    }

    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public int getWatchlistCount() { return watchlistCount; }
    public List<WatchHistoryResponse> getWatchHistory() { return watchHistory; }
}
