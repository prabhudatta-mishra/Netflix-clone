package com.netflix.user.service;

import com.netflix.user.dto.UserProfileResponse;
import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import com.netflix.watchlist.repository.WatchlistRepository;
import com.netflix.watchlist.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HistoryService historyService;

    @Autowired
    private WatchlistRepository watchlistRepository;

    public UserProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        int watchlistCount = watchlistRepository.findByUserId(user.getId()).size();
        return new UserProfileResponse(
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                watchlistCount,
                historyService.getHistory(username)
        );
    }
}
