package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestMapping("/users")
@RestController
public class UserController {
    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> authenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).body("No authentication found");
        }
        
        try {
            if (authentication.getPrincipal() instanceof User currentUser) {
                return ResponseEntity.ok(currentUser);
            } else {
                return ResponseEntity.status(500)
                    .body("Principal is not a User object, but: " + authentication.getPrincipal().getClass().getName());
            }
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body("Error processing user: " + e.getMessage());
        }
    }

//    @GetMapping("/")
//    public ResponseEntity<?> allUsers() {
//        // This will now be properly caught by the GlobalExceptionHandler
////        throw new RuntimeException("Failed to retrieve all users");
//
//        // Your original code (commented out)
//        /*
//        List<User> users = userService.allUsers();
//        return ResponseEntity.ok(users);
//        */
//    }
}
