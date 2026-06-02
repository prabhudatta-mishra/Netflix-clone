package com.netflix.watchlist.repository;

import com.netflix.watchlist.entity.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {
    List<Watchlist> findByUserId(Long userId);
    boolean existsByUserIdAndMovieId(Long userId, Long movieId);

    @Transactional
    void deleteByUserIdAndMovieId(Long userId, Long movieId);

    @Transactional
    void deleteByUserId(Long userId);
}
