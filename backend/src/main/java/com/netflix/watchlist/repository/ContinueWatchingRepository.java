package com.netflix.watchlist.repository;

import com.netflix.watchlist.entity.ContinueWatching;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ContinueWatchingRepository extends JpaRepository<ContinueWatching, Long> {
    List<ContinueWatching> findByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<ContinueWatching> findByUserIdAndMovieId(Long userId, Long movieId);

    @Transactional
    void deleteByUserIdAndMovieId(Long userId, Long movieId);

    @Transactional
    void deleteByUserId(Long userId);
}
