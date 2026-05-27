package com.netflix.movie.service;

import com.netflix.movie.dto.MovieRatingSummary;
import com.netflix.movie.dto.ReviewRequest;
import com.netflix.movie.dto.ReviewResponse;
import com.netflix.movie.entity.Movie;
import com.netflix.movie.entity.Review;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.movie.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private MovieRepository movieRepository;

    public List<ReviewResponse> getReviewsForMovie(Long movieId) {
        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ReviewResponse addReview(String username, ReviewRequest request) {
        movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        reviewRepository.findByUsernameAndMovieId(username, request.getMovieId())
                .ifPresent(r -> { throw new RuntimeException("You already reviewed this movie"); });

        Review review = new Review();
        review.setUsername(username);
        review.setMovieId(request.getMovieId());
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review saved = reviewRepository.save(review);
        updateMovieAverageRating(request.getMovieId());
        return toResponse(saved);
    }

    public MovieRatingSummary getRatingSummary(Long movieId) {
        List<Review> reviews = reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId);
        if (reviews.isEmpty()) {
            Movie movie = movieRepository.findById(movieId).orElse(null);
            double rating = movie != null && movie.getRating() != null ? movie.getRating() : 0;
            return new MovieRatingSummary(movieId, rating, 0);
        }
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
        return new MovieRatingSummary(movieId, Math.round(avg * 10.0) / 10.0, reviews.size());
    }

    private void updateMovieAverageRating(Long movieId) {
        List<Review> reviews = reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId);
        if (reviews.isEmpty()) return;
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0);
        movieRepository.findById(movieId).ifPresent(m -> {
            m.setRating(Math.round(avg * 10.0) / 10.0);
            movieRepository.save(m);
        });
    }

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(r.getId(), r.getUsername(), r.getMovieId(),
                r.getRating(), r.getComment(), r.getCreatedAt());
    }
}
