package com.netflix.watchlist.service;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import com.netflix.watchlist.dto.ContinueWatchingResponse;
import com.netflix.watchlist.dto.ProgressRequest;
import com.netflix.watchlist.entity.ContinueWatching;
import com.netflix.watchlist.repository.ContinueWatchingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContinueWatchingService {

    @Autowired
    private ContinueWatchingRepository continueWatchingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    public List<ContinueWatchingResponse> getContinueWatching(String username) {
        User user = getUser(username);
        return continueWatchingRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .filter(c -> {
                    int pct = c.getDurationSeconds() > 0
                            ? (c.getProgressSeconds() * 100 / c.getDurationSeconds()) : 0;
                    return c.getProgressSeconds() > 0 && pct < 95;
                })
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ContinueWatchingResponse saveProgress(String username, Long movieId, ProgressRequest request) {
        User user = getUser(username);
        movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        ContinueWatching cw = continueWatchingRepository
                .findByUserIdAndMovieId(user.getId(), movieId)
                .orElse(new ContinueWatching());

        cw.setUserId(user.getId());
        cw.setMovieId(movieId);
        cw.setProgressSeconds(request.getProgressSeconds());
        cw.setDurationSeconds(request.getDurationSeconds());
        cw.setUpdatedAt(LocalDateTime.now());

        return toResponse(continueWatchingRepository.save(cw));
    }

    @Transactional
    public void removeProgress(String username, Long movieId) {
        User user = getUser(username);
        continueWatchingRepository.deleteByUserIdAndMovieId(user.getId(), movieId);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private ContinueWatchingResponse toResponse(ContinueWatching cw) {
        Movie movie = movieRepository.findById(cw.getMovieId()).orElse(null);
        int percent = cw.getDurationSeconds() > 0
                ? (int) ((cw.getProgressSeconds() * 100.0) / cw.getDurationSeconds())
                : 0;
        return new ContinueWatchingResponse(
                cw.getMovieId(),
                movie != null ? movie.getTitle() : "Unknown",
                movie != null ? movie.getGenre() : "",
                movie != null ? movie.getThumbnailUrl() : "",
                movie != null ? movie.getVideoUrl() : "",
                cw.getProgressSeconds(),
                cw.getDurationSeconds(),
                Math.min(percent, 100),
                cw.getUpdatedAt()
        );
    }
}
