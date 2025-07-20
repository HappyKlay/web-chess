package com.example.demo.responses;

import com.example.demo.model.Game;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class GameListResponse {
    private List<Game> games;
}
