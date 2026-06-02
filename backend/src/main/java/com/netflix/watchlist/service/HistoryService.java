package com.netflix.watchlist.service;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import com.netflix.watchlist.dto.WatchHistoryResponse;
import com.netflix.watchlist.entity.WatchHistory;
import com.netflix.watchlist.repository.WatchHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HistoryService {

    @Autowired
    private WatchHistoryRepository watchHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private NotificationService notificationService;

    public List<WatchHistoryResponse> getHistory(String username) {
        User user = getUser(username);
        return watchHistoryRepository.findByUserIdOrderByWatchedAtDesc(user.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public WatchHistoryResponse recordWatch(String username, Long movieId) {
        User user = getUser(username);
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        WatchHistory history = new WatchHistory();
        history.setUserId(user.getId());
        history.setMovieId(movieId);
        WatchHistory saved = watchHistoryRepository.save(history);

        notificationService.createNotification(username, "Watch recorded",
                "You watched \"" + movie.getTitle() + "\"", "WATCH");
        return toResponse(saved);
    }

    public void deleteHistoryItem(String username, Long historyId) {
        User user = getUser(username);
        watchHistoryRepository.deleteByIdAndUserId(historyId, user.getId());
    }

    public void clearHistory(String username) {
        User user = getUser(username);
        watchHistoryRepository.deleteByUserId(user.getId());
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private WatchHistoryResponse toResponse(WatchHistory h) {
        Movie movie = movieRepository.findById(h.getMovieId()).orElse(null);
        return new WatchHistoryResponse(
                h.getId(),
                h.getMovieId(),
                movie != null ? movie.getTitle() : "Unknown",
                movie != null ? movie.getGenre() : "",
                movie != null ? movie.getThumbnailUrl() : "",
                h.getWatchedAt()
        );
    }
}
