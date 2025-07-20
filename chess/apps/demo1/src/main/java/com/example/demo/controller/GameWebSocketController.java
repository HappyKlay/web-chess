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
    
    @MessageMapping("/game.join")
    public void joinGame(@Payload GameMessage message) {
        logger.info("Received join request for game: {}, from user: {}", message.getGameId(), message.getUserId());
        
        try {
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            logger.debug("Game session retrieved/created for game: {}", message.getGameId());
            
            session.addPlayer(message.getUserId());
            logger.debug("Added player: {} to game: {}", message.getUserId(), message.getGameId());
            
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
            
            if (session.isFull()) {
                logger.info("Game {} is now full and ready to start", message.getGameId());
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
    
    @MessageMapping("/game.message")
    public void handleMessage(@Payload GameMessage message) {
        logger.info("Received message for game: {}, from user: {}, type: {}", 
            message.getGameId(), message.getUserId(), message.getType());
        
        try {
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            
            if (session != null && session.isPlayerInSession(message.getUserId())) {
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
    
    @MessageMapping("/game.playerInfo")
    public void handlePlayerInfo(@Payload GameMessage message) {
        logger.info("Received player info for game: {}, from user: {}", message.getGameId(), message.getUserId());
        
        try {
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            
            if (session != null && session.isPlayerInSession(message.getUserId())) {
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
    
    @MessageMapping("/game.leave")
    public void leaveGame(@Payload GameMessage message) {
        logger.info("Received leave request for game: {}, from user: {}", message.getGameId(), message.getUserId());
        
        try {
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            logger.debug("Retrieved game session for game: {}", message.getGameId());
            
            session.removePlayer(message.getUserId());
            logger.debug("Removed player: {} from game: {}", message.getUserId(), message.getGameId());
            
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
    
    @MessageMapping("/game.move")
    public void handleMove(@Payload GameMessage message) {
        logger.info("Received move for game: {}, from user: {}", message.getGameId(), message.getUserId());
        
        try {
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            
            if (session != null && session.isPlayerInSession(message.getUserId())) {
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
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            
            if (session != null && session.isPlayerInSession(message.getUserId())) {
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
    
    @MessageMapping("/game.drawOffer")
    public void handleDrawOffer(@Payload GameMessage message) {
        logger.info("Received draw offer/response for game: {}, from user: {}, type: {}", 
            message.getGameId(), message.getUserId(), message.getType());
        logger.info("Draw message content: {}", message.getContent());
        
        try {
            GameSessionService.GameSession session = gameSessionService.getOrCreateGameSession(message.getGameId());
            
            if (session != null && session.isPlayerInSession(message.getUserId())) {
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
