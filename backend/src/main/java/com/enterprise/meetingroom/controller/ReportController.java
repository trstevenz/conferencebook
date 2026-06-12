package com.enterprise.meetingroom.controller;

import com.enterprise.meetingroom.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/utilization")
    public Map<String, Object> getUtilizationReport() {
        return reportService.getUtilizationReport();
    }
}
