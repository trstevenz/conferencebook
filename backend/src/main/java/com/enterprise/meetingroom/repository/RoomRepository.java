package com.enterprise.meetingroom.repository;

import com.enterprise.meetingroom.model.Room;
import com.enterprise.meetingroom.model.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByStatus(RoomStatus status);
}
