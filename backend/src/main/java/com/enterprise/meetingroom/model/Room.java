package com.enterprise.meetingroom.model;

import jakarta.persistence.*;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private Integer floor;

    @Column(nullable = false)
    private String building;

    @Column(nullable = false)
    private Integer capacity;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomStatus status = RoomStatus.AVAILABLE;

    @Column(length = 1000)
    private String amenities; // comma-separated strings: e.g., "Projector,Whiteboard,Air Conditioning"

    private Integer availableStartHour;
    private Integer availableEndHour;
    private Integer maxDuration;

    public Room() {}

    public Room(String name, String code, Integer floor, String building, Integer capacity, String description, RoomStatus status, String amenities) {
        this.name = name;
        this.code = code;
        this.floor = floor;
        this.building = building;
        this.capacity = capacity;
        this.description = description;
        this.status = status;
        this.amenities = amenities;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Integer getFloor() {
        return floor;
    }

    public void setFloor(Integer floor) {
        this.floor = floor;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }

    public String getAmenities() {
        return amenities;
    }

    public void setAmenities(String amenities) {
        this.amenities = amenities;
    }

    @Transient
    public List<String> getAmenitiesList() {
        if (amenities == null || amenities.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.asList(amenities.split(","));
    }

    @Transient
    public void setAmenitiesList(List<String> list) {
        if (list == null || list.isEmpty()) {
            this.amenities = "";
        } else {
            this.amenities = String.join(",", list);
        }
    }

    public Integer getAvailableStartHour() {
        return availableStartHour != null ? availableStartHour : 8;
    }

    public void setAvailableStartHour(Integer availableStartHour) {
        this.availableStartHour = availableStartHour;
    }

    public Integer getAvailableEndHour() {
        return availableEndHour != null ? availableEndHour : 18;
    }

    public void setAvailableEndHour(Integer availableEndHour) {
        this.availableEndHour = availableEndHour;
    }

    public Integer getMaxDuration() {
        return maxDuration != null ? maxDuration : 120;
    }

    public void setMaxDuration(Integer maxDuration) {
        this.maxDuration = maxDuration;
    }
}
