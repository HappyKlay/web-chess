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
        JOIN,          
        START,          
        LEAVE,         
        NAME_EXCHANGE,  
        MOVE,         
        PLAYER_INFO,    
        GAME_OVER,     
        DRAW_OFFER,    
        DRAW_RESPONSE,  
        TIMER_UPDATE
    }
}
