package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;


@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Getter
@Setter
@Table(name = "games")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Long blackPlayerId;
    private Integer blackPlayerElo;
    private String blackPlayerName;

    private Long whitePlayerId;
    private Integer whitePlayerElo;
    private String whitePlayerName;

    @Column(nullable = false, unique = true)
    private String gameId;

    private LocalDateTime whitePlayerTimeLeft;
    private LocalDateTime blackPlayerTimeleft;

    private String result;

    @Column(name = "PGN")
    private String pgn;
}