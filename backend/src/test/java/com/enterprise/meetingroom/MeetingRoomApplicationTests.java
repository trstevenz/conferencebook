package com.enterprise.meetingroom;

import com.enterprise.meetingroom.exception.BookingException;
import com.enterprise.meetingroom.model.*;
import com.enterprise.meetingroom.repository.*;
import com.enterprise.meetingroom.service.BookingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class MeetingRoomApplicationTests {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void contextLoads() {
    }

    @Test
    void testBookingConflict() {
        List<Room> rooms = roomRepository.findAll();
        List<User> users = userRepository.findAll();
        
        assertFalse(rooms.isEmpty(), "Rooms should be seeded");
        assertFalse(users.isEmpty(), "Users should be seeded");

        Room room = rooms.get(0);
        User user = users.get(0);

        LocalDateTime now = LocalDateTime.now().plusDays(5).withHour(10).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = now.plusHours(1);

        Booking b1 = new Booking(room, user, now, end, "Meeting 1", "Desc", BookingStatus.APPROVED, CheckInStatus.PENDING);
        bookingService.createBooking(b1, null, null, "127.0.0.1");

        // Try booking overlapping by 30 mins
        Booking b2 = new Booking(room, user, now.plusMinutes(30), end.plusMinutes(30), "Meeting 2", "Desc", BookingStatus.APPROVED, CheckInStatus.PENDING);
        
        assertThrows(BookingException.class, () -> {
            bookingService.createBooking(b2, null, null, "127.0.0.1");
        });
    }
}
