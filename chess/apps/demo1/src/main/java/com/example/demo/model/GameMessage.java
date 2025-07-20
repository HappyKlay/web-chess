package com.example.demo.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameMessage {
    private String gameId;
    private String userId;
    private MessageType type;
    private String content;
    
    public enum MessageType {
        JOIN,           // User joining a game
        START,          // Game starting
        LEAVE,          // User leaving a game
        NAME_EXCHANGE,  // User name exchange
        MOVE,           // Game move
        PLAYER_INFO,    // Get Player's info
        GAME_OVER,      // Game over (checkmate, draw, etc.)
        DRAW_OFFER,     // Player offering a draw
        DRAW_RESPONSE,   // Response to a draw offer (accept/decline)
        TIMER_UPDATE
    }
}