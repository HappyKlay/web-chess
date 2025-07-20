package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GameDto {
    private Integer id;
    private Long blackPlayerId;
    private Integer blackPlayerElo;
    private String blackPlayerName;
    private Long whitePlayerId;
    private Integer whitePlayerElo;
    private String whitePlayerName;
    private String gameId;
    private LocalDateTime whitePlayerTimeLeft;
    private LocalDateTime blackPlayerTimeLeft;
    private String result;
    private String pgn;
}
