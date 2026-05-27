package com.netflix.watchlist.controller;

import com.netflix.watchlist.dto.RecommendationResponse;
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

    @GetMapping
    public ResponseEntity<List<RecommendationResponse>> getRecommendations(Authentication auth) {
        return ResponseEntity.ok(recommendationService.getRecommendations(auth.getName()));
    }
}
