package com.enterprise.meetingroom.controller;

import com.enterprise.meetingroom.model.Building;
import com.enterprise.meetingroom.repository.BuildingRepository;
import com.enterprise.meetingroom.service.AuditLogService;
import com.enterprise.meetingroom.security.UserDetailsImpl;
import com.enterprise.meetingroom.exception.BookingException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class BuildingController {

    @Autowired
    private BuildingRepository buildingRepository;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping("/buildings")
    public List<Building> getAllBuildings() {
        return buildingRepository.findAll();
    }

    @PostMapping("/admin/buildings")
    public Building createBuilding(@RequestBody Building building, @AuthenticationPrincipal UserDetailsImpl principal, HttpServletRequest request) {
        if (building.getName() == null || building.getName().trim().isEmpty()) {
            throw new BookingException("Building name cannot be empty");
        }
        if (buildingRepository.findByName(building.getName().trim()).isPresent()) {
            throw new BookingException("Building with this name already exists");
        }
        building.setName(building.getName().trim());
        Building saved = buildingRepository.save(building);
        auditLogService.log(principal.getId(), principal.getUsername(), "CREATE_BUILDING", request.getRemoteAddr(), 
                "Created building '" + saved.getName() + "' (ID: " + saved.getId() + ")");
        return saved;
    }

    @DeleteMapping("/admin/buildings/{id}")
    public ResponseEntity<?> deleteBuilding(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl principal, HttpServletRequest request) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new BookingException("Building not found"));
        buildingRepository.delete(building);
        auditLogService.log(principal.getId(), principal.getUsername(), "DELETE_BUILDING", request.getRemoteAddr(), 
                "Deleted building '" + building.getName() + "' (ID: " + building.getId() + ")");
        return ResponseEntity.ok().body("{\"message\": \"Building deleted successfully!\"}");
    }
}
