package com.example.demo.controller;

import com.example.demo.model.Game;
import com.example.demo.service.GameService;
import com.example.demo.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RequestMapping("/game")
@RestController
@AllArgsConstructor
public class GameController {

    private final GameService gameService;
    private final UserService userService;
    private static final Logger log = LoggerFactory.getLogger(GameController.class);
    private static final int ELO_CHANGE = 8;

    @GetMapping("/list")
    public ResponseEntity<List<Game>> getAvailableGamesToConnect() {
        List<Game> availableGamesToConnect = gameService.getAvailableGames();
        return ResponseEntity.ok(availableGamesToConnect);
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<Game> game(@PathVariable String gameId) {
        Game game = gameService.getGame(gameId);
        return ResponseEntity.ok(game);
    }

    @DeleteMapping("/{gameId}")
    public ResponseEntity<?> deleteGame(@PathVariable String gameId) {
        log.info("Received DELETE request for game: {}", gameId);
        gameService.deleteGame(gameId);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/join/{gameId}")
    public ResponseEntity<?> joinGame(@PathVariable String gameId, @RequestBody Map<String, Object> request) {
        try {
            log.info("Received request to join game: {}", gameId);
            
            Long blackPlayerId = Long.valueOf(request.get("blackPlayerId").toString());
            Integer blackPlayerElo = Integer.valueOf(request.get("blackPlayerElo").toString());
            String blackPlayerName = (String) request.get("blackPlayerName");
            
            log.info("Adding black player - ID: {}, Name: {}, ELO: {}", blackPlayerId, blackPlayerName, blackPlayerElo);
            
            Game game = gameService.joinGame(gameId, blackPlayerId, blackPlayerElo, blackPlayerName);
            
            return ResponseEntity.ok(game);
        } catch (Exception e) {
            log.error("Error joining game: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error joining game: " + e.getMessage());
        }
    }
    
    @PostMapping("/updateElo")
    public ResponseEntity<?> updateElo(@RequestBody Map<String, Object> request) {
        try {
            String winnerId = (String) request.get("winnerId");
            String loserId = (String) request.get("loserId");
            boolean isDraw = Boolean.parseBoolean(request.get("isDraw").toString());
            
            log.info("Updating ELO - Winner: {}, Loser: {}, isDraw: {}", winnerId, loserId, isDraw);
            
            if (isDraw) {
                log.info("Game ended in a draw, no ELO changes");
                return ResponseEntity.ok().build();
            }
            
            if (winnerId != null && !winnerId.isEmpty()) {
                userService.updateElo(winnerId, ELO_CHANGE);
                log.info("Increased ELO for user {} by {}", winnerId, ELO_CHANGE);
            }
            
            if (loserId != null && !loserId.isEmpty()) {
                userService.updateElo(loserId, -ELO_CHANGE);
                log.info("Decreased ELO for user {} by {}", loserId, ELO_CHANGE);
            }
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error updating ELO: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error updating ELO: " + e.getMessage());
        }
    }
}
