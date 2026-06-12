package com.enterprise.meetingroom.service;

import com.enterprise.meetingroom.model.*;
import com.enterprise.meetingroom.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    public Map<String, Object> getDashboardStats() {
        List<Room> rooms = roomRepository.findAll();
        List<Booking> bookings = bookingRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        long totalRooms = rooms.size();
        long activeMeetings = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.APPROVED &&
                        b.getStartTime().isBefore(now) && b.getEndTime().isAfter(now))
                .count();

        // occupancy rate: rooms currently in use / total rooms
        double occupancyRate = totalRooms > 0 ? ((double) activeMeetings / totalRooms) * 100 : 0.0;

        long noShows = bookings.stream()
                .filter(b -> b.getCheckInStatus() == CheckInStatus.NO_SHOW)
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRooms", totalRooms);
        stats.put("activeMeetings", activeMeetings);
        stats.put("occupancyRate", Math.round(occupancyRate * 10.0) / 10.0);
        stats.put("noShowCount", noShows);
        stats.put("totalBookingsCount", bookings.size());
        
        return stats;
    }

    public Map<String, Object> getUtilizationReport() {
        List<Booking> bookings = bookingRepository.findAll();
        List<Room> rooms = roomRepository.findAll();

        // 1. Room usage frequency
        Map<String, Long> roomUsage = bookings.stream()
                .collect(Collectors.groupingBy(b -> b.getRoom().getName(), Collectors.counting()));
        
        // Ensure all rooms are in the map, even with 0 bookings
        for (Room room : rooms) {
            roomUsage.putIfAbsent(room.getName(), 0L);
        }

        // 2. Department usage count
        Map<String, Long> deptUsage = bookings.stream()
                .filter(b -> b.getUser().getDepartment() != null)
                .collect(Collectors.groupingBy(b -> b.getUser().getDepartment().getName(), Collectors.counting()));

        // 3. Peak hours
        Map<Integer, Long> peakHours = bookings.stream()
                .collect(Collectors.groupingBy(b -> b.getStartTime().getHour(), Collectors.counting()));

        // Fill in standard business hours 8 AM to 6 PM
        Map<String, Long> hourlyStats = new LinkedHashMap<>();
        for (int h = 8; h <= 18; h++) {
            String timeLabel = (h > 12 ? (h - 12) + " PM" : (h == 12 ? "12 PM" : h + " AM"));
            hourlyStats.put(timeLabel, peakHours.getOrDefault(h, 0L));
        }

        // 4. No Show statistics
        long totalNoShows = bookings.stream().filter(b -> b.getCheckInStatus() == CheckInStatus.NO_SHOW).count();
        long checkedIn = bookings.stream().filter(b -> b.getCheckInStatus() == CheckInStatus.CHECKED_IN).count();
        long pendingCheckIn = bookings.stream().filter(b -> b.getCheckInStatus() == CheckInStatus.PENDING).count();

        Map<String, Object> report = new HashMap<>();
        report.put("roomUsage", roomUsage);
        report.put("departmentUsage", deptUsage);
        report.put("peakHours", hourlyStats);
        report.put("checkInStats", Map.of(
            "noShows", totalNoShows,
            "checkedIn", checkedIn,
            "pending", pendingCheckIn
        ));

        return report;
    }
}
