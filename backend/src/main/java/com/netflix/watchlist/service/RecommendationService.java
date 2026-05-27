package com.netflix.watchlist.service;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import com.netflix.watchlist.dto.RecommendationResponse;
import com.netflix.watchlist.repository.WatchHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WatchHistoryRepository watchHistoryRepository;

    public List<RecommendationResponse> getRecommendations(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<String> preferredGenres = watchHistoryRepository.findWatchedGenresByUserId(user.getId());
        Set<Long> watchedIds = watchHistoryRepository.findByUserIdOrderByWatchedAtDesc(user.getId())
                .stream().map(h -> h.getMovieId()).collect(Collectors.toSet());

        Map<Long, Integer> collaborativeScores = collaborativeScores(user.getId(), watchedIds);

        List<Movie> allMovies = movieRepository.findAll();
        List<ScoredMovie> scored = new ArrayList<>();

        for (Movie movie : allMovies) {
            if (watchedIds.contains(movie.getId())) continue;

            double score = 0;
            String reason;

            if (preferredGenres.contains(movie.getGenre())) {
                score += 50;
                reason = "Because you watch " + movie.getGenre();
            } else if (!preferredGenres.isEmpty()) {
                score += 15;
                reason = "Trending in our catalog";
            } else {
                score += 25;
                reason = "Popular pick for new viewers";
            }

            if (movie.getRating() != null) {
                score += movie.getRating() * 5;
            }

            int collab = collaborativeScores.getOrDefault(movie.getId(), 0);
            if (collab > 0) {
                score += collab * 12;
                reason = "Users with similar taste also watched this";
            }

            score += Math.random() * 5;

            scored.add(new ScoredMovie(movie, score, reason));
        }

        return scored.stream()
                .sorted((a, b) -> Double.compare(b.score, a.score))
                .limit(12)
                .map(s -> new RecommendationResponse(
                        s.movie.getId(),
                        s.movie.getTitle(),
                        s.movie.getDescription(),
                        s.movie.getGenre(),
                        s.movie.getThumbnailUrl(),
                        s.movie.getBannerUrl(),
                        s.movie.getVideoUrl(),
                        s.movie.getRating(),
                        s.reason,
                        Math.min(99, Math.round(s.score))
                ))
                .collect(Collectors.toList());
    }

    private Map<Long, Integer> collaborativeScores(Long userId, Set<Long> watchedIds) {
        if (watchedIds.isEmpty()) return Map.of();
        List<Long> similarUsers = watchHistoryRepository.findSimilarUserIds(userId, new ArrayList<>(watchedIds));
        if (similarUsers.isEmpty()) return Map.of();

        List<Long> picks = watchHistoryRepository.findMoviesWatchedByUsers(
                similarUsers.subList(0, Math.min(15, similarUsers.size())),
                new ArrayList<>(watchedIds)
        );
        Map<Long, Integer> scores = new HashMap<>();
        int rank = picks.size();
        for (Long movieId : picks) {
            scores.put(movieId, rank--);
        }
        return scores;
    }

    private static class ScoredMovie {
        Movie movie;
        double score;
        String reason;
        ScoredMovie(Movie movie, double score, String reason) {
            this.movie = movie;
            this.score = score;
            this.reason = reason;
        }
    }
}
