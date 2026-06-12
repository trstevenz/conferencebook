package com.enterprise.meetingroom.controller;

import com.enterprise.meetingroom.model.*;
import com.enterprise.meetingroom.payload.*;
import com.enterprise.meetingroom.service.BookingService;
import com.enterprise.meetingroom.repository.BookingRepository;
import com.enterprise.meetingroom.repository.UserRepository;
import com.enterprise.meetingroom.exception.BookingException;
import com.enterprise.meetingroom.security.UserDetailsImpl;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/bookings")
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        return bookingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/bookings/my")
    public List<Booking> getMyBookings(@AuthenticationPrincipal UserDetailsImpl principal) {
        return bookingRepository.findByUserId(principal.getId());
    }

    @GetMapping("/manager/bookings/team")
    public List<Booking> getTeamBookings(@AuthenticationPrincipal UserDetailsImpl principal) {
        // Find department of manager
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BookingException("User not found"));
        
        if (user.getDepartment() == null) {
            throw new BookingException("Manager does not belong to any department");
        }

        return bookingRepository.findByUser_Department_Id(user.getDepartment().getId());
    }

    @PostMapping("/bookings")
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody BookingRequest request, 
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest httpServletRequest) {
        try {
            Booking booking = new Booking();
            booking.setTitle(request.getTitle());
            booking.setDescription(request.getDescription());
            booking.setStartTime(request.getStartTime());
            booking.setEndTime(request.getEndTime());

            Room room = new Room();
            room.setId(request.getRoomId());
            booking.setRoom(room);

            // Set current logged-in user as organizer
            User user = new User();
            user.setId(principal.getId());
            booking.setUser(user);

            // Add participants
            if (request.getParticipantIds() != null && !request.getParticipantIds().isEmpty()) {
                Set<User> participants = request.getParticipantIds().stream().map(pid -> {
                    User u = new User();
                    u.setId(pid);
                    return u;
                }).collect(Collectors.toSet());
                booking.setParticipants(participants);
            }

            List<Booking> created = bookingService.createBooking(
                    booking, 
                    request.getRecurrencePattern(), 
                    request.getRecurrenceCount(), 
                    httpServletRequest.getRemoteAddr()
            );

            return ResponseEntity.ok(created);
        } catch (BookingException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
        }
    }

    @PutMapping("/bookings/{id}")
    public ResponseEntity<?> updateBooking(
            @PathVariable Long id, 
            @Valid @RequestBody BookingRequest request, 
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest httpServletRequest) {
        try {
            Booking booking = new Booking();
            booking.setTitle(request.getTitle());
            booking.setDescription(request.getDescription());
            booking.setStartTime(request.getStartTime());
            booking.setEndTime(request.getEndTime());

            if (request.getRoomId() != null) {
                Room room = new Room();
                room.setId(request.getRoomId());
                booking.setRoom(room);
            }

            if (request.getParticipantIds() != null) {
                Set<User> participants = request.getParticipantIds().stream().map(pid -> {
                    User u = new User();
                    u.setId(pid);
                    return u;
                }).collect(Collectors.toSet());
                booking.setParticipants(participants);
            }

            Booking updated = bookingService.updateBooking(id, booking, principal.getId(), httpServletRequest.getRemoteAddr());
            return ResponseEntity.ok(updated);
        } catch (BookingException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
        }
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long id, 
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest request) {
        try {
            Booking cancelled = bookingService.cancelBooking(id, principal.getId(), request.getRemoteAddr());
            return ResponseEntity.ok(cancelled);
        } catch (BookingException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
        }
    }

    @PostMapping("/bookings/{id}/checkin")
    public ResponseEntity<?> checkInBooking(
            @PathVariable Long id, 
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest request) {
        try {
            Booking checkIn = bookingService.checkInBooking(id, principal.getId(), request.getRemoteAddr());
            return ResponseEntity.ok(checkIn);
        } catch (BookingException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
        }
    }

    @PostMapping("/manager/bookings/{id}/approve")
    public ResponseEntity<?> approveBooking(
            @PathVariable Long id, 
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest request) {
        try {
            Booking approved = bookingService.approveBooking(id, principal.getId(), request.getRemoteAddr());
            return ResponseEntity.ok(approved);
        } catch (BookingException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
        }
    }

    @PostMapping("/manager/bookings/{id}/reject")
    public ResponseEntity<?> rejectBooking(
            @PathVariable Long id, 
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest request) {
        try {
            Booking rejected = bookingService.rejectBooking(id, principal.getId(), request.getRemoteAddr());
            return ResponseEntity.ok(rejected);
        } catch (BookingException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
        }
    }
}
