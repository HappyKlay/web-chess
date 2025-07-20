package com.example.demo.service;

import com.example.demo.model.Game;
import com.example.demo.model.User;
import com.example.demo.repository.GameRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class GameService {
    private final GameRepository gameRepository;

    public List<Game> getUnstartedGames() {
        return gameRepository.findAll().stream()
                .filter(game -> game.getWhitePlayerId() == null || game.getBlackPlayerId() == null)
                .collect(Collectors.toList());
    }

    public List<Game> getStartedGames() {
        return gameRepository.findAll().stream()
                .filter(game -> game.getWhitePlayerId() != null && game.getBlackPlayerId() != null)
                .collect(Collectors.toList());
    }

    public List<Game> getGames() {
        return gameRepository.findAll();
    }

    public Game getGame(String gameId) {
        return gameRepository.findAll().stream()
                .filter(game -> game.getGameId().equals(gameId))
                .findFirst()
                .orElse(null);
    }

    public Game createGame(User gameDto, String gameCode) {
        Game game = Game.builder()
                .whitePlayerId(Long.valueOf(gameDto.getId()))
                .whitePlayerName(gameDto.getUsername())
                .whitePlayerElo(gameDto.getElo_rating())
                .blackPlayerElo(null)
                .blackPlayerName(null)
                .blackPlayerId(null)
                .gameId(gameCode)
                .pgn(null)
                .result(null)
                .build();
        return gameRepository.save(game);
    }

    public void deleteGame(String gameId) {
        log.info("Deleting game: {}", gameId);
        gameRepository.findAll().stream()
                .filter(game -> game.getGameId().equals(gameId))
                .findFirst()
                .ifPresent(game -> gameRepository.delete(game));
    }

    public List<Game> getAvailableGames() {
        return  gameRepository.findAll().stream()
                .filter(game -> (game.getWhitePlayerId() == null) ^ (game.getBlackPlayerId() == null))
                .collect(Collectors.toList());
    }

    public Game joinGame(String gameId, Long blackPlayerId, Integer blackPlayerElo, String blackPlayerName) {
        Game game = getGame(gameId);
        if (game == null) {
            log.error("Game not found with ID: {}", gameId);
            throw new IllegalArgumentException("Game not found");
        }
        
        game.setBlackPlayerId(blackPlayerId);
        game.setBlackPlayerElo(blackPlayerElo);
        game.setBlackPlayerName(blackPlayerName);
        
        log.info("Game {} updated with black player: {}", gameId, blackPlayerName);
        return gameRepository.save(game);
    }
}
