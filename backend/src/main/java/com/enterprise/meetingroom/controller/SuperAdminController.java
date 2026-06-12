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
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/superadmin")
public class SuperAdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AuditLogService auditLogService;

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new BookingException("User not found"));

        String roleStr = payload.get("role");
        UserRole newRole = UserRole.valueOf(roleStr.toUpperCase());
        user.setRole(newRole);
        userRepository.save(user);

        auditLogService.log(principal.getId(), principal.getUsername(), "UPDATE_USER_ROLE", request.getRemoteAddr(),
                "Updated role of user '" + user.getUsername() + "' to " + newRole);

        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/department")
    public ResponseEntity<?> updateUserDepartment(
            @PathVariable Long id,
            @RequestBody Map<String, Long> payload,
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new BookingException("User not found"));

        Long deptId = payload.get("departmentId");
        Department dept = null;
        if (deptId != null) {
            dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new BookingException("Department not found"));
        }
        user.setDepartment(dept);
        userRepository.save(user);

        auditLogService.log(principal.getId(), principal.getUsername(), "UPDATE_USER_DEPT", request.getRemoteAddr(),
                "Updated department of user '" + user.getUsername() + "' to " + (dept != null ? dept.getName() : "None"));

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl principal,
            HttpServletRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new BookingException("User not found"));

        userRepository.delete(user);

        auditLogService.log(principal.getId(), principal.getUsername(), "DELETE_USER", request.getRemoteAddr(),
                "Deleted user account '" + user.getUsername() + "'");

        return ResponseEntity.ok().build();
    }
}
