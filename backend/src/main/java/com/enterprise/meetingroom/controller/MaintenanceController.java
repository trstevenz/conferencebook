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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin/maintenance")
public class MaintenanceController {

    @Autowired
    private MaintenanceScheduleRepository maintenanceScheduleRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public List<MaintenanceSchedule> getAllMaintenance() {
        return maintenanceScheduleRepository.findAll();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> scheduleMaintenance(
            @RequestBody MaintenanceSchedule schedule,
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest request) {

        Room room = roomRepository.findById(schedule.getRoom().getId())
                .orElseThrow(() -> new BookingException("Room not found"));

        schedule.setRoom(room);

        // Save schedule
        MaintenanceSchedule saved = maintenanceScheduleRepository.save(schedule);

        // If maintenance is currently active, mark the room status as MAINTENANCE
        LocalDateTime now = LocalDateTime.now();
        if (schedule.getStartTime().isBefore(now) && schedule.getEndTime().isAfter(now)) {
            room.setStatus(RoomStatus.MAINTENANCE);
            roomRepository.save(room);
        }

        auditLogService.log(principal.getId(), principal.getUsername(), "CREATE_MAINTENANCE", request.getRemoteAddr(),
                "Scheduled maintenance for room '" + room.getName() + "' (ID: " + room.getId() + ") " +
                        schedule.getStartTime() + " to " + schedule.getEndTime());

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> cancelMaintenance(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest request) {

        MaintenanceSchedule schedule = maintenanceScheduleRepository.findById(id)
                .orElseThrow(() -> new BookingException("Maintenance schedule not found"));

        Room room = schedule.getRoom();
        maintenanceScheduleRepository.delete(schedule);

        // Revert room status to AVAILABLE if it was marked as MAINTENANCE and no other active maintenance overlaps
        LocalDateTime now = LocalDateTime.now();
        List<MaintenanceSchedule> overlaps = maintenanceScheduleRepository.findOverlappingMaintenance(room.getId(), now, now);
        if (overlaps.isEmpty() && room.getStatus() == RoomStatus.MAINTENANCE) {
            room.setStatus(RoomStatus.AVAILABLE);
            roomRepository.save(room);
        }

        auditLogService.log(principal.getId(), principal.getUsername(), "DELETE_MAINTENANCE", request.getRemoteAddr(),
                "Cancelled maintenance for room '" + room.getName() + "' (ID: " + room.getId() + ")");

        return ResponseEntity.ok().build();
    }
}
