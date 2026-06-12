package com.enterprise.meetingroom.controller;

import com.enterprise.meetingroom.model.*;
import com.enterprise.meetingroom.repository.*;
import com.enterprise.meetingroom.exception.BookingException;
import com.enterprise.meetingroom.service.AuditLogService;
import com.enterprise.meetingroom.security.UserDetailsImpl;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private MaintenanceScheduleRepository maintenanceScheduleRepository;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping("/rooms")
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    @GetMapping("/rooms/{id}")
    public ResponseEntity<Room> getRoomById(@PathVariable Long id) {
        return roomRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/rooms/available")
    public List<Room> getAvailableRooms(
            @RequestParam("startTime") String startStr,
            @RequestParam("endTime") String endStr,
            @RequestParam(value = "capacity", required = false) Integer capacity,
            @RequestParam(value = "amenities", required = false) String amenitiesStr) {

        LocalDateTime startTime = LocalDateTime.parse(startStr);
        LocalDateTime endTime = LocalDateTime.parse(endStr);
        
        List<Room> allRooms = roomRepository.findByStatus(RoomStatus.AVAILABLE);

        return allRooms.stream()
                .filter(room -> capacity == null || room.getCapacity() >= capacity)
                .filter(room -> {
                    if (amenitiesStr == null || amenitiesStr.trim().isEmpty()) {
                        return true;
                    }
                    List<String> requested = Arrays.asList(amenitiesStr.split(","));
                    List<String> provided = room.getAmenitiesList();
                    return provided.containsAll(requested);
                })
                .filter(room -> {
                    // Check booking overlap
                    List<BookingStatus> activeStatuses = List.of(BookingStatus.APPROVED, BookingStatus.PENDING);
                    List<Booking> overlaps = bookingRepository.findOverlappingBookings(room.getId(), startTime, endTime, activeStatuses);
                    return overlaps.isEmpty();
                })
                .filter(room -> {
                    // Check maintenance overlap
                    List<MaintenanceSchedule> maint = maintenanceScheduleRepository.findOverlappingMaintenance(room.getId(), startTime, endTime);
                    return maint.isEmpty();
                })
                .collect(Collectors.toList());
    }

    @PostMapping("/admin/rooms")
    public Room createRoom(@RequestBody Room room, @AuthenticationPrincipal UserDetailsImpl principal, HttpServletRequest request) {
        Room saved = roomRepository.save(room);
        auditLogService.log(principal.getId(), principal.getUsername(), "CREATE_ROOM", request.getRemoteAddr(), 
                "Created room '" + saved.getName() + "' (ID: " + saved.getId() + ")");
        return saved;
    }

    @PutMapping("/admin/rooms/{id}")
    public Room updateRoom(@PathVariable Long id, @RequestBody Room roomDetails, @AuthenticationPrincipal UserDetailsImpl principal, HttpServletRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new BookingException("Room not found"));

        room.setName(roomDetails.getName());
        room.setCode(roomDetails.getCode());
        room.setFloor(roomDetails.getFloor());
        room.setBuilding(roomDetails.getBuilding());
        room.setCapacity(roomDetails.getCapacity());
        room.setDescription(roomDetails.getDescription());
        room.setStatus(roomDetails.getStatus());
        room.setAmenities(roomDetails.getAmenities());
        room.setAvailableStartHour(roomDetails.getAvailableStartHour());
        room.setAvailableEndHour(roomDetails.getAvailableEndHour());
        room.setMaxDuration(roomDetails.getMaxDuration());

        Room saved = roomRepository.save(room);
        auditLogService.log(principal.getId(), principal.getUsername(), "UPDATE_ROOM", request.getRemoteAddr(), 
                "Updated room '" + saved.getName() + "' (ID: " + saved.getId() + ")");
        return saved;
    }

    @DeleteMapping("/admin/rooms/{id}")
    public ResponseEntity<?> deleteRoom(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl principal, HttpServletRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new BookingException("Room not found"));

        roomRepository.delete(room);
        auditLogService.log(principal.getId(), principal.getUsername(), "DELETE_ROOM", request.getRemoteAddr(), 
                "Deleted room '" + room.getName() + "' (ID: " + id + ")");
        return ResponseEntity.ok().build();
    }
}
