package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Getter
@Setter
@Table(name = "waiting_rooms")
public class WaitingRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(unique = true, nullable = false)
    private String gameCode;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User host;

    @Column(nullable = false)
    private LocalDateTime creationTime;

    private boolean active;

    public static String generateGameCode() {
        String code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return code.substring(0, 4) + "-" + code.substring(4);
    }
}
