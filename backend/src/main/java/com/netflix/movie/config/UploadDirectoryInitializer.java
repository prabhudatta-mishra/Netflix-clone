package com.netflix.movie.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class UploadDirectoryInitializer implements ApplicationRunner {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.offline.import-dir:offline-import}")
    private String importDir;

    @Override
    public void run(ApplicationArguments args) throws IOException {
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(base.resolve("thumbnails"));
        Files.createDirectories(base.resolve("videos"));

        Path inbox = Paths.get(importDir).toAbsolutePath().normalize();
        Files.createDirectories(inbox);
        Files.createDirectories(inbox.resolve("imported"));

        System.out.println("Video upload folder: " + base);
        System.out.println("OFFLINE import folder (copy videos here): " + inbox);
    }
}
