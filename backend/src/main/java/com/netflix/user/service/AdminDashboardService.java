package com.netflix.user.service;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.ReviewRepository;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.recommendation.entity.UserBehaviorEvent;
import com.netflix.recommendation.repository.UserBehaviorEventRepository;
import com.netflix.user.dto.AdminFeedbackResponse;
import com.netflix.user.dto.AdminHealthResponse;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.LinkedHashMap;
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

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.offline.import-dir:offline-import}")
    private String importDir;

    public AdminStatsResponse getStats() {
        long uniqueMovieCount = movieRepository.findAll().stream()
                .map(movie -> normalizeTitle(movie.getTitle()))
                .distinct()
                .count();
        long uniqueWatchlistCount = watchlistRepository.findAll().stream()
                .map(item -> item.getUserId() + ":" + item.getMovieId())
                .distinct()
                .count();
        return new AdminStatsResponse(
                uniqueMovieCount,
                userRepository.count(),
                uniqueWatchlistCount
        );
    }

    public List<AdminUserSummaryResponse> getAllUsersWithActivity() {
        List<String> playableTitles = movieRepository.findAll().stream()
                .filter(movie -> movie.getVideoUrl() != null && !movie.getVideoUrl().isBlank())
                .map(Movie::getTitle)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, String> movieTitles = movieRepository.findAll().stream()
                .collect(Collectors.toMap(Movie::getId, Movie::getTitle));

        return userRepository.findAll().stream()
                .map(user -> toUserSummary(user, playableTitles, movieTitles))
                .collect(Collectors.toList());
    }

    public List<AdminFeedbackResponse> getRecentFeedback() {
        Map<Long, String> movieTitles = movieRepository.findAll().stream()
                .collect(Collectors.toMap(Movie::getId, Movie::getTitle));
        Map<Long, String> usernames = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        Map<String, UserBehaviorEvent> uniqueFeedback = new LinkedHashMap<>();
        behaviorEventRepository.findFeedbackEventsOrderByCreatedAtDesc().forEach(event ->
                uniqueFeedback.putIfAbsent(event.getUserId() + ":" + event.getMovieId() + ":" + event.getEventType(), event)
        );

        return uniqueFeedback.values().stream()
                .limit(50)
                .map(event -> new AdminFeedbackResponse(
                        event.getId(),
                        usernames.getOrDefault(event.getUserId(), "Unknown user"),
                        movieTitles.getOrDefault(event.getMovieId(), "Unknown movie"),
                        event.getEventType(),
                        event.getContext(),
                        event.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    public AdminHealthResponse getHealth() {
        boolean databaseOnline = true;
        long catalogMovies = 0;
        long feedbackEvents = 0;
        long watchHistoryEvents = 0;
        try {
            catalogMovies = movieRepository.count();
            feedbackEvents = behaviorEventRepository.count();
            watchHistoryEvents = watchHistoryRepository.count();
        } catch (RuntimeException ex) {
            databaseOnline = false;
        }

        Path videosPath = Paths.get(uploadDir).resolve("videos").toAbsolutePath().normalize();
        long localVideos = countMp4Files(videosPath);
        Path importPath = Paths.get(importDir).toAbsolutePath().normalize();

        return new AdminHealthResponse(
                true,
                databaseOnline,
                catalogMovies,
                localVideos,
                feedbackEvents,
                watchHistoryEvents,
                importPath.toString(),
                LocalDateTime.now().toString()
        );
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
                .distinct()
                .collect(Collectors.toList());

        List<UserBehaviorEvent> behaviorEvents = behaviorEventRepository.findTop100ByUserIdOrderByCreatedAtDesc(user.getId());
        List<String> liked = behaviorEvents.stream()
                .filter(event -> "LIKE".equalsIgnoreCase(event.getEventType()))
                .map(UserBehaviorEvent::getMovieId)
                .map(id -> movieTitles.getOrDefault(id, "Unknown"))
                .distinct()
                .collect(Collectors.toList());
        List<String> disliked = behaviorEvents.stream()
                .filter(event -> "DISLIKE".equalsIgnoreCase(event.getEventType()))
                .map(UserBehaviorEvent::getMovieId)
                .map(id -> movieTitles.getOrDefault(id, "Unknown"))
                .distinct()
                .collect(Collectors.toList());

        return new AdminUserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                catalogTitles,
                watched,
                watchlist,
                liked,
                disliked,
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

    private String normalizeTitle(String title) {
        return title == null ? "" : title.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    private long countMp4Files(Path folder) {
        if (!Files.isDirectory(folder)) return 0;
        try (var files = Files.list(folder)) {
            return files
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().toLowerCase().endsWith(".mp4"))
                    .count();
        } catch (IOException ex) {
            return 0;
        }
    }
}
