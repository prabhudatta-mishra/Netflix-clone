package com.netflix.watchlist.service;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import com.netflix.watchlist.dto.WatchlistResponse;
import com.netflix.watchlist.entity.Watchlist;
import com.netflix.watchlist.repository.WatchlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WatchlistService {

    @Autowired
    private WatchlistRepository watchlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private NotificationService notificationService;

    public List<WatchlistResponse> getWatchlist(String username) {
        User user = getUser(username);

        return watchlistRepository.findByUserId(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public WatchlistResponse addToWatchlist(String username, Long movieId) {
        User user = getUser(username);

        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found with id: " + movieId));

        if (watchlistRepository.existsByUserIdAndMovieId(user.getId(), movieId)) {
            throw new RuntimeException("Movie already in watchlist");
        }

        Watchlist item = new Watchlist();
        item.setUserId(user.getId());
        item.setMovieId(movie.getId());
        Watchlist saved = watchlistRepository.save(item);
        notificationService.createNotification(username, "Added to My List",
                "\"" + movie.getTitle() + "\" was added to your watchlist", "WATCHLIST");
        return toResponse(saved);
    }

    @Transactional
    public void removeFromWatchlist(String username, Long movieId) {
        User user = getUser(username);

        if (!watchlistRepository.existsByUserIdAndMovieId(user.getId(), movieId)) {
            throw new RuntimeException("Movie not found in watchlist");
        }

        watchlistRepository.deleteByUserIdAndMovieId(user.getId(), movieId);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    private WatchlistResponse toResponse(Watchlist watchlist) {
        Movie movie = movieRepository.findById(watchlist.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        return new WatchlistResponse(
                watchlist.getId(),
                movie.getId(),
                movie.getTitle(),
                movie.getGenre(),
                movie.getThumbnailUrl(),
                movie.getVideoUrl(),
                movie.getRating(),
                watchlist.getAddedAt()
        );
    }
}
