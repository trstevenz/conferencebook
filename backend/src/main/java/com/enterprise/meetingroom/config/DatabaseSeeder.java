package com.enterprise.meetingroom.config;

import com.enterprise.meetingroom.model.*;
import com.enterprise.meetingroom.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BuildingRepository buildingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (departmentRepository.count() == 0) {
            // Seed Departments
            Department eng = departmentRepository.save(new Department("Engineering"));
            Department mkt = departmentRepository.save(new Department("Marketing"));
            Department hr = departmentRepository.save(new Department("Human Resources"));
            Department fin = departmentRepository.save(new Department("Finance"));

            // Seed Buildings
            buildingRepository.save(new Building("Building 1"));
            buildingRepository.save(new Building("Building 2"));

            // Seed Users
            userRepository.save(new User("superadmin", passwordEncoder.encode("password123"), 
                    "superadmin@enterprise.com", "Super Administrator", UserRole.SUPER_ADMIN, hr));
            userRepository.save(new User("admin", passwordEncoder.encode("password123"), 
                    "admin@enterprise.com", "Facility Administrator", UserRole.FACILITY_ADMIN, eng));
            userRepository.save(new User("manager", passwordEncoder.encode("password123"), 
                    "manager@enterprise.com", "Engineering Manager", UserRole.MANAGER, eng));
            userRepository.save(new User("employee", passwordEncoder.encode("password123"), 
                    "employee@enterprise.com", "Software Engineer", UserRole.EMPLOYEE, eng));
            
            // Seed Rooms
            roomRepository.save(new Room(
                    "Boardroom A", "BD-A", 4, "Building 1", 12, 
                    "Executive boardroom for high-profile meetings.", RoomStatus.AVAILABLE, 
                    "Projector,Speaker System,Video Conference,Air Conditioning"
            ));
            roomRepository.save(new Room(
                    "Conference Room 1", "CR-1", 2, "Building 1", 8, 
                    "Medium conference room with modern amenities.", RoomStatus.AVAILABLE, 
                    "Smart TV,Whiteboard,Air Conditioning"
            ));
            roomRepository.save(new Room(
                    "Huddle Room B", "HR-B", 1, "Building 1", 4, 
                    "Small room for quick breakout discussions.", RoomStatus.AVAILABLE, 
                    "Smart TV,Whiteboard"
            ));
            roomRepository.save(new Room(
                    "Restricted Room 5", "RR-5", 5, "Building 2", 20, 
                    "Restricted access room requiring manager override.", RoomStatus.AVAILABLE, 
                    "Projector,Speaker System,Video Conference,Whiteboard,Air Conditioning"
            ));

            System.out.println(">>> Database seeded with initial enterprise configuration.");
        }
    }
}
