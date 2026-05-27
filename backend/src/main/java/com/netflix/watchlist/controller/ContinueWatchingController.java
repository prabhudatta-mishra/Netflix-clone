package com.netflix.watchlist.controller;

import com.netflix.watchlist.dto.ContinueWatchingResponse;
import com.netflix.watchlist.dto.ProgressRequest;
import com.netflix.watchlist.service.ContinueWatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/continue")
public class ContinueWatchingController {

    @Autowired
    private ContinueWatchingService continueWatchingService;

    @GetMapping
    public ResponseEntity<List<ContinueWatchingResponse>> getContinue(Authentication auth) {
        return ResponseEntity.ok(continueWatchingService.getContinueWatching(auth.getName()));
    }

    @PostMapping("/{movieId}")
    public ResponseEntity<ContinueWatchingResponse> saveProgress(
            Authentication auth, @PathVariable Long movieId, @RequestBody ProgressRequest request) {
        return ResponseEntity.ok(continueWatchingService.saveProgress(auth.getName(), movieId, request));
    }

    @DeleteMapping("/{movieId}")
    public ResponseEntity<Void> removeProgress(Authentication auth, @PathVariable Long movieId) {
        continueWatchingService.removeProgress(auth.getName(), movieId);
        return ResponseEntity.noContent().build();
    }
}
