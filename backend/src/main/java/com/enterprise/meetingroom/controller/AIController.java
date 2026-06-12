package com.enterprise.meetingroom.controller;

import com.enterprise.meetingroom.payload.AIChatRequest;
import com.enterprise.meetingroom.payload.AISummaryRequest;
import com.enterprise.meetingroom.payload.MessageResponse;
import com.enterprise.meetingroom.service.AIService;
import com.enterprise.meetingroom.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private AIService aiService;

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody AIChatRequest request, @AuthenticationPrincipal UserDetailsImpl principal) {
        AIService.AIResponse response = aiService.processChat(principal.getId(), request.getMessage());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/summary")
    public ResponseEntity<?> summary(@RequestBody AISummaryRequest request) {
        String summary = aiService.generateMeetingSummary(request.getTranscript());
        return ResponseEntity.ok(new MessageResponse(summary));
    }
}
