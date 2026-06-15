package com.netflix.watchlist.repository;

import com.netflix.watchlist.entity.WatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {
    List<WatchHistory> findByUserIdOrderByWatchedAtDesc(Long userId);
    java.util.Optional<WatchHistory> findByUserIdAndMovieId(Long userId, Long movieId);

    @Query("SELECT DISTINCT m.genre FROM WatchHistory h, com.netflix.movie.entity.Movie m WHERE h.movieId = m.id AND h.userId = :userId")
    List<String> findWatchedGenresByUserId(Long userId);

    @Query("SELECT h.movieId, COUNT(h) FROM WatchHistory h GROUP BY h.movieId ORDER BY COUNT(h) DESC")
    List<Object[]> countWatchesByMovie();

    @Query("SELECT DISTINCT h.userId FROM WatchHistory h WHERE h.userId <> :userId AND h.movieId IN :movieIds")
    List<Long> findSimilarUserIds(Long userId, List<Long> movieIds);

    @Query("SELECT h.movieId FROM WatchHistory h WHERE h.userId IN :userIds AND h.movieId NOT IN :excludeIds GROUP BY h.movieId ORDER BY COUNT(h) DESC")
    List<Long> findMoviesWatchedByUsers(List<Long> userIds, List<Long> excludeIds);

    @Transactional
    void deleteByUserId(Long userId);

    @Transactional
    void deleteByIdAndUserId(Long id, Long userId);
}
