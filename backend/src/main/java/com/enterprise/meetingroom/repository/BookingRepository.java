package com.enterprise.meetingroom.repository;

import com.enterprise.meetingroom.model.Booking;
import com.enterprise.meetingroom.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    @Query("SELECT b FROM Booking b WHERE b.room.id = :roomId AND b.status IN :statuses AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlappingBookings(
        @Param("roomId") Long roomId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime,
        @Param("statuses") List<BookingStatus> statuses
    );

    @Query("SELECT b FROM Booking b WHERE b.room.id = :roomId AND b.status IN :statuses AND b.startTime < :endTime AND b.endTime > :startTime AND b.id != :excludeId")
    List<Booking> findOverlappingBookingsExcludingId(
        @Param("roomId") Long roomId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime,
        @Param("statuses") List<BookingStatus> statuses,
        @Param("excludeId") Long excludeId
    );

    List<Booking> findByUser_Department_Id(Long departmentId);

    List<Booking> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT b FROM Booking b WHERE b.status = com.enterprise.meetingroom.model.BookingStatus.APPROVED AND b.checkInStatus = com.enterprise.meetingroom.model.CheckInStatus.PENDING AND b.startTime < :threshold")
    List<Booking> findExpiredPendingCheckins(@Param("threshold") LocalDateTime threshold);
}
