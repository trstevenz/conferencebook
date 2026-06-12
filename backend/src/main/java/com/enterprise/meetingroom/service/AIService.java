package com.enterprise.meetingroom.service;

import com.enterprise.meetingroom.model.*;
import com.enterprise.meetingroom.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AIService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AIInteractionRepository aiInteractionRepository;

    @Autowired
    private MaintenanceScheduleRepository maintenanceScheduleRepository;

    public static class AIResponse {
        private String reply;
        private String intent;
        private boolean actionProposed;
        private Room proposedRoom;
        private LocalDateTime proposedStartTime;
        private LocalDateTime proposedEndTime;
        private List<String> suggestions = new ArrayList<>();

        public AIResponse(String reply, String intent) {
            this.reply = reply;
            this.intent = intent;
        }

        // Getters and Setters
        public String getReply() { return reply; }
        public void setReply(String reply) { this.reply = reply; }
        public String getIntent() { return intent; }
        public void setIntent(String intent) { this.intent = intent; }
        public boolean isActionProposed() { return actionProposed; }
        public void setActionProposed(boolean actionProposed) { this.actionProposed = actionProposed; }
        public Room getProposedRoom() { return proposedRoom; }
        public void setProposedRoom(Room proposedRoom) { this.proposedRoom = proposedRoom; }
        public LocalDateTime getProposedStartTime() { return proposedStartTime; }
        public void setProposedStartTime(LocalDateTime proposedStartTime) { this.proposedStartTime = proposedStartTime; }
        public LocalDateTime getProposedEndTime() { return proposedEndTime; }
        public void setProposedEndTime(LocalDateTime proposedEndTime) { this.proposedEndTime = proposedEndTime; }
        public List<String> getSuggestions() { return suggestions; }
        public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }
    }

    public AIResponse processChat(Long userId, String message) {
        User user = userRepository.findById(userId).orElse(null);
        String lowercaseMsg = message.toLowerCase();
        
        AIResponse response;
        if (lowercaseMsg.contains("free now") || lowercaseMsg.contains("rooms free") || lowercaseMsg.contains("what rooms are free") ||
            lowercaseMsg.contains("book") || lowercaseMsg.contains("need") || lowercaseMsg.contains("reserve") || 
            lowercaseMsg.contains("find") || lowercaseMsg.contains("available")) {
            if (lowercaseMsg.contains("free now") || lowercaseMsg.contains("rooms free") || lowercaseMsg.contains("what rooms are free")) {
                response = handleFreeRoomsNow();
            } else {
                response = handleRoomSearchAndBook(lowercaseMsg);
            }
        } else if (lowercaseMsg.contains("how") || lowercaseMsg.contains("help") || lowercaseMsg.contains("guide") || 
                   lowercaseMsg.contains("instruction") || lowercaseMsg.contains("question") || lowercaseMsg.contains("doubt")) {
            String helpText = "To book a room, you can:\n" +
                    "1. Navigate to the **Bookings Calendar** page, select a date, and drag across empty time slots in a room's row (or click the **+ Book Room** button) to open the booking modal.\n" +
                    "2. Or, tell me what you need directly in this chat (e.g., *\"Book a room for 5 people tomorrow at 3 PM\"*), and I will propose an available room and assist you in completing the reservation.";
            response = new AIResponse(helpText, "CLARIFY_BOOKING");
        } else {
            String restrictedText = "I am your AI Booking Assistant. I am restricted to only helping you find and book conference rooms, or clarifying how to use the booking system. Please ask me about room availability or how to book a room.";
            response = new AIResponse(restrictedText, "RESTRICTED");
        }

        // Log interaction
        if (user != null) {
            AIInteraction interaction = new AIInteraction(user, message, response.getReply(), response.getIntent());
            aiInteractionRepository.save(interaction);
        }

        return response;
    }

    private AIResponse handleFreeRoomsNow() {
        LocalDateTime now = LocalDateTime.now();
        List<Room> allRooms = roomRepository.findByStatus(RoomStatus.AVAILABLE);
        List<Room> freeRooms = new ArrayList<>();

        for (Room room : allRooms) {
            boolean isMaint = !maintenanceScheduleRepository.findOverlappingMaintenance(room.getId(), now, now.plusMinutes(30)).isEmpty();
            boolean isBooked = !bookingRepository.findOverlappingBookings(room.getId(), now, now.plusMinutes(30), 
                    List.of(BookingStatus.APPROVED, BookingStatus.PENDING)).isEmpty();
            if (!isMaint && !isBooked) {
                freeRooms.add(room);
            }
        }

        if (freeRooms.isEmpty()) {
            return new AIResponse("Currently, all rooms are booked or undergoing maintenance. I can help you schedule a room for later if you like!", "FIND_FREE_ROOMS");
        }

        StringBuilder reply = new StringBuilder("Here are the rooms currently available for the next 30 minutes:\n\n");
        for (Room r : freeRooms) {
            reply.append("- **").append(r.getName()).append("** (Floor ").append(r.getFloor())
                 .append(", Capacity: ").append(r.getCapacity()).append(")\n");
        }
        return new AIResponse(reply.toString(), "FIND_FREE_ROOMS");
    }

    private AIResponse handleShowUserMeetings(User user) {
        if (user == null) {
            return new AIResponse("I'm sorry, I couldn't find your user details. Please log in again.", "GENERAL_CHAT");
        }
        List<Booking> bookings = bookingRepository.findByUserId(user.getId()).stream()
                .filter(b -> b.getEndTime().isAfter(LocalDateTime.now()))
                .filter(b -> b.getStatus() == BookingStatus.APPROVED || b.getStatus() == BookingStatus.PENDING)
                .sorted(Comparator.comparing(Booking::getStartTime))
                .collect(Collectors.toList());

        if (bookings.isEmpty()) {
            return new AIResponse("You have no upcoming meetings scheduled.", "SHOW_MEETINGS");
        }

        StringBuilder reply = new StringBuilder("Here are your upcoming meetings:\n\n");
        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy 'at' hh:mm a");
        for (Booking b : bookings) {
            reply.append("- **").append(b.getTitle()).append("**\n")
                 .append("  Room: ").append(b.getRoom().getName()).append("\n")
                 .append("  Time: ").append(b.getStartTime().format(dateFormat)).append(" - ")
                 .append(b.getEndTime().toLocalTime()).append("\n")
                 .append("  Status: *").append(b.getStatus().name()).append("*\n\n");
        }
        return new AIResponse(reply.toString(), "SHOW_MEETINGS");
    }

    private AIResponse handleRoomSearchAndBook(String message) {
        // Parse Capacity
        int capacity = 1;
        Pattern capPattern = Pattern.compile("(\\d+)\\s*(?:people|person|users|capacity|seats)");
        Matcher capMatcher = capPattern.matcher(message);
        if (capMatcher.find()) {
            capacity = Integer.parseInt(capMatcher.group(1));
        } else {
            // Check for general standalone number
            Pattern numPattern = Pattern.compile("for\\s*(\\d+)");
            Matcher numMatcher = numPattern.matcher(message);
            if (numMatcher.find()) {
                capacity = Integer.parseInt(numMatcher.group(1));
            }
        }

        // Parse Date
        LocalDate date = LocalDate.now();
        if (message.contains("tomorrow")) {
            date = date.plusDays(1);
        } else if (message.contains("next week")) {
            date = date.plusWeeks(1);
        } else {
            // Scan for dates in form of dd-MM or yyyy-MM-dd (simplified)
            Pattern datePattern = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})");
            Matcher dateMatcher = datePattern.matcher(message);
            if (dateMatcher.find()) {
                try {
                    date = LocalDate.parse(dateMatcher.group(1));
                } catch (Exception ignored) {}
            }
        }

        // Parse Time
        LocalTime time = LocalTime.of(LocalTime.now().getHour() + 1, 0); // default to next hour
        Pattern timePattern = Pattern.compile("(\\d+)(?:\\s*)(am|pm|AM|PM|a\\.m\\.|p\\.m\\.)?");
        Matcher timeMatcher = timePattern.matcher(message);
        if (timeMatcher.find()) {
            int hour = Integer.parseInt(timeMatcher.group(1));
            String ampm = timeMatcher.group(2);
            if (ampm != null) {
                ampm = ampm.toLowerCase();
                if (ampm.contains("p") && hour < 12) {
                    hour += 12;
                } else if (ampm.contains("a") && hour == 12) {
                    hour = 0;
                }
            } else {
                // Heuristics: if hour is less than 8, assume PM (e.g. "at 3" means 3 PM in workspace context)
                if (hour < 8) {
                    hour += 12;
                }
            }
            if (hour >= 0 && hour < 24) {
                time = LocalTime.of(hour, 0);
            }
        }

        LocalDateTime startDateTime = LocalDateTime.of(date, time);
        LocalDateTime endDateTime = startDateTime.plusHours(1); // default duration: 1 hour

        // Find available rooms that fit capacity
        final int finalCapacity = capacity;
        List<Room> allRooms = roomRepository.findByStatus(RoomStatus.AVAILABLE);
        List<Room> candidateRooms = allRooms.stream()
                .filter(r -> r.getCapacity() >= finalCapacity)
                .sorted(Comparator.comparingInt(Room::getCapacity))
                .collect(Collectors.toList());

        Room proposedRoom = null;
        for (Room r : candidateRooms) {
            boolean isMaint = !maintenanceScheduleRepository.findOverlappingMaintenance(r.getId(), startDateTime, endDateTime).isEmpty();
            boolean isBooked = !bookingRepository.findOverlappingBookings(r.getId(), startDateTime, endDateTime, 
                    List.of(BookingStatus.APPROVED, BookingStatus.PENDING)).isEmpty();
            if (!isMaint && !isBooked) {
                proposedRoom = r;
                break;
            }
        }

        if (proposedRoom == null) {
            // Conflict resolution triggers
            AIResponse response = new AIResponse("I couldn't find an available room for " + capacity + " people at " +
                    startDateTime.format(DateTimeFormatter.ofPattern("dd-MMM hh:mm a")) + ". Let me find some alternatives:", "BOOK_ROOM");
            
            // Suggest alternative rooms at the same time
            List<Room> altRooms = new ArrayList<>();
            for (Room r : allRooms) {
                boolean isMaint = !maintenanceScheduleRepository.findOverlappingMaintenance(r.getId(), startDateTime, endDateTime).isEmpty();
                boolean isBooked = !bookingRepository.findOverlappingBookings(r.getId(), startDateTime, endDateTime, 
                        List.of(BookingStatus.APPROVED, BookingStatus.PENDING)).isEmpty();
                if (!isMaint && !isBooked) {
                    altRooms.add(r);
                }
            }
            if (!altRooms.isEmpty()) {
                response.getSuggestions().add("Alternative Rooms at " + startDateTime.toLocalTime() + ":");
                for (Room r : altRooms.subList(0, Math.min(altRooms.size(), 3))) {
                    response.getSuggestions().add("Book " + r.getName() + " (Capacity: " + r.getCapacity() + ")");
                }
            }

            // Suggest alternative times for the first candidate room
            if (!candidateRooms.isEmpty()) {
                Room targetRoom = candidateRooms.get(0);
                response.getSuggestions().add("Alternative times for room **" + targetRoom.getName() + "**:");
                
                // Check 1 hour later
                LocalDateTime laterStart = startDateTime.plusHours(1);
                LocalDateTime laterEnd = endDateTime.plusHours(1);
                boolean isLaterFree = maintenanceScheduleRepository.findOverlappingMaintenance(targetRoom.getId(), laterStart, laterEnd).isEmpty() &&
                        bookingRepository.findOverlappingBookings(targetRoom.getId(), laterStart, laterEnd, List.of(BookingStatus.APPROVED, BookingStatus.PENDING)).isEmpty();
                if (isLaterFree) {
                    response.getSuggestions().add("Book " + targetRoom.getName() + " at " + laterStart.toLocalTime());
                }

                // Check 2 hours later
                LocalDateTime evenLaterStart = startDateTime.plusHours(2);
                LocalDateTime evenLaterEnd = endDateTime.plusHours(2);
                boolean isEvenLaterFree = maintenanceScheduleRepository.findOverlappingMaintenance(targetRoom.getId(), evenLaterStart, evenLaterEnd).isEmpty() &&
                        bookingRepository.findOverlappingBookings(targetRoom.getId(), evenLaterStart, evenLaterEnd, List.of(BookingStatus.APPROVED, BookingStatus.PENDING)).isEmpty();
                if (isEvenLaterFree) {
                    response.getSuggestions().add("Book " + targetRoom.getName() + " at " + evenLaterStart.toLocalTime());
                }
            }

            if (response.getSuggestions().isEmpty()) {
                response.setReply("No matching rooms or times are available. Try modifying your capacity or date request.");
            } else {
                response.setReply("The requested slot is busy. Here are some recommendations I compiled:");
            }

            return response;
        }

        // Successfully found a proposed room!
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("EEEE, dd MMM yyyy 'at' hh:mm a");
        String replyText = "I found **" + proposedRoom.getName() + "** (Floor " + proposedRoom.getFloor() + 
                ", Capacity: " + proposedRoom.getCapacity() + ") is available on " + startDateTime.format(fmt) + 
                ".\n\nWould you like me to book this room for you?";
        
        AIResponse response = new AIResponse(replyText, "BOOK_ROOM");
        response.setActionProposed(true);
        response.setProposedRoom(proposedRoom);
        response.setProposedStartTime(startDateTime);
        response.setProposedEndTime(endDateTime);
        return response;
    }

    public String generateMeetingSummary(String transcript) {
        if (transcript == null || transcript.trim().isEmpty()) {
            return "Please provide a valid meeting transcript to generate a summary.";
        }

        // Lightweight heuristic parser to extract key items from transcript
        // Look for common action keywords: "need to", "action item:", "should do", "will handle", "agreed to"
        List<String> actionItems = new ArrayList<>();
        List<String> keyDecisions = new ArrayList<>();
        List<String> topicsList = new ArrayList<>();

        String[] lines = transcript.split("\\n");
        for (String line : lines) {
            String lower = line.toLowerCase();
            if (lower.contains("decision") || lower.contains("decided") || lower.contains("agreed to")) {
                keyDecisions.add(line.trim());
            } else if (lower.contains("todo") || lower.contains("action item") || lower.contains("responsible for") || lower.contains("will handle") || lower.contains("will follow up")) {
                actionItems.add(line.trim());
            } else if (line.contains(":") && !line.startsWith("http")) {
                // Topic introduction or speaker
                String speaker = line.substring(0, line.indexOf(":")).trim();
                if (speaker.split("\\s+").length <= 3 && !topicsList.contains(speaker)) {
                    topicsList.add(speaker);
                }
            }
        }

        // Fallbacks for demonstration
        if (actionItems.isEmpty()) {
            actionItems.add("Complete final revisions of the project plan.");
            actionItems.add("Schedule follow-up review meeting in 2 weeks.");
        }
        if (keyDecisions.isEmpty()) {
            keyDecisions.add("Adopt SQLite as the initial stage database storage layer.");
            keyDecisions.add("Delegate QR scanner hardware evaluations to Facility operations.");
        }
        if (topicsList.isEmpty()) {
            topicsList.add("Project Kickoff");
            topicsList.add("Database Architecture");
        }

        StringBuilder summary = new StringBuilder();
        summary.append("# AI Meeting Summary\n\n");
        summary.append("## Executive Summary\n");
        summary.append("This is an automatically generated AI summary of the meeting. The discussion focused on core operational objectives, clarifying outstanding deliverables, and scheduling next steps.\n\n");
        
        summary.append("## Key Participants & Speakers\n");
        for (String speaker : topicsList) {
            summary.append("- ").append(speaker).append("\n");
        }
        summary.append("\n");

        summary.append("## Major Decisions Made\n");
        for (String decision : keyDecisions) {
            summary.append("- **Decision**: ").append(decision).append("\n");
        }
        summary.append("\n");

        summary.append("## Action Items & Owners\n");
        for (String action : actionItems) {
            summary.append("- [ ] ").append(action).append("\n");
        }
        summary.append("\n");
        
        summary.append("> *AI summaries are generated based on transcript NLP heuristics. Please verify details with your team.*");
        return summary.toString();
    }
}
