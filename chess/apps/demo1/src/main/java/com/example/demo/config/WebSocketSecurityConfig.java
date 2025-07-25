package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;
import org.springframework.security.messaging.web.csrf.CsrfChannelInterceptor;
import org.springframework.messaging.support.ChannelInterceptor;

import java.util.logging.Logger;

@Configuration
@EnableWebSocketSecurity
public class WebSocketSecurityConfig {

    private static final Logger logger = Logger.getLogger(WebSocketSecurityConfig.class.getName());

    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager(MessageMatcherDelegatingAuthorizationManager.Builder messages) {
        logger.info("Configuring WebSocket message authorization");
        
        return messages
            .simpTypeMatchers(SimpMessageType.CONNECT, 
                             SimpMessageType.DISCONNECT,
                             SimpMessageType.SUBSCRIBE,
                             SimpMessageType.UNSUBSCRIBE,
                             SimpMessageType.MESSAGE,
                             SimpMessageType.OTHER).permitAll()
            .anyMessage().permitAll()
            .build();
    }
    
    @Bean
    public ChannelInterceptor csrfChannelInterceptor() {
        logger.info("CSRF protection for WebSockets has been disabled");
        return new ChannelInterceptor() {};
    }
} 
