package com.enterprise.meetingroom.repository;

import com.enterprise.meetingroom.model.AIInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AIInteractionRepository extends JpaRepository<AIInteraction, Long> {
    List<AIInteraction> findByUserIdOrderByTimestampDesc(Long userId);
}
