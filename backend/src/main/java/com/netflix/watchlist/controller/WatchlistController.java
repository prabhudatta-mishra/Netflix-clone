package com.netflix.watchlist.controller;

import com.netflix.watchlist.dto.WatchlistResponse;
import com.netflix.watchlist.service.WatchlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    @Autowired
    private WatchlistService watchlistService;

    @GetMapping
    public ResponseEntity<List<WatchlistResponse>> getWatchlist(Authentication authentication) {
        return ResponseEntity.ok(watchlistService.getWatchlist(authentication.getName()));
    }

    @PostMapping("/{movieId}")
    public ResponseEntity<WatchlistResponse> addToWatchlist(Authentication authentication, @PathVariable Long movieId) {
        return ResponseEntity.ok(watchlistService.addToWatchlist(authentication.getName(), movieId));
    }

    @DeleteMapping("/{movieId}")
    public ResponseEntity<Void> removeFromWatchlist(Authentication authentication, @PathVariable Long movieId) {
        watchlistService.removeFromWatchlist(authentication.getName(), movieId);
        return ResponseEntity.noContent().build();
    }
}
