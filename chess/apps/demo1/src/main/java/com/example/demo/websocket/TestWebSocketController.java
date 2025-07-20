package com.example.demo.websocket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class TestWebSocketController {

    @MessageMapping("/ping")
    @SendTo("/topic/pong")
    public String handlePing(String message) {
        return "Pong! Server received: " + message;
    }
} 