package com.example.demo.controller;

import com.example.demo.model.GameMessage;
import com.example.demo.service.GameSessionService;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;


@AllArgsConstructor
@Controller
public class GameWebSocketController {
    private static final Logger logger = LoggerFactory.getLogger(GameWebSocketController.class);

    private SimpMessagingTemplate messagingTemplate;
    private GameSessionService gameSessionService;
    
    // Handle user joining a waiting room
    @MessageMapping("/game.join")
    public void joinGame(@Payload GameMessage message) {
        logger.info("Received join request for game: {}, from user: {}", message.getGameId(), message.getUserId());
        
        try {
            // Get or create the game session
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            logger.debug("Game session retrieved/created for game: {}", message.getGameId());
            
            // Add the player to the session
            session.addPlayer(message.getUserId());
            logger.debug("Added player: {} to game: {}", message.getUserId(), message.getGameId());
            
            // Notify all subscribers about the new user
            messagingTemplate.convertAndSend(
                    "/topic/game/" + message.getGameId(),
                    new GameMessage(
                            message.getGameId(),
                            message.getUserId(),
                            GameMessage.MessageType.JOIN,
                            "User " + message.getUserId() + " joined the game."
                    )
            );
            logger.debug("Sent join notification for player: {} in game: {}", message.getUserId(), message.getGameId());
            
            // Check if the game is ready to start (both players joined)
            if (session.isFull()) {
                logger.info("Game {} is now full and ready to start", message.getGameId());
                // Notify that game is ready to start
                messagingTemplate.convertAndSend(
                        "/topic/game/" + message.getGameId(),
                        new GameMessage(
                                message.getGameId(),
                                "SYSTEM",
                                GameMessage.MessageType.START,
                                "Game is ready to start! All players have joined."
                        )
                );
                logger.debug("Sent game start notification for game: {}", message.getGameId());
            }
        } catch (Exception e) {
            logger.error("Error processing join request for game: {} and user: {}", 
                message.getGameId(), message.getUserId(), e);
            throw e;
        }
    }
    
    // Handle general messages including name exchange
    @MessageMapping("/game.message")
    public void handleMessage(@Payload GameMessage message) {
        logger.info("Received message for game: {}, from user: {}, type: {}", 
            message.getGameId(), message.getUserId(), message.getType());
        
        try {
            // Get the game session
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            
            // Check if the session exists and the user is in the session
            if (session != null && session.isPlayerInSession(message.getUserId())) {
                // Broadcast the message to all users in the game
                messagingTemplate.convertAndSend(
                        "/topic/game/" + message.getGameId(),
                        message
                );
                logger.debug("Broadcast message from player: {} in game: {}, content: {}", 
                    message.getUserId(), message.getGameId(), message.getContent());
            } else {
                logger.warn("User {} not found in session for game: {}", message.getUserId(), message.getGameId());
            }
        } catch (Exception e) {
            logger.error("Error processing message for game: {} and user: {}", 
                message.getGameId(), message.getUserId(), e);
            throw e;
        }
    }
    
    // Handle player information exchange
    @MessageMapping("/game.playerInfo")
    public void handlePlayerInfo(@Payload GameMessage message) {
        logger.info("Received player info for game: {}, from user: {}", message.getGameId(), message.getUserId());
        
        try {
            // Get the game session
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            
            // Check if the session exists and the user is in the session
            if (session != null && session.isPlayerInSession(message.getUserId())) {
                // Forward the player info to all clients in the game
                messagingTemplate.convertAndSend(
                        "/topic/game/" + message.getGameId(),
                        message
                );
                logger.debug("Broadcast player info from player: {} in game: {}", 
                    message.getUserId(), message.getGameId());
            } else {
                logger.warn("User {} not found in session for game: {}", message.getUserId(), message.getGameId());
            }
        } catch (Exception e) {
            logger.error("Error processing player info for game: {} and user: {}", 
                message.getGameId(), message.getUserId(), e);
            throw e;
        }
    }
    
