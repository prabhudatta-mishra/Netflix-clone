package com.netflix.watchlist.controller;

import com.netflix.watchlist.dto.NotificationResponse;
import com.netflix.watchlist.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAll(Authentication auth) {
        return ResponseEntity.ok(notificationService.getNotifications(auth.getName()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(Authentication auth) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(auth.getName())));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(Authentication auth, @PathVariable Long id) {
        notificationService.markAsRead(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearAll(Authentication auth) {
        notificationService.clearAll(auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/clear")
    public ResponseEntity<Void> clearAllFallback(Authentication auth) {
        notificationService.clearAll(auth.getName());
        return ResponseEntity.noContent().build();
    }
}
