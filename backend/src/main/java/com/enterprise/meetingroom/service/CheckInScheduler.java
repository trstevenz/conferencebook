package com.enterprise.meetingroom.service;

import com.enterprise.meetingroom.model.Booking;
import com.enterprise.meetingroom.model.BookingStatus;
import com.enterprise.meetingroom.model.CheckInStatus;
import com.enterprise.meetingroom.model.Notification;
import com.enterprise.meetingroom.model.NotificationType;
import com.enterprise.meetingroom.repository.BookingRepository;
import com.enterprise.meetingroom.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class CheckInScheduler {
    private static final Logger logger = LoggerFactory.getLogger(CheckInScheduler.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Value("${app.booking.checkinTimeoutMinutes:15}")
    private int checkinTimeoutMinutes;

    @Scheduled(fixedRate = 60000) // run every 60 seconds
    @Transactional
    public void releaseExpiredPendingCheckins() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(checkinTimeoutMinutes);
        List<Booking> expiredBookings = bookingRepository.findExpiredPendingCheckins(threshold);

        if (!expiredBookings.isEmpty()) {
            logger.info("Found {} expired pending check-in bookings to release.", expiredBookings.size());
            for (Booking booking : expiredBookings) {
                booking.setStatus(BookingStatus.CANCELLED);
                booking.setCheckInStatus(CheckInStatus.NO_SHOW);
                bookingRepository.save(booking);

                // Create alert notification
                Notification notification = new Notification(
                        booking.getUser(),
                        "Booking Released - No Show",
                        "Your booking for " + booking.getRoom().getName() + " starting at " +
                                booking.getStartTime() + " was auto-cancelled because you didn't check in within " +
                                checkinTimeoutMinutes + " minutes.",
                        NotificationType.BOOKING_CANCELLED
                );
                notificationRepository.save(notification);

                auditLogService.log(
                        booking.getUser().getId(),
                        booking.getUser().getUsername(),
                        "AUTO_CANCEL_NO_SHOW",
                        "0.0.0.0",
                        "Auto-cancelled booking ID " + booking.getId() + " due to no-show."
                );
            }
        }
    }
}
