package com.netflix.recommendation.service;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.recommendation.dto.BehaviorEventRequest;
import com.netflix.recommendation.dto.RecommendationAnalyticsResponse;
import com.netflix.recommendation.entity.UserBehaviorEvent;
import com.netflix.recommendation.repository.UserBehaviorEventRepository;
import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import com.netflix.watchlist.dto.RecommendationResponse;
import com.netflix.watchlist.entity.WatchHistory;
import com.netflix.watchlist.repository.WatchHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdvancedRecommendationService {

    private static final Set<String> ALLOWED_EVENTS = Set.of(
            "IMPRESSION", "CLICK", "PLAY", "COMPLETE", "SEARCH", "ADD_TO_LIST", "REMOVE_FROM_LIST", "LIKE", "DISLIKE"
    );

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WatchHistoryRepository watchHistoryRepository;

    @Autowired
    private UserBehaviorEventRepository behaviorRepository;

    public void trackEvent(String username, BehaviorEventRequest request) {
        User user = getUser(username);
        String eventType = normalizeEvent(request.getEventType());

        UserBehaviorEvent event = new UserBehaviorEvent();
        event.setUserId(user.getId());
        event.setMovieId(request.getMovieId());
        event.setEventType(eventType);
        event.setQueryText(trim(request.getQueryText(), 255));
        event.setContext(trim(request.getContext(), 120));
        event.setWatchSeconds(request.getWatchSeconds());
        behaviorRepository.save(event);
    }

    public List<RecommendationResponse> personalized(String username, int limit) {
        User user = getUser(username);
        List<Movie> all = playableMovies();
        Set<Long> watchedIds = watchHistoryRepository.findByUserIdOrderByWatchedAtDesc(user.getId())
                .stream().map(WatchHistory::getMovieId).collect(Collectors.toSet());
        List<UserBehaviorEvent> events = behaviorRepository.findTop100ByUserIdOrderByCreatedAtDesc(user.getId());
        Map<String, Double> affinity = genreAffinity(user.getId(), events);
        Map<Long, Integer> collaborative = collaborativeScores(user.getId(), watchedIds);
        Map<Long, Long> trending = trendingCounts(14);
        List<Double> userVector = userVector(user.getId(), events);

        return all.stream()
                .filter(movie -> !watchedIds.contains(movie.getId()))
                .map(movie -> scoreMovie(movie, affinity, collaborative, trending, userVector, events, watchedIds.isEmpty()))
                .sorted(Comparator.comparing(ScoredMovie::score).reversed())
                .limit(Math.max(1, Math.min(limit, 50)))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<RecommendationResponse> semanticSearch(String username, String query, int limit) {
        User user = getUser(username);
        BehaviorEventRequest event = new BehaviorEventRequest();
        event.setEventType("SEARCH");
        event.setQueryText(query);
        event.setContext("semantic-search");
        trackEvent(username, event);

        List<Double> queryVector = textVector(query);
        Map<String, Double> affinity = genreAffinity(user.getId(), behaviorRepository.findTop100ByUserIdOrderByCreatedAtDesc(user.getId()));

        return playableMovies().stream()
                .map(movie -> {
                    double semantic = cosine(queryVector, movieVector(movie)) * 70;
                    double titleBoost = containsIgnoreCase(movie.getTitle(), query) ? 35 : 0;
                    double genreBoost = containsIgnoreCase(movie.getGenre(), query) ? 25 : 0;
                    double personalization = affinity.getOrDefault(movie.getGenre(), 0.0) * 12;
                    double quality = rating(movie) * 3;
                    String reason = semantic > 25 ? "Semantic match for your search" : "Ranked by title, genre, and taste";
                    return new ScoredMovie(movie, semantic + titleBoost + genreBoost + personalization + quality, reason);
                })
                .sorted(Comparator.comparing(ScoredMovie::score).reversed())
                .limit(Math.max(1, Math.min(limit, 50)))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<RecommendationResponse> trending(int days, int limit) {
        Map<Long, Long> events = trendingCounts(days);
        Map<Long, Long> watches = watchCounts();
        return playableMovies().stream()
                .map(movie -> {
                    double score = events.getOrDefault(movie.getId(), 0L) * 8
                            + watches.getOrDefault(movie.getId(), 0L) * 10
                            + rating(movie) * 7;
                    return new ScoredMovie(movie, score, "Trending from recent plays, clicks, and watch history");
                })
                .sorted(Comparator.comparing(ScoredMovie::score).reversed())
                .limit(Math.max(1, Math.min(limit, 50)))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<RecommendationResponse> similar(Long movieId, int limit) {
        Movie target = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        List<Double> targetVector = movieVector(target);
        return playableMovies().stream()
                .filter(movie -> !movie.getId().equals(movieId))
                .map(movie -> {
                    double score = cosine(targetVector, movieVector(movie)) * 80
                            + (Objects.equals(target.getGenre(), movie.getGenre()) ? 25 : 0)
                            + rating(movie) * 2;
                    return new ScoredMovie(movie, score, "Similar content embedding and genre profile");
                })
                .sorted(Comparator.comparing(ScoredMovie::score).reversed())
                .limit(Math.max(1, Math.min(limit, 50)))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public RecommendationAnalyticsResponse analytics(String username) {
        User user = getUser(username);
        List<Object[]> counts = behaviorRepository.countEventsByType(user.getId());
        Map<String, Long> eventCounts = new LinkedHashMap<>();
        for (Object[] row : counts) {
            eventCounts.put(String.valueOf(row[0]), (Long) row[1]);
        }
        List<UserBehaviorEvent> events = behaviorRepository.findTop100ByUserIdOrderByCreatedAtDesc(user.getId());
        Map<String, Double> affinity = genreAffinity(user.getId(), events);
        String cluster = clusterName(affinity);
        List<String> signals = affinity.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(5)
                .map(e -> e.getKey() + " affinity " + Math.round(e.getValue() * 100) + "%")
                .collect(Collectors.toList());
        return new RecommendationAnalyticsResponse(cluster, eventCounts, affinity, signals);
    }

    private ScoredMovie scoreMovie(Movie movie, Map<String, Double> affinity, Map<Long, Integer> collaborative,
                                   Map<Long, Long> trending, List<Double> userVector,
                                   List<UserBehaviorEvent> events, boolean coldStart) {
        double content = affinity.getOrDefault(movie.getGenre(), 0.0) * 42;
        double collab = collaborative.getOrDefault(movie.getId(), 0) * 12;
        double embedding = cosine(userVector, movieVector(movie)) * 35;
        double velocity = trending.getOrDefault(movie.getId(), 0L) * 4;
        double quality = rating(movie) * 5;
        double bandit = explorationBonus(movie, events);
        double coldStartBoost = coldStart ? quality + velocity + bandit : 0;
        double score = content + collab + embedding + velocity + quality + bandit + coldStartBoost;
        String reason = reason(movie, content, collab, embedding, velocity, coldStart);
        return new ScoredMovie(movie, score, reason);
    }

    private String reason(Movie movie, double content, double collab, double embedding, double velocity, boolean coldStart) {
        if (coldStart) return "Popular starter pick with strong catalog quality";
        if (collab > content && collab > embedding) return "Users with similar taste watched this";
        if (embedding > content) return "Semantic match to your recent viewing";
        if (velocity > 10) return "Trending right now";
        return "Because you watch " + (movie.getGenre() == null ? "similar titles" : movie.getGenre());
    }

    private double explorationBonus(Movie movie, List<UserBehaviorEvent> events) {
        long impressions = events.stream()
                .filter(e -> movie.getId().equals(e.getMovieId()) && "IMPRESSION".equals(e.getEventType()))
                .count();
        long clicks = events.stream()
                .filter(e -> movie.getId().equals(e.getMovieId()) && ("CLICK".equals(e.getEventType()) || "PLAY".equals(e.getEventType())))
                .count();
        return 8.0 / Math.sqrt(1 + impressions) + clicks * 2;
    }

    private Map<String, Double> genreAffinity(Long userId, List<UserBehaviorEvent> events) {
        Map<String, Double> scores = new HashMap<>();
        for (WatchHistory history : watchHistoryRepository.findByUserIdOrderByWatchedAtDesc(userId)) {
            movieRepository.findById(history.getMovieId()).ifPresent(movie ->
                    scores.merge(movie.getGenre(), 4.0, Double::sum));
        }
        for (UserBehaviorEvent event : events) {
            if (event.getMovieId() == null) continue;
            movieRepository.findById(event.getMovieId()).ifPresent(movie ->
                    scores.merge(movie.getGenre(), eventWeight(event), Double::sum));
        }
        double total = scores.values().stream().mapToDouble(Double::doubleValue).sum();
        if (total <= 0) return Map.of();
        return scores.entrySet().stream()
                .filter(e -> e.getKey() != null)
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue() / total));
    }

    private double eventWeight(UserBehaviorEvent event) {
        return switch (event.getEventType()) {
            case "COMPLETE" -> 6;
            case "PLAY" -> 4 + Math.min(4, Optional.ofNullable(event.getWatchSeconds()).orElse(0) / 600.0);
            case "ADD_TO_LIST", "LIKE" -> 3;
            case "CLICK" -> 1.5;
            case "DISLIKE", "REMOVE_FROM_LIST" -> -3;
            default -> 0.4;
        };
    }

    private List<Double> userVector(Long userId, List<UserBehaviorEvent> events) {
        List<List<Double>> vectors = new ArrayList<>();
        for (WatchHistory history : watchHistoryRepository.findByUserIdOrderByWatchedAtDesc(userId)) {
            movieRepository.findById(history.getMovieId()).ifPresent(movie -> vectors.add(movieVector(movie)));
        }
        for (UserBehaviorEvent event : events) {
            if (event.getMovieId() == null) continue;
            movieRepository.findById(event.getMovieId()).ifPresent(movie -> vectors.add(movieVector(movie)));
        }
        return average(vectors);
    }

    private List<Double> movieVector(Movie movie) {
        return textVector(String.join(" ",
                safe(movie.getTitle()),
                safe(movie.getGenre()),
                safe(movie.getDescription()),
                String.valueOf(movie.getReleaseYear()),
                String.valueOf(movie.getRating())
        ));
    }

    private List<Double> textVector(String text) {
        double[] vector = new double[32];
        for (String token : safe(text).toLowerCase(Locale.ROOT).split("[^a-z0-9]+")) {
            if (token.isBlank()) continue;
            int bucket = Math.floorMod(token.hashCode(), vector.length);
            vector[bucket] += 1.0;
        }
        double norm = Math.sqrt(Arrays.stream(vector).map(v -> v * v).sum());
        List<Double> result = new ArrayList<>();
        for (double v : vector) {
            result.add(norm == 0 ? 0 : v / norm);
        }
        return result;
    }

    private List<Double> average(List<List<Double>> vectors) {
        if (vectors.isEmpty()) return Collections.nCopies(32, 0.0);
        double[] sum = new double[32];
        for (List<Double> vector : vectors) {
            for (int i = 0; i < Math.min(32, vector.size()); i++) {
                sum[i] += vector.get(i);
            }
        }
        List<Double> avg = new ArrayList<>();
        for (double v : sum) {
            avg.add(v / vectors.size());
        }
        return avg;
    }

    private double cosine(List<Double> a, List<Double> b) {
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < Math.min(a.size(), b.size()); i++) {
            dot += a.get(i) * b.get(i);
            na += a.get(i) * a.get(i);
            nb += b.get(i) * b.get(i);
        }
        return na == 0 || nb == 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    private Map<Long, Integer> collaborativeScores(Long userId, Set<Long> watchedIds) {
        if (watchedIds.isEmpty()) return Map.of();
        List<Long> similarUsers = watchHistoryRepository.findSimilarUserIds(userId, new ArrayList<>(watchedIds));
        if (similarUsers.isEmpty()) return Map.of();
        List<Long> picks = watchHistoryRepository.findMoviesWatchedByUsers(
                similarUsers.subList(0, Math.min(20, similarUsers.size())),
                new ArrayList<>(watchedIds)
        );
        Map<Long, Integer> scores = new HashMap<>();
        int rank = picks.size();
        for (Long movieId : picks) scores.put(movieId, rank--);
        return scores;
    }

    private Map<Long, Long> trendingCounts(int days) {
        Map<Long, Long> result = new HashMap<>();
        for (Object[] row : behaviorRepository.countEventsByMovieSince(LocalDateTime.now().minusDays(days))) {
            result.put((Long) row[0], (Long) row[1]);
        }
        return result;
    }

    private Map<Long, Long> watchCounts() {
        Map<Long, Long> result = new HashMap<>();
        for (Object[] row : watchHistoryRepository.countWatchesByMovie()) {
            result.put((Long) row[0], (Long) row[1]);
        }
        return result;
    }

    private List<Movie> playableMovies() {
        return movieRepository.findAll().stream()
                .filter(movie -> movie.getVideoUrl() != null && !movie.getVideoUrl().isBlank())
                .collect(Collectors.toList());
    }

    private RecommendationResponse toResponse(ScoredMovie scored) {
        Movie movie = scored.movie();
        return new RecommendationResponse(
                movie.getId(), movie.getTitle(), movie.getDescription(), movie.getGenre(),
                bestThumbnail(movie), movie.getBannerUrl(), movie.getVideoUrl(), movie.getRating(),
                scored.reason(), Math.max(1, Math.min(99, Math.round(scored.score())))
        );
    }

    private String bestThumbnail(Movie movie) {
        return movie.getBannerUrl() != null && !movie.getBannerUrl().isBlank()
                ? movie.getBannerUrl()
                : movie.getThumbnailUrl();
    }

    private String clusterName(Map<String, Double> affinity) {
        return affinity.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> e.getKey() + " Fan")
                .orElse("Cold Start Viewer");
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String normalizeEvent(String value) {
        String event = safe(value).trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_EVENTS.contains(event)) {
            throw new IllegalArgumentException("Unsupported behavior event: " + value);
        }
        return event;
    }

    private boolean containsIgnoreCase(String text, String query) {
        return text != null && query != null && text.toLowerCase(Locale.ROOT).contains(query.toLowerCase(Locale.ROOT));
    }

    private double rating(Movie movie) {
        return movie.getRating() == null ? 7.0 : movie.getRating();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String trim(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }

    private record ScoredMovie(Movie movie, double score, String reason) {}
}