    // Handle user leaving a game
    @MessageMapping("/game.leave")
    public void leaveGame(@Payload GameMessage message) {
        logger.info("Received leave request for game: {}, from user: {}", message.getGameId(), message.getUserId());
        
        try {
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            logger.debug("Retrieved game session for game: {}", message.getGameId());
            
            // Remove the player from the session
            session.removePlayer(message.getUserId());
            logger.debug("Removed player: {} from game: {}", message.getUserId(), message.getGameId());
            
            // Notify remaining players
            messagingTemplate.convertAndSend(
                    "/topic/game/" + message.getGameId(),
                    new GameMessage(
                            message.getGameId(),
                            message.getUserId(),
                            GameMessage.MessageType.LEAVE,
                            "User " + message.getUserId() + " left the game."
                    )
            );
            logger.debug("Sent leave notification for player: {} in game: {}", message.getUserId(), message.getGameId());
            
            // If no players left, remove the game session
            if (session.getPlayerCount() == 0) {
                gameSessionService.removeGameSession(message.getGameId());
                logger.info("Game session {} removed as all players left", message.getGameId());
            }
        } catch (Exception e) {
            logger.error("Error processing leave request for game: {} and user: {}", 
                message.getGameId(), message.getUserId(), e);
            throw e;
        }
    }
    
    // Handle chess moves
    @MessageMapping("/game.move")
    public void handleMove(@Payload GameMessage message) {
        logger.info("Received move for game: {}, from user: {}", message.getGameId(), message.getUserId());
        
        try {
            // Get the game session
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            
            // Check if the session exists and the user is in the session
            if (session != null && session.isPlayerInSession(message.getUserId())) {
                // Forward the move to all clients in the game
                messagingTemplate.convertAndSend(
                        "/topic/game/" + message.getGameId(),
                        message
                );
                logger.debug("Broadcast move from player: {} in game: {}", 
                    message.getUserId(), message.getGameId());
            } else {
                logger.warn("User {} not found in session for game: {}", message.getUserId(), message.getGameId());
            }
        } catch (Exception e) {
            logger.error("Error processing move for game: {} and user: {}", 
                message.getGameId(), message.getUserId(), e);
            throw e;
        }
    }

    @MessageMapping("/game.gameOver")
    public void handleGameOver(@Payload GameMessage message) {
        logger.info("Received game over for game: {}, from user: {}", message.getGameId(), message.getUserId());
        
        try {
            // Get the game session
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            
            // Check if the session exists and the user is in the session
            if (session != null && session.isPlayerInSession(message.getUserId())) {
                // Forward the game over message to all clients in the game
                messagingTemplate.convertAndSend(
                        "/topic/game/" + message.getGameId(),
                        message
                );
                logger.debug("Broadcast game over from player: {} in game: {}", 
                    message.getUserId(), message.getGameId());
            } else {
                logger.warn("User {} not found in session for game: {}", message.getUserId(), message.getGameId());
            }
        } catch (Exception e) {
            logger.error("Error processing game over for game: {} and user: {}", 
                message.getGameId(), message.getUserId(), e);
            throw e;
        }
    }
    
    // Handle draw offers and responses
    @MessageMapping("/game.drawOffer")
    public void handleDrawOffer(@Payload GameMessage message) {
        logger.info("Received draw offer/response for game: {}, from user: {}, type: {}", 
            message.getGameId(), message.getUserId(), message.getType());
        logger.info("Draw message content: {}", message.getContent());
        
        try {
            // Get the game session
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            
            // Check if the session exists and the user is in the session
            if (session != null && session.isPlayerInSession(message.getUserId())) {
                // Forward the draw offer/response to all clients in the game
                messagingTemplate.convertAndSend(
                        "/topic/game/" + message.getGameId(),
                        message
                );
                logger.debug("Broadcast draw offer/response from player: {} in game: {}", 
                    message.getUserId(), message.getGameId());
            } else {
                logger.warn("User {} not found in session for game: {}", message.getUserId(), message.getGameId());
            }
        } catch (Exception e) {
            logger.error("Error processing draw offer/response for game: {} and user: {}", 
                message.getGameId(), message.getUserId(), e);
            throw e;
        }
    }
}