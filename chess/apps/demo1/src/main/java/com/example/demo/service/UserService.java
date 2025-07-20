package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
    }

    public List<User> allUsers() {
        List<User> users = new ArrayList<>();
        userRepository.findAll().forEach(users::add);
        return users;
    }
    
    /**
     * Updates a user's ELO rating by the specified amount
     * 
     * @param userId The ID of the user to update
     * @param eloChange The amount to change the ELO rating by (positive for increase, negative for decrease)
     * @return true if update was successful, false otherwise
     */
    public boolean updateElo(String userId, int eloChange) {
        try {
            Optional<User> userOpt = userRepository.findById(Long.valueOf(userId));
            
            if (userOpt.isEmpty()) {
                log.warn("Attempted to update ELO for non-existent user: {}", userId);
                return false;
            }
            
            User user = userOpt.get();
            int currentElo = user.getElo_rating();
            int newElo = Math.max(0, currentElo + eloChange); // Prevent negative ELO
            
            log.info("Updating ELO for user {}: {} -> {}", userId, currentElo, newElo);
            
            user.setElo_rating(newElo);
            userRepository.save(user);
            
            return true;
        } catch (Exception e) {
            log.error("Error updating ELO for user {}: {}", userId, e.getMessage(), e);
            return false;
        }
    }
}