package com.netflix.movie.config;

import com.netflix.movie.service.NetflixMediaSyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class NetflixMediaBootstrap implements ApplicationRunner {

    @Value("${app.netflix.auto-sync-on-startup:true}")
    private boolean autoSync;

    @Autowired
    private NetflixMediaSyncService netflixMediaSyncService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!autoSync) {
            return;
        }
        try {
            var result = netflixMediaSyncService.syncAll();
            System.out.println("Netflix media sync on startup: " + result.getTotalMovies() + " movies in catalog.");
            result.getSteps().forEach(s -> System.out.println("  - " + s));
        } catch (Exception e) {
            System.out.println("Media sync on startup skipped: " + e.getMessage());
        }
    }
}
