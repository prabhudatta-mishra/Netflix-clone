package com.netflix.user.controller;

import com.netflix.movie.dto.NetflixSyncResponse;
import com.netflix.movie.service.NetflixMediaSyncService;
import com.netflix.user.dto.AdminFeedbackResponse;
import com.netflix.user.dto.AdminHealthResponse;
import com.netflix.user.dto.AdminStatsResponse;
import com.netflix.user.dto.AdminUserSummaryResponse;
import com.netflix.user.dto.OfflineImportResponse;
import com.netflix.user.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminDashboardService adminDashboardService;

    @Autowired
    private NetflixMediaSyncService netflixMediaSyncService;

    @Value("${app.offline.import-dir:offline-import}")
    private String importDir;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminDashboardService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserSummaryResponse>> getUsers() {
        return ResponseEntity.ok(adminDashboardService.getAllUsersWithActivity());
    }

    @GetMapping("/feedback")
    public ResponseEntity<List<AdminFeedbackResponse>> getFeedback() {
        return ResponseEntity.ok(adminDashboardService.getRecentFeedback());
    }

    @GetMapping("/health")
    public ResponseEntity<AdminHealthResponse> getHealth() {
        return ResponseEntity.ok(adminDashboardService.getHealth());
    }

    @DeleteMapping("/users/by-username/{username}")
    public ResponseEntity<Void> deleteUserByUsername(@PathVariable String username, Authentication auth) {
        adminDashboardService.deleteUserByUsername(username, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users")
    public ResponseEntity<Void> deleteUserByUsernameQuery(@RequestParam String username, Authentication auth) {
        adminDashboardService.deleteUserByUsername(username, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/delete")
    public ResponseEntity<Void> deleteUserByUsernamePost(@RequestParam String username, Authentication auth) {
        adminDashboardService.deleteUserByUsername(username, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication auth) {
        adminDashboardService.deleteUser(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/delete")
    public ResponseEntity<Void> deleteUserByIdPost(@PathVariable Long id, Authentication auth) {
        adminDashboardService.deleteUser(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/delete-user")
    public ResponseEntity<Void> deleteUserAction(@RequestParam String username, Authentication auth) {
        adminDashboardService.deleteUserByUsername(username, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/offline-inbox")
    public ResponseEntity<Map<String, String>> getOfflineInboxPath() {
        Path path = Paths.get(importDir).toAbsolutePath().normalize();
        return ResponseEntity.ok(Map.of(
                "folder", path.toString(),
                "hint", "Copy video files here, then click Import from folder in Admin Panel."
        ));
    }

    /** One button: import folder + link videos + ready for Netflix-style play */
    @PostMapping("/sync-movies")
    public ResponseEntity<NetflixSyncResponse> syncAllMovies() throws IOException {
        return ResponseEntity.ok(netflixMediaSyncService.syncAll());
    }
}
