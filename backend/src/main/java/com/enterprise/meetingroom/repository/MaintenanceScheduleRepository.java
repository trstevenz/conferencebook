package com.enterprise.meetingroom.repository;

import com.enterprise.meetingroom.model.MaintenanceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface MaintenanceScheduleRepository extends JpaRepository<MaintenanceSchedule, Long> {

    List<MaintenanceSchedule> findByRoomId(Long roomId);

    @Query("SELECT m FROM MaintenanceSchedule m WHERE m.room.id = :roomId AND m.startTime < :endTime AND m.endTime > :startTime")
    List<MaintenanceSchedule> findOverlappingMaintenance(
        @Param("roomId") Long roomId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
}
