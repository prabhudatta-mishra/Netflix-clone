package com.netflix.movie.config;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Backfills banner_url for movies created before the banner field was added.
 */
@Component
@Order(2)
public class BannerUrlUpdater implements ApplicationRunner {

    @Autowired
    private MovieRepository movieRepository;

    @Override
    public void run(ApplicationArguments args) {
        List<Movie> movies = movieRepository.findAll();
        int updated = 0;
        for (Movie movie : movies) {
            if (movie.getBannerUrl() == null || movie.getBannerUrl().isBlank()) {
                String thumb = movie.getThumbnailUrl();
                if (thumb != null && !thumb.isBlank()) {
                    String banner = thumb.replace("w=400", "w=1600").replace("w=800", "w=1600");
                    movie.setBannerUrl(banner);
                    movieRepository.save(movie);
                    updated++;
                }
            }
        }
        if (updated > 0) {
            System.out.println("Updated banner URLs for " + updated + " movies");
        }
    }
}
