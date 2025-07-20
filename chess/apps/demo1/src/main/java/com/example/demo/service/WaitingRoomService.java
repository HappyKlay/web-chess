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
        Optional<WaitingRoom> existingRoom = waitingRoomRepository.findByHostIdAndActive(host.getId(), true);
        if (existingRoom.isPresent()) {
            return existingRoom.get();
        }
        
        String gameCode = WaitingRoom.generateGameCode();
        
        while (waitingRoomRepository.findByGameCode(gameCode).isPresent()) {
            gameCode = WaitingRoom.generateGameCode();
        }
        
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
