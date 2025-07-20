package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.model.WaitingRoom;
import com.example.demo.service.GameService;
import com.example.demo.service.WaitingRoomService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/waiting-room")
@AllArgsConstructor
public class WaitingRoomController {
    private final WaitingRoomService waitingRoomService;
    private final GameService gameService;


    @PostMapping("/create")
    public ResponseEntity<?> createWaitingRoom() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        WaitingRoom waitingRoom = waitingRoomService.createWaitingRoom(currentUser);

        Map<String, Object> response = new HashMap<>();
        response.put("gameCode", waitingRoom.getGameCode());
        response.put("hostId", waitingRoom.getHost().getId());
        response.put("hostUsername", waitingRoom.getHost().getUsername());
        response.put("hostElo", waitingRoom.getHost().getElo_rating());
        response.put("creationTime", waitingRoom.getCreationTime());

        gameService.createGame(currentUser, waitingRoom.getGameCode());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{gameCode}")
    public ResponseEntity<?> getWaitingRoomDetails(@PathVariable String gameCode) {
        return waitingRoomService.findByGameCode(gameCode)
                .map(waitingRoom -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("gameCode", waitingRoom.getGameCode());
                    response.put("hostId", waitingRoom.getHost().getId());
                    response.put("hostUsername", waitingRoom.getHost().getUsername());
                    response.put("hostElo", waitingRoom.getHost().getElo_rating());
                    response.put("creationTime", waitingRoom.getCreationTime());
                    response.put("waitingSeconds", Duration.between(waitingRoom.getCreationTime(), LocalDateTime.now()).getSeconds());
                    response.put("active", waitingRoom.isActive());

                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{gameCode}")
    public ResponseEntity<?> closeWaitingRoom(@PathVariable String gameCode) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        return waitingRoomService.findByGameCode(gameCode)
                .map(waitingRoom -> {
                    // Check if current user is the host
                    if (!waitingRoom.getHost().getId().equals(currentUser.getId())) {
                        return ResponseEntity.status(403).body("Only the host can close the waiting room");
                    }

                    waitingRoomService.closeWaitingRoom(waitingRoom.getId());
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
