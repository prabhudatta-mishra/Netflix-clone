package com.netflix.movie.repository;

import com.netflix.movie.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByMovieIdOrderByCreatedAtDesc(Long movieId);
    Optional<Review> findByUsernameAndMovieId(String username, Long movieId);
}
