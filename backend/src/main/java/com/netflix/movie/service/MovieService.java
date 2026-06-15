package com.netflix.movie.service;

import com.netflix.movie.dto.MovieRequest;
import com.netflix.movie.dto.MovieResponse;
import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MovieService {

    @Autowired
    private MovieRepository movieRepository;

    public List<MovieResponse> getAllMovies() {
        return uniqueMovies(movieRepository.findAll()).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MovieResponse getMovieById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found with id: " + id));
        return toResponse(movie);
    }

    public List<MovieResponse> searchMovies(String title) {
        return uniqueMovies(movieRepository.findByTitleContainingIgnoreCase(title))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<MovieResponse> getMoviesByGenre(String genre) {
        return uniqueMovies(movieRepository.findByGenreIgnoreCase(genre))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<String> getCategories() {
        return movieRepository.findDistinctGenres();
    }

    public List<String> getSearchSuggestions(String query) {
        if (query == null || query.trim().length() < 1) {
            return List.of();
        }
        return movieRepository.findByTitleContainingIgnoreCase(query.trim())
                .stream()
                .map(Movie::getTitle)
                .distinct()
                .limit(8)
                .collect(Collectors.toList());
    }

    public MovieResponse createMovie(MovieRequest request) {
        Movie movie = new Movie();
        mapRequest(request, movie);
        movie.setCreatedAt(LocalDateTime.now());
        return toResponse(movieRepository.save(movie));
    }

    public MovieResponse updateMovie(Long id, MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found with id: " + id));
        mapRequest(request, movie);
        return toResponse(movieRepository.save(movie));
    }

    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new RuntimeException("Movie not found with id: " + id);
        }
        movieRepository.deleteById(id);
    }

    private void mapRequest(MovieRequest request, Movie movie) {
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setGenre(request.getGenre());
        movie.setReleaseYear(request.getReleaseYear());
        movie.setThumbnailUrl(request.getThumbnailUrl());
        movie.setBannerUrl(request.getBannerUrl());
        movie.setVideoUrl(request.getVideoUrl());
        movie.setFallbackVideoUrls(request.getFallbackVideoUrls());
        movie.setRating(request.getRating());
    }

    private List<Movie> uniqueMovies(List<Movie> movies) {
        Map<String, Movie> byTitle = new LinkedHashMap<>();
        movies.stream()
                .sorted(Comparator.comparing(Movie::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .forEach(movie -> byTitle.putIfAbsent(normalizeTitle(movie.getTitle()), movie));
        return List.copyOf(byTitle.values());
    }

    private String normalizeTitle(String title) {
        return title == null ? "" : title.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    private MovieResponse toResponse(Movie movie) {
        return new MovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getDescription(),
                movie.getGenre(),
                movie.getReleaseYear(),
                movie.getThumbnailUrl(),
                movie.getBannerUrl(),
                movie.getVideoUrl(),
                movie.getFallbackVideoUrls(),
                movie.getRating(),
                movie.getCreatedAt()
        );
    }
}
