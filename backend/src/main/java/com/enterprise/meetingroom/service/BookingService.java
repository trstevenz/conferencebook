package com.enterprise.meetingroom.service;

import com.enterprise.meetingroom.exception.BookingException;
import com.enterprise.meetingroom.model.*;
import com.enterprise.meetingroom.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MaintenanceScheduleRepository maintenanceScheduleRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional
    public List<Booking> createBooking(Booking booking, String recurrencePattern, Integer recurrenceCount, String ipAddress) {
        Room room = roomRepository.findById(booking.getRoom().getId())
                .orElseThrow(() -> new BookingException("Room not found"));

        User user = userRepository.findById(booking.getUser().getId())
                .orElseThrow(() -> new BookingException("User not found"));

        booking.setRoom(room);
        booking.setUser(user);

        // 1. Check room status
        if (room.getStatus() == RoomStatus.DISABLED) {
            throw new BookingException("Room '" + room.getName() + "' is disabled and cannot be booked.");
        }
        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            throw new BookingException("Room '" + room.getName() + "' is currently undergoing maintenance.");
        }

        // 2. Capacity Check
        // If there are participants, ensure they fit in the room
        if (booking.getParticipants() != null && booking.getParticipants().size() > room.getCapacity()) {
            throw new BookingException("Number of participants (" + booking.getParticipants().size() + 
                    ") exceeds room capacity (" + room.getCapacity() + ").");
        }

        // Determine if booking requires manager approval
        // Rule: If the room name contains "Board" or "Restricted", and the booking user is an EMPLOYEE, it requires approval.
        boolean requiresApproval = (room.getName().toLowerCase().contains("board") || 
                                    room.getName().toLowerCase().contains("restricted")) && 
                                    user.getRole() == UserRole.EMPLOYEE;

        BookingStatus initialStatus = requiresApproval ? BookingStatus.PENDING : BookingStatus.APPROVED;
        booking.setStatus(initialStatus);
        booking.setCheckInStatus(CheckInStatus.PENDING);

        List<Booking> createdBookings = new ArrayList<>();

        if (recurrencePattern == null || recurrencePattern.trim().isEmpty() || recurrenceCount == null || recurrenceCount <= 1) {
            // Single booking
            validateTimeRange(room.getId(), booking.getStartTime(), booking.getEndTime(), null);
            Booking saved = bookingRepository.save(booking);
            createdBookings.add(saved);

            createNotification(user, "Booking Created", 
                    "Your booking for " + room.getName() + " is " + saved.getStatus().name() + ".", 
                    saved.getStatus() == BookingStatus.PENDING ? NotificationType.BOOKING_CREATED : NotificationType.BOOKING_APPROVED);
        } else {
            // Recurring bookings
            booking.setRecurringPattern(recurrencePattern + ":" + recurrenceCount);
            
            for (int i = 0; i < recurrenceCount; i++) {
                LocalDateTime instanceStart = booking.getStartTime();
                LocalDateTime instanceEnd = booking.getEndTime();

                if (recurrencePattern.equalsIgnoreCase("DAILY")) {
                    instanceStart = instanceStart.plusDays(i);
                    instanceEnd = instanceEnd.plusDays(i);
                } else if (recurrencePattern.equalsIgnoreCase("WEEKLY")) {
                    instanceStart = instanceStart.plusWeeks(i);
                    instanceEnd = instanceEnd.plusWeeks(i);
                } else {
                    throw new BookingException("Unsupported recurrence pattern: " + recurrencePattern);
                }

                validateTimeRange(room.getId(), instanceStart, instanceEnd, null);

                Booking instance = new Booking();
                instance.setRoom(room);
                instance.setUser(user);
                instance.setStartTime(instanceStart);
                instance.setEndTime(instanceEnd);
                instance.setTitle(booking.getTitle() + " (Occurrence " + (i + 1) + ")");
                instance.setDescription(booking.getDescription());
                instance.setStatus(initialStatus);
                instance.setCheckInStatus(CheckInStatus.PENDING);
                instance.setParticipants(booking.getParticipants());
                instance.setRecurringPattern(booking.getRecurringPattern());

                Booking saved = bookingRepository.save(instance);
                createdBookings.add(saved);
            }

            createNotification(user, "Recurring Booking Created", 
                    "Your recurring booking (" + recurrenceCount + " occurrences) for " + room.getName() + " is created.", 
                    NotificationType.BOOKING_CREATED);
        }

        auditLogService.log(user.getId(), user.getUsername(), "CREATE_BOOKING", ipAddress, 
                "Created booking (count: " + createdBookings.size() + ") for room ID " + room.getId() + " status: " + initialStatus);

        return createdBookings;
    }

    @Transactional
    public Booking updateBooking(Long bookingId, Booking bookingDetails, Long userId, String ipAddress) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingException("Booking not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BookingException("User not found"));

        if ((user.getRole() == UserRole.EMPLOYEE || user.getRole() == UserRole.SUPER_USER) && !booking.getUser().getId().equals(userId)) {
            throw new BookingException("You do not have permission to modify another user's booking.");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BookingException("Cannot modify booking in status " + booking.getStatus());
        }

        // Check if room changed
        Room room = booking.getRoom();
        if (bookingDetails.getRoom() != null && !bookingDetails.getRoom().getId().equals(room.getId())) {
            room = roomRepository.findById(bookingDetails.getRoom().getId())
                    .orElseThrow(() -> new BookingException("New Room not found"));
            booking.setRoom(room);
        }

        // Capacity Check
        if (bookingDetails.getParticipants() != null && bookingDetails.getParticipants().size() > room.getCapacity()) {
            throw new BookingException("Number of participants exceeds room capacity (" + room.getCapacity() + ").");
        }

        LocalDateTime newStart = bookingDetails.getStartTime() != null ? bookingDetails.getStartTime() : booking.getStartTime();
        LocalDateTime newEnd = bookingDetails.getEndTime() != null ? bookingDetails.getEndTime() : booking.getEndTime();

        // Validate overlap (excluding this booking)
        validateTimeRange(room.getId(), newStart, newEnd, bookingId);

        booking.setStartTime(newStart);
        booking.setEndTime(newEnd);
        if (bookingDetails.getTitle() != null) booking.setTitle(bookingDetails.getTitle());
        if (bookingDetails.getDescription() != null) booking.setDescription(bookingDetails.getDescription());
        if (bookingDetails.getParticipants() != null) booking.setParticipants(bookingDetails.getParticipants());

        Booking saved = bookingRepository.save(booking);

        auditLogService.log(booking.getUser().getId(), booking.getUser().getUsername(), "UPDATE_BOOKING", ipAddress, 
                "Updated booking ID " + bookingId + " for room ID " + room.getId());

        return saved;
    }

    @Transactional
    public Booking cancelBooking(Long bookingId, Long userId, String ipAddress) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingException("Booking not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BookingException("User not found"));

        // Rule: Employees / Super Users can only cancel their own bookings. Managers/Admins can cancel any.
        if ((user.getRole() == UserRole.EMPLOYEE || user.getRole() == UserRole.SUPER_USER) && !booking.getUser().getId().equals(userId)) {
            throw new BookingException("You do not have permission to cancel another employee's booking.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        createNotification(booking.getUser(), "Booking Cancelled", 
                "Your booking for " + booking.getRoom().getName() + " on " + booking.getStartTime().toLocalDate() + " has been cancelled.", 
                NotificationType.BOOKING_CANCELLED);

        auditLogService.log(user.getId(), user.getUsername(), "CANCEL_BOOKING", ipAddress, 
                "Cancelled booking ID " + bookingId + " for user " + booking.getUser().getUsername());

        return saved;
    }

    @Transactional
    public Booking approveBooking(Long bookingId, Long managerId, String ipAddress) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingException("Booking is not in PENDING state (current: " + booking.getStatus() + ")");
        }

        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new BookingException("Manager not found"));

        booking.setStatus(BookingStatus.APPROVED);
        Booking saved = bookingRepository.save(booking);

        createNotification(booking.getUser(), "Booking Approved", 
                "Your booking for " + booking.getRoom().getName() + " has been approved.", 
                NotificationType.BOOKING_APPROVED);

        auditLogService.log(managerId, manager.getUsername(), "APPROVE_BOOKING", ipAddress, 
                "Approved booking ID " + bookingId + " organized by " + booking.getUser().getUsername());

        return saved;
    }

    @Transactional
    public Booking rejectBooking(Long bookingId, Long managerId, String ipAddress) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingException("Booking is not in PENDING state (current: " + booking.getStatus() + ")");
        }

        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new BookingException("Manager not found"));

        booking.setStatus(BookingStatus.REJECTED);
        Booking saved = bookingRepository.save(booking);

        createNotification(booking.getUser(), "Booking Rejected", 
                "Your booking request for " + booking.getRoom().getName() + " was rejected.", 
                NotificationType.BOOKING_REJECTED);

        auditLogService.log(managerId, manager.getUsername(), "REJECT_BOOKING", ipAddress, 
                "Rejected booking ID " + bookingId + " organized by " + booking.getUser().getUsername());

        return saved;
    }

    @Transactional
    public Booking checkInBooking(Long bookingId, Long userId, String ipAddress) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingException("Booking not found"));

        // Security check: only meeting organizer or a participant can check-in. Or Admin/Manager.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BookingException("User not found"));

        boolean isAuthorized = booking.getUser().getId().equals(userId) || 
                              user.getRole() == UserRole.SUPER_ADMIN || 
                              user.getRole() == UserRole.FACILITY_ADMIN ||
                              booking.getParticipants().stream().anyMatch(p -> p.getId().equals(userId));

        if (!isAuthorized) {
            throw new BookingException("You are not authorized to check in for this meeting.");
        }

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new BookingException("Cannot check in to a booking that is not approved (status: " + booking.getStatus() + ")");
        }

        if (booking.getCheckInStatus() == CheckInStatus.CHECKED_IN) {
            throw new BookingException("Booking is already checked in.");
        }

        booking.setCheckInStatus(CheckInStatus.CHECKED_IN);
        booking.setCheckInTime(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);

        auditLogService.log(userId, user.getUsername(), "CHECK_IN_BOOKING", ipAddress, 
                "Checked into booking ID " + bookingId);

        return saved;
    }

    private void validateTimeRange(Long roomId, LocalDateTime start, LocalDateTime end, Long excludeBookingId) {
        if (start.isAfter(end) || start.isEqual(end)) {
            throw new BookingException("Booking start time must be before end time.");
        }

        if (start.isBefore(LocalDateTime.now())) {
            throw new BookingException("Booking cannot be scheduled in the past.");
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BookingException("Room not found"));

        int startHour = start.getHour();
        int startMinute = start.getMinute();
        int endHour = end.getHour();
        int endMinute = end.getMinute();

        int roomStart = room.getAvailableStartHour();
        int roomEnd = room.getAvailableEndHour();

        // Validate available hours
        if (startHour < roomStart || endHour > roomEnd || (endHour == roomEnd && endMinute > 0)) {
            String startLabel = roomStart > 12 ? (roomStart - 12) + ":00 PM" : roomStart + ":00 AM";
            if (roomStart == 12) startLabel = "12:00 PM";
            if (roomStart == 0) startLabel = "12:00 AM";
            String endLabel = roomEnd > 12 ? (roomEnd - 12) + ":00 PM" : roomEnd + ":00 AM";
            if (roomEnd == 12) endLabel = "12:00 PM";
            if (roomEnd == 0) endLabel = "12:00 AM";
            throw new BookingException("Booking time falls outside the room's operating hours (" + startLabel + " - " + endLabel + ").");
        }

        // 1. Check for overlapping maintenance blocks
        List<MaintenanceSchedule> maint = maintenanceScheduleRepository.findOverlappingMaintenance(roomId, start, end);
        if (!maint.isEmpty()) {
            throw new BookingException("Room is blocked for maintenance: " + maint.get(0).getDescription());
        }

        // 2. Check for overlapping approved/pending bookings
        List<BookingStatus> activeStatuses = List.of(BookingStatus.APPROVED, BookingStatus.PENDING);
        List<Booking> overlaps;
        if (excludeBookingId == null) {
            overlaps = bookingRepository.findOverlappingBookings(roomId, start, end, activeStatuses);
        } else {
            overlaps = bookingRepository.findOverlappingBookingsExcludingId(roomId, start, end, activeStatuses, excludeBookingId);
        }

        if (!overlaps.isEmpty()) {
            Booking conf = overlaps.get(0);
            throw new BookingException("Conflict: Overlaps with booking '" + conf.getTitle() + 
                    "' (" + conf.getStartTime().toLocalTime() + " - " + conf.getEndTime().toLocalTime() + ")");
        }
    }

    private void createNotification(User user, String title, String message, NotificationType type) {
        Notification notification = new Notification(user, title, message, type);
        notificationRepository.save(notification);
    }
}
