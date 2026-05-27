package com.netflix.movie.controller;

import com.netflix.movie.dto.MovieRatingSummary;
import com.netflix.movie.dto.ReviewRequest;
import com.netflix.movie.dto.ReviewResponse;
import com.netflix.movie.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable Long movieId) {
        return ResponseEntity.ok(reviewService.getReviewsForMovie(movieId));
    }

    @GetMapping("/movie/{movieId}/summary")
    public ResponseEntity<MovieRatingSummary> getSummary(@PathVariable Long movieId) {
        return ResponseEntity.ok(reviewService.getRatingSummary(movieId));
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> addReview(Authentication auth, @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.addReview(auth.getName(), request));
    }
}
