package com.enterprise.meetingroom.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_interactions")
public class AIInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "user_message", nullable = false, length = 1000)
    private String userMessage;

    @Column(name = "ai_response", nullable = false, length = 3000)
    private String aiResponse;

    private String intent; // e.g., "BOOK_ROOM", "FIND_FREE_ROOMS", "SUMMARIZE_MEETING", "GENERAL_CHAT"

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public AIInteraction() {}

    public AIInteraction(User user, String userMessage, String aiResponse, String intent) {
        this.user = user;
        this.userMessage = userMessage;
        this.aiResponse = aiResponse;
        this.intent = intent;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getUserMessage() {
        return userMessage;
    }

    public void setUserMessage(String userMessage) {
        this.userMessage = userMessage;
    }

    public String getAiResponse() {
        return aiResponse;
    }

    public void setAiResponse(String aiResponse) {
        this.aiResponse = aiResponse;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
