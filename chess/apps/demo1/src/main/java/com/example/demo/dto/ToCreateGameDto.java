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
public class ToCreateGameDto {
    private Integer PlayerId;
    private Integer PlayerElo;
    private String PlayerName;
    private String gameId;
}
