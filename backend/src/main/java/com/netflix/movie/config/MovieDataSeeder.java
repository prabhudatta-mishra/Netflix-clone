package com.netflix.movie.config;

import com.netflix.movie.entity.Movie;
import com.netflix.movie.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class MovieDataSeeder implements ApplicationRunner {

    @Autowired
    private MovieRepository movieRepository;

    @Override
    public void run(ApplicationArguments args) {
        List<Movie> movies = Arrays.asList(
            createMovie("Interstellar", "A team of explorers travel through a wormhole in space.", "Sci-Fi", 2014,
                "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=400",
                "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", 8.6),
            createMovie("The Dark Knight", "Batman faces the Joker in Gotham City.", "Action", 2008,
                "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=400",
                "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=1600",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 9.0),
            createMovie("Inception", "A thief enters dreams to plant an idea.", "Action", 2010,
                "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400",
                "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", 8.8),
            createMovie("Avatar: The Way of Water", "Jake Sully protects his family on Pandora.", "Sci-Fi", 2022,
                "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400",
                "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", 7.6),
            createMovie("The Matrix", "Neo discovers the truth about reality.", "Sci-Fi", 1999,
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=400",
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1600",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", 8.7),
            createMovie("Gladiator", "A Roman general seeks revenge.", "Drama", 2000,
                "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=400",
                "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1600",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", 8.5),
            createMovie("Spirited Away", "A girl enters a magical spirit world.", "Anime", 2001,
                "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400",
                "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1600",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", 8.6),
            createMovie("Pulp Fiction", "Interconnected crime stories in Los Angeles.", "Drama", 1994,
                "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400",
                "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", 8.9)
        );

        if (movieRepository.count() == 0) {
            movieRepository.saveAll(movies);
            System.out.println("Seeded 8 sample movies with playable demo video URLs.");
            return;
        }

        repairSampleMovies(movies);
    }

    private void repairSampleMovies(List<Movie> samples) {
        int repaired = 0;
        List<Movie> existing = movieRepository.findAll();
        for (Movie sample : samples) {
            for (Movie movie : existing) {
                if (movie.getTitle() != null && movie.getTitle().equalsIgnoreCase(sample.getTitle())) {
                    movie.setDescription(sample.getDescription());
                    movie.setGenre(sample.getGenre());
                    movie.setReleaseYear(sample.getReleaseYear());
                    movie.setThumbnailUrl(sample.getThumbnailUrl());
                    movie.setBannerUrl(sample.getBannerUrl());
                    movie.setVideoUrl(sample.getVideoUrl());
                    movie.setFallbackVideoUrls(sample.getFallbackVideoUrls());
                    movie.setRating(sample.getRating());
                    movieRepository.save(movie);
                    repaired++;
                    break;
                }
            }
        }
        if (repaired > 0) {
            System.out.println("Repaired " + repaired + " sample movies with playable demo video URLs.");
        }
    }

    private Movie createMovie(String title, String description, String genre, int year,
                              String thumbnail, String banner, String video, double rating) {
        Movie movie = new Movie();
        movie.setTitle(title);
        movie.setDescription(description);
        movie.setGenre(genre);
        movie.setReleaseYear(year);
        movie.setThumbnailUrl(thumbnail);
        movie.setBannerUrl(banner);
        movie.setVideoUrl(video);
        movie.setFallbackVideoUrls(String.join(",",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"));
        movie.setRating(rating);
        movie.setCreatedAt(LocalDateTime.now());
        return movie;
    }
}
