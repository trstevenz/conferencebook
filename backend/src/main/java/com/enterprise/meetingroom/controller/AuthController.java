package com.enterprise.meetingroom.controller;

import com.enterprise.meetingroom.model.Department;
import com.enterprise.meetingroom.model.User;
import com.enterprise.meetingroom.model.UserRole;
import com.enterprise.meetingroom.payload.*;
import com.enterprise.meetingroom.repository.DepartmentRepository;
import com.enterprise.meetingroom.repository.UserRepository;
import com.enterprise.meetingroom.security.JwtUtils;
import com.enterprise.meetingroom.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication.getName());

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userDetails.getUser();
        String role = user.getRole().name();
        String deptName = user.getDepartment() != null ? user.getDepartment().getName() : "None";

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                user.getFullName(),
                role,
                deptName));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        UserRole userRole = UserRole.EMPLOYEE;
        try {
            userRole = UserRole.valueOf(signUpRequest.getRole().toUpperCase());
        } catch (Exception ignored) {}

        Department dept = null;
        if (signUpRequest.getDepartmentName() != null) {
            Optional<Department> oDept = departmentRepository.findByName(signUpRequest.getDepartmentName());
            if (oDept.isPresent()) {
                dept = oDept.get();
            } else {
                dept = departmentRepository.save(new Department(signUpRequest.getDepartmentName()));
            }
        }

        User user = new User(signUpRequest.getUsername(),
                encoder.encode(signUpRequest.getPassword()),
                signUpRequest.getEmail(),
                signUpRequest.getFullName(),
                userRole,
                dept);

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @GetMapping("/departments")
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        // Expose users for meeting scheduling participants list
        return userRepository.findAll();
    }
}
