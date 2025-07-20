package com.example.demo.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameSessionService {
    private final Map<String, GameSession> activeSessions = new ConcurrentHashMap<>();
    
    public GameSession getOrCreateGameSession(String gameId) {
        return activeSessions.computeIfAbsent(gameId, GameSession::new);
    }
    
    public void removeGameSession(String gameId) {
        activeSessions.remove(gameId);
    }
    
    public boolean isGameReady(String gameId) {
        GameSession session = activeSessions.get(gameId);
        return session != null && session.isFull();
    }
    
    public static class GameSession {
        private final String gameId;
        private final Map<String, String> players = new ConcurrentHashMap<>();
        private static final int MAX_PLAYERS = 2;
        
        public GameSession(String gameId) {
            this.gameId = gameId;
        }
        
        public void addPlayer(String userId) {
            if (players.size() < MAX_PLAYERS) {
                players.put(userId, userId);
            }
        }
        
        public void removePlayer(String userId) {
            players.remove(userId);
        }
        
        public boolean isFull() {
            return players.size() >= MAX_PLAYERS;
        }
        
        public int getPlayerCount() {
            return players.size();
        }
        
        public boolean isPlayerInSession(String userId) {
            return players.containsKey(userId);
        }
    }
}