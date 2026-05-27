package com.netflix.watchlist.service;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import com.netflix.watchlist.dto.*;
import com.netflix.watchlist.repository.WatchHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Netflix-style home catalog: trending (popularity), top-rated, new releases,
 * personalized rows, and genre shelves — same ideas as production Netflix rows.
 */
@Service
public class NetflixCatalogService {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WatchHistoryRepository watchHistoryRepository;

    @Autowired
    private RecommendationService recommendationService;

    public HomeCatalogResponse getHomeCatalog(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Movie> all = movieRepository.findAll();
        Map<Long, Long> watchCounts = loadWatchCounts();

        List<CatalogRowDto> rows = new ArrayList<>();

        List<RecommendationResponse> personalized = recommendationService.getRecommendations(username);
        if (!personalized.isEmpty()) {
            rows.add(new CatalogRowDto(
                    "top-picks",
                    "Top Picks for You",
                    "Personalized ranking (genre affinity + rating + collaborative signals)",
                    personalized.stream().map(this::fromRecommendation).limit(12).collect(Collectors.toList())
            ));
        }

        rows.add(new CatalogRowDto(
                "trending",
                "Trending Now",
                "Popularity algorithm: watch frequency × 10 + IMDb-style rating weight",
                trending(all, watchCounts, 15)
        ));

        rows.add(new CatalogRowDto(
                "top-rated",
                "Top Rated",
                "Highest audience score in catalog",
                topRated(all, 15)
        ));

        rows.add(new CatalogRowDto(
                "new-releases",
                "New on Netflix",
                "Sorted by release year and catalog date",
                newReleases(all, 15)
        ));

        List<CatalogMovieDto> collaborative = collaborativePicks(user.getId(), all);
        if (!collaborative.isEmpty()) {
            rows.add(new CatalogRowDto(
                    "watchers-also",
                    "Because You Watched Similar Titles",
                    "Collaborative filtering: users with overlapping watch history",
                    collaborative
            ));
        }

        Set<String> genres = all.stream().map(Movie::getGenre).filter(Objects::nonNull).collect(Collectors.toCollection(LinkedHashSet::new));
        for (String genre : genres) {
            List<CatalogMovieDto> genreMovies = all.stream()
                    .filter(m -> genre.equals(m.getGenre()))
                    .sorted(Comparator.comparing(Movie::getRating, Comparator.nullsLast(Comparator.reverseOrder())))
                    .limit(12)
                    .map(m -> toDto(m, null, null))
                    .collect(Collectors.toList());
            if (!genreMovies.isEmpty()) {
                rows.add(new CatalogRowDto(
                        "genre-" + genre.toLowerCase().replace(" ", "-"),
                        genre,
                        "Genre shelf — content-based filtering",
                        genreMovies
                ));
            }
        }

        CatalogMovieDto featured = rows.isEmpty() || rows.get(0).getMovies().isEmpty()
                ? (all.isEmpty() ? null : toDto(all.get(0), 98.0, "Featured"))
                : rows.get(0).getMovies().get(0);

        return new HomeCatalogResponse(featured, rows);
    }

    public List<CatalogMovieDto> getSimilarMovies(Long movieId) {
        Movie target = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        return movieRepository.findAll().stream()
                .filter(m -> !m.getId().equals(movieId))
                .map(m -> {
                    double score = 0;
                    if (target.getGenre() != null && target.getGenre().equals(m.getGenre())) score += 60;
                    if (target.getReleaseYear() != null && target.getReleaseYear().equals(m.getReleaseYear())) score += 15;
                    if (m.getRating() != null) score += m.getRating() * 4;
                    return new AbstractMap.SimpleEntry<>(m, score);
                })
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(12)
                .map(e -> toDto(e.getKey(), Math.min(99, e.getValue()), "Similar to " + target.getTitle()))
                .collect(Collectors.toList());
    }

    private Map<Long, Long> loadWatchCounts() {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : watchHistoryRepository.countWatchesByMovie()) {
            map.put((Long) row[0], (Long) row[1]);
        }
        return map;
    }

    private List<CatalogMovieDto> trending(List<Movie> all, Map<Long, Long> watchCounts, int limit) {
        return all.stream()
                .map(m -> {
                    long watches = watchCounts.getOrDefault(m.getId(), 0L);
                    double score = watches * 10 + (m.getRating() != null ? m.getRating() * 8 : 0);
                    return new AbstractMap.SimpleEntry<>(m, score);
                })
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(limit)
                .map(e -> toDto(e.getKey(), Math.min(99, e.getValue()), "Trending"))
                .collect(Collectors.toList());
    }

    private List<CatalogMovieDto> topRated(List<Movie> all, int limit) {
        return all.stream()
                .filter(m -> m.getRating() != null)
                .sorted(Comparator.comparing(Movie::getRating).reversed())
                .limit(limit)
                .map(m -> toDto(m, m.getRating() * 10, "Top rated"))
                .collect(Collectors.toList());
    }

    private List<CatalogMovieDto> newReleases(List<Movie> all, int limit) {
        return all.stream()
                .sorted(Comparator
                        .comparing(Movie::getReleaseYear, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Movie::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(limit)
                .map(m -> toDto(m, 88.0, "New release"))
                .collect(Collectors.toList());
    }

    private List<CatalogMovieDto> collaborativePicks(Long userId, List<Movie> all) {
        Set<Long> watched = watchHistoryRepository.findByUserIdOrderByWatchedAtDesc(userId)
                .stream().map(h -> h.getMovieId()).collect(Collectors.toSet());
        if (watched.isEmpty()) return List.of();

        List<Long> similarUsers = watchHistoryRepository.findSimilarUserIds(userId, new ArrayList<>(watched));
        if (similarUsers.isEmpty()) return List.of();

        List<Long> candidateIds = watchHistoryRepository.findMoviesWatchedByUsers(
                similarUsers.subList(0, Math.min(20, similarUsers.size())),
                new ArrayList<>(watched)
        );
        if (candidateIds.isEmpty()) return List.of();

        Map<Long, Movie> byId = all.stream().collect(Collectors.toMap(Movie::getId, m -> m));
        return candidateIds.stream()
                .filter(byId::containsKey)
                .limit(12)
                .map(id -> toDto(byId.get(id), 92.0, "Others with similar taste watched this"))
                .collect(Collectors.toList());
    }

    private CatalogMovieDto fromRecommendation(RecommendationResponse r) {
        return new CatalogMovieDto(
                r.getMovieId(), r.getTitle(), r.getDescription(), r.getGenre(),
                null, r.getThumbnailUrl(), r.getBannerUrl(), r.getVideoUrl(),
                r.getRating(), r.getMatchScore(), r.getReason()
        );
    }

    private CatalogMovieDto toDto(Movie m, Double matchScore, String reason) {
        return new CatalogMovieDto(
                m.getId(), m.getTitle(), m.getDescription(), m.getGenre(),
                m.getReleaseYear(), m.getThumbnailUrl(), m.getBannerUrl(), m.getVideoUrl(),
                m.getRating(), matchScore, reason
        );
    }
}
