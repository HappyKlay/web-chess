package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.WaitingRoom;
import com.example.demo.repository.WaitingRoomRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class WaitingRoomService {
    private final WaitingRoomRepository waitingRoomRepository;

    public WaitingRoomService(WaitingRoomRepository waitingRoomRepository) {
        this.waitingRoomRepository = waitingRoomRepository;
    }

    public WaitingRoom createWaitingRoom(User host) {
        // Check if user already has an active waiting room
        Optional<WaitingRoom> existingRoom = waitingRoomRepository.findByHostIdAndActive(host.getId(), true);
        if (existingRoom.isPresent()) {
            return existingRoom.get();
        }
        
        // Generate a new game code
        String gameCode = WaitingRoom.generateGameCode();
        
        // Check if a room with this game code already exists
        while (waitingRoomRepository.findByGameCode(gameCode).isPresent()) {
            // If code already exists, generate a new one
            gameCode = WaitingRoom.generateGameCode();
        }
        
        // Create a new waiting room
        WaitingRoom waitingRoom = WaitingRoom.builder()
                .gameCode(gameCode)
                .host(host)
                .creationTime(LocalDateTime.now())
                .active(true)
                .build();

        return waitingRoomRepository.save(waitingRoom);
    }

    public Optional<WaitingRoom> findByGameCode(String gameCode) {
        return waitingRoomRepository.findByGameCode(gameCode);
    }

    public void closeWaitingRoom(Long waitingRoomId) {
        waitingRoomRepository.findById(waitingRoomId).ifPresent(room -> {
            room.setActive(false);
            waitingRoomRepository.save(room);
        });
    }
}
