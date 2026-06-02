package com.netflix.watchlist.controller;

import com.netflix.watchlist.dto.RecommendationResponse;
import com.netflix.recommendation.dto.BehaviorEventRequest;
import com.netflix.recommendation.dto.RecommendationAnalyticsResponse;
import com.netflix.recommendation.service.AdvancedRecommendationService;
import com.netflix.watchlist.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private AdvancedRecommendationService advancedRecommendationService;

    @GetMapping
    public ResponseEntity<List<RecommendationResponse>> getRecommendations(Authentication auth) {
        return ResponseEntity.ok(recommendationService.getRecommendations(auth.getName()));
    }

    @GetMapping("/personalized")
    public ResponseEntity<List<RecommendationResponse>> personalized(
            Authentication auth,
            @RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok(advancedRecommendationService.personalized(auth.getName(), limit));
    }

    @GetMapping("/search")
    public ResponseEntity<List<RecommendationResponse>> semanticSearch(
            Authentication auth,
            @RequestParam String q,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(advancedRecommendationService.semanticSearch(auth.getName(), q, limit));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<RecommendationResponse>> trending(
            @RequestParam(defaultValue = "14") int days,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(advancedRecommendationService.trending(days, limit));
    }

    @GetMapping("/similar/{movieId}")
    public ResponseEntity<List<RecommendationResponse>> similar(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok(advancedRecommendationService.similar(movieId, limit));
    }

    @PostMapping("/events")
    public ResponseEntity<Void> track(Authentication auth, @RequestBody BehaviorEventRequest request) {
        advancedRecommendationService.trackEvent(auth.getName(), request);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/analytics")
    public ResponseEntity<RecommendationAnalyticsResponse> analytics(Authentication auth) {
        return ResponseEntity.ok(advancedRecommendationService.analytics(auth.getName()));
    }
}
