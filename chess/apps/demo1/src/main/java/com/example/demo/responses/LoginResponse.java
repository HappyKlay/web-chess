package com.example.demo.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@Builder
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private Integer elo;
    private Integer id;
//    private long expiresIn;
}