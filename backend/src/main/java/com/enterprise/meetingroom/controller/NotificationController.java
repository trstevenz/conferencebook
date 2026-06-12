package com.enterprise.meetingroom.controller;

import com.enterprise.meetingroom.model.Notification;
import com.enterprise.meetingroom.repository.NotificationRepository;
import com.enterprise.meetingroom.security.UserDetailsImpl;
import com.enterprise.meetingroom.exception.BookingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public List<Notification> getMyNotifications(@AuthenticationPrincipal UserDetailsImpl principal) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(principal.getId());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl principal) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new BookingException("Notification not found"));

        if (!notification.getUser().getId().equals(principal.getId())) {
            throw new BookingException("Not authorized to read this notification");
        }

        notification.setReadStatus(true);
        notificationRepository.save(notification);

        return ResponseEntity.ok().build();
    }
}
