package com.netflix.user.service;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.ReviewRepository;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.recommendation.repository.UserBehaviorEventRepository;
import com.netflix.user.dto.AdminStatsResponse;
import com.netflix.user.dto.AdminUserSummaryResponse;
import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import com.netflix.watchlist.dto.WatchHistoryResponse;
import com.netflix.watchlist.entity.Watchlist;
import com.netflix.watchlist.repository.ContinueWatchingRepository;
import com.netflix.watchlist.repository.NotificationRepository;
import com.netflix.watchlist.repository.WatchHistoryRepository;
import com.netflix.watchlist.repository.WatchlistRepository;
import com.netflix.watchlist.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserBehaviorEventRepository behaviorEventRepository;

    @Autowired
    private WatchlistRepository watchlistRepository;

    @Autowired
    private WatchHistoryRepository watchHistoryRepository;

    @Autowired
    private ContinueWatchingRepository continueWatchingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private HistoryService historyService;

    public AdminStatsResponse getStats() {
        return new AdminStatsResponse(
                movieRepository.count(),
                userRepository.count(),
                watchlistRepository.count()
        );
    }

    public List<AdminUserSummaryResponse> getAllUsersWithActivity() {
        List<String> playableTitles = movieRepository.findAll().stream()
                .filter(movie -> movie.getVideoUrl() != null && !movie.getVideoUrl().isBlank())
                .map(Movie::getTitle)
                .collect(Collectors.toList());

        Map<Long, String> movieTitles = movieRepository.findAll().stream()
                .collect(Collectors.toMap(Movie::getId, Movie::getTitle));

        return userRepository.findAll().stream()
                .map(user -> toUserSummary(user, playableTitles, movieTitles))
                .collect(Collectors.toList());
    }

    private AdminUserSummaryResponse toUserSummary(User user, List<String> catalogTitles,
                                                   Map<Long, String> movieTitles) {
        List<WatchHistoryResponse> history = historyService.getHistory(user.getUsername());
        List<String> watched = history.stream()
                .map(WatchHistoryResponse::getTitle)
                .distinct()
                .collect(Collectors.toList());

        List<String> watchlist = watchlistRepository.findByUserId(user.getId()).stream()
                .map(Watchlist::getMovieId)
                .map(id -> movieTitles.getOrDefault(id, "Unknown"))
                .collect(Collectors.toList());

        return new AdminUserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                catalogTitles,
                watched,
                watchlist,
                history.size()
        );
    }

    @Transactional
    public void deleteUser(Long userId, String currentAdminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        deleteUserEntity(user, currentAdminUsername);
    }

    @Transactional
    public void deleteUserByUsername(String username, String currentAdminUsername) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        deleteUserEntity(user, currentAdminUsername);
    }

    private void deleteUserEntity(User user, String currentAdminUsername) {
        if (user.getUsername().equals(currentAdminUsername)) {
            throw new IllegalArgumentException("You cannot delete the admin account you are currently using.");
        }

        Long userId = user.getId();
        watchlistRepository.deleteByUserId(userId);
        watchHistoryRepository.deleteByUserId(userId);
        continueWatchingRepository.deleteByUserId(userId);
        notificationRepository.deleteByUserId(userId);
        reviewRepository.deleteByUsername(user.getUsername());
        behaviorEventRepository.deleteByUserId(userId);
        userRepository.delete(user);
    }
}
