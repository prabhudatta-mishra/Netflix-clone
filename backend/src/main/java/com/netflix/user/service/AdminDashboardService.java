package com.netflix.user.service;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.user.dto.AdminStatsResponse;
import com.netflix.user.dto.AdminUserSummaryResponse;
import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import com.netflix.watchlist.dto.WatchHistoryResponse;
import com.netflix.watchlist.entity.Watchlist;
import com.netflix.watchlist.repository.WatchlistRepository;
import com.netflix.watchlist.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    private WatchlistRepository watchlistRepository;

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
        List<String> catalogTitles = movieRepository.findAll().stream()
                .map(Movie::getTitle)
                .collect(Collectors.toList());

        Map<Long, String> movieTitles = movieRepository.findAll().stream()
                .collect(Collectors.toMap(Movie::getId, Movie::getTitle));

        return userRepository.findAll().stream()
                .map(user -> toUserSummary(user, catalogTitles, movieTitles))
                .collect(Collectors.toList());
    }

    private AdminUserSummaryResponse toUserSummary(User user, List<String> catalogTitles,
                                                   Map<Long, String> movieTitles) {
        List<String> watched = historyService.getHistory(user.getUsername()).stream()
                .map(WatchHistoryResponse::getTitle)
                .distinct()
                .collect(Collectors.toList());

        List<String> watchlist = watchlistRepository.findByUserId(user.getId()).stream()
                .map(Watchlist::getMovieId)
                .map(id -> movieTitles.getOrDefault(id, "Unknown"))
                .collect(Collectors.toList());

        return new AdminUserSummaryResponse(
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                catalogTitles,
                watched,
                watchlist
        );
    }
}
