package com.netflix.movie.service;

import com.netflix.movie.dto.MovieRequest;
import com.netflix.movie.dto.MovieResponse;
import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MovieService {

    @Autowired
    private MovieRepository movieRepository;

    public List<MovieResponse> getAllMovies() {
        return movieRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MovieResponse getMovieById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found with id: " + id));
        return toResponse(movie);
    }

    public List<MovieResponse> searchMovies(String title) {
        return movieRepository.findByTitleContainingIgnoreCase(title)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<MovieResponse> getMoviesByGenre(String genre) {
        return movieRepository.findByGenreIgnoreCase(genre)
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
        movie.setRating(request.getRating());
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
                movie.getRating(),
                movie.getCreatedAt()
        );
    }
}
