package com.enterprise.meetingroom.service;

import com.enterprise.meetingroom.model.AuditLog;
import com.enterprise.meetingroom.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void log(Long userId, String username, String action, String ipAddress, String details) {
        AuditLog log = new AuditLog(userId, username, action, ipAddress, details);
        auditLogRepository.save(log);
    }
}
