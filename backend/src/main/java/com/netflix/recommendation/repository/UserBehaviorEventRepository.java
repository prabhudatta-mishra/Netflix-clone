package com.netflix.recommendation.repository;

import com.netflix.recommendation.entity.UserBehaviorEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface UserBehaviorEventRepository extends JpaRepository<UserBehaviorEvent, Long> {
    List<UserBehaviorEvent> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<UserBehaviorEvent> findTop100ByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT e.movieId, COUNT(e) FROM UserBehaviorEvent e WHERE e.movieId IS NOT NULL AND e.createdAt >= :since GROUP BY e.movieId ORDER BY COUNT(e) DESC")
    List<Object[]> countEventsByMovieSince(LocalDateTime since);

    @Query("SELECT e.eventType, COUNT(e) FROM UserBehaviorEvent e WHERE e.userId = :userId GROUP BY e.eventType")
    List<Object[]> countEventsByType(Long userId);

    @Transactional
    void deleteByUserId(Long userId);
}
