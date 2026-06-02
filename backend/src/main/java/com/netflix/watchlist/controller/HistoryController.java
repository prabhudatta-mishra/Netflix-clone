package com.netflix.watchlist.controller;

import com.netflix.watchlist.dto.WatchHistoryResponse;
import com.netflix.watchlist.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    @Autowired
    private HistoryService historyService;

    @GetMapping
    public ResponseEntity<List<WatchHistoryResponse>> getHistory(Authentication auth) {
        return ResponseEntity.ok(historyService.getHistory(auth.getName()));
    }

    @PostMapping("/{movieId}")
    public ResponseEntity<WatchHistoryResponse> recordWatch(Authentication auth, @PathVariable Long movieId) {
        return ResponseEntity.ok(historyService.recordWatch(auth.getName(), movieId));
    }

    @DeleteMapping("/{historyId}")
    public ResponseEntity<Void> deleteHistoryItem(Authentication auth, @PathVariable Long historyId) {
        historyService.deleteHistoryItem(auth.getName(), historyId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/delete/{historyId}")
    public ResponseEntity<Void> deleteHistoryItemPost(Authentication auth, @PathVariable Long historyId) {
        historyService.deleteHistoryItem(auth.getName(), historyId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearHistory(Authentication auth) {
        historyService.clearHistory(auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/clear")
    public ResponseEntity<Void> clearHistoryPost(Authentication auth) {
        historyService.clearHistory(auth.getName());
        return ResponseEntity.noContent().build();
    }
}
