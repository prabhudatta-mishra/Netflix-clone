package com.netflix.watchlist.service;

import com.netflix.user.entity.User;
import com.netflix.user.repository.UserRepository;
import com.netflix.watchlist.dto.NotificationResponse;
import com.netflix.watchlist.entity.Notification;
import com.netflix.watchlist.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public List<NotificationResponse> getNotifications(String username) {
        User user = getUser(username);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public long getUnreadCount(String username) {
        User user = getUser(username);
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    public void markAsRead(String username, Long notificationId) {
        User user = getUser(username);
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!n.getUserId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    public void createNotification(String username, String title, String message, String type) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return;
        Notification n = new Notification();
        n.setUserId(user.getId());
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        notificationRepository.save(n);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getTitle(), n.getMessage(),
                n.getType(), n.isRead(), n.getCreatedAt());
    }
}
