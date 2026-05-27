package com.netflix.movie.service;

import com.netflix.movie.dto.NetflixSyncResponse;
import com.netflix.movie.repository.MovieRepository;
import com.netflix.user.dto.OfflineImportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * Netflix-style one-step pipeline: import folder → link disk files → ready for play.
 */
@Service
public class NetflixMediaSyncService {

    @Value("${app.offline.import-dir:offline-import}")
    private String importDir;

    @Autowired
    private OfflineMovieImportService offlineMovieImportService;

    @Autowired
    private LocalVideoLinkService localVideoLinkService;

    @Autowired
    private MovieRepository movieRepository;

    public NetflixSyncResponse syncAll() throws IOException {
        List<String> steps = new ArrayList<>();
        Path inbox = Paths.get(importDir).toAbsolutePath().normalize();

        OfflineImportResponse imported = offlineMovieImportService.importFromInbox();
        if (!imported.getImported().isEmpty()) {
            steps.add("Added from folder: " + String.join(", ", imported.getImported()));
        }
        if (!imported.getSkipped().isEmpty()) {
            steps.add("Skipped: " + String.join(", ", imported.getSkipped()));
        }
        if (!imported.getErrors().isEmpty()) {
            steps.add("Errors: " + String.join("; ", imported.getErrors()));
        }
        if (imported.getImported().isEmpty() && imported.getSkipped().isEmpty() && imported.getErrors().isEmpty()) {
            steps.add("No new files in offline-import folder.");
        }

        for (String line : localVideoLinkService.linkVideosFromDisk()) {
            steps.add(line);
        }

        long total = movieRepository.count();
        steps.add("Catalog ready: " + total + " movies. Users click Play on Home.");

        return new NetflixSyncResponse(inbox.toString(), steps, (int) total);
    }
}
