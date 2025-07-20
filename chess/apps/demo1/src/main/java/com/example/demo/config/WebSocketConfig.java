package com.example.demo.config;

import com.example.demo.service.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);
    private final JwtService jwtService;

    public WebSocketConfig(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        logger.info("Registering STOMP endpoints");
        
        String[] allowedOrigins = {
            "http://localhost:5173",  // Development frontend
            "http://localhost:3000",  // Alternative frontend port
            "http://localhost:8080",  // Backend server 
            "http://127.0.0.1:5173", 
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:5500"   
        };
        
        registry.addEndpoint("/game-ws")
                .setAllowedOrigins(allowedOrigins) 
                .addInterceptors(new AuthHandshakeInterceptor())
                .withSockJS(); // SockJS fallback
                
        registry.addEndpoint("/game-ws")
                .setAllowedOrigins(allowedOrigins)
                .addInterceptors(new AuthHandshakeInterceptor());
        
        logger.info("STOMP endpoints registered successfully with allowed origins: {}", String.join(", ", allowedOrigins));
    }
    
    /**
     * Custom handshake interceptor to handle JWT authentication for WebSockets
     */
    private class AuthHandshakeInterceptor implements HandshakeInterceptor {
        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, 
                                       WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
            logger.debug("Processing WebSocket handshake request: {}", request.getURI());
            
            String token = null;
            
            if (request instanceof ServletServerHttpRequest) {
                ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
                
                // Get all parameters for logging
                Map<String, String[]> params = servletRequest.getServletRequest().getParameterMap();
                if (!params.isEmpty()) {
                    logger.debug("Request parameters: {}", params.keySet());
                }
                
                // Try to get token from query parameter
                token = servletRequest.getServletRequest().getParameter("token");
                if (token != null) {
                    logger.debug("Token found in query parameter");
                } else {
                    logger.debug("No token in query parameters");
                    
                    // Check if the token is part of the query string directly
                    String queryString = servletRequest.getServletRequest().getQueryString();
                    if (queryString != null && queryString.contains("token=")) {
                        logger.debug("Query string contains token: {}", queryString);
                        int tokenIndex = queryString.indexOf("token=");
                        if (tokenIndex >= 0) {
                            // Extract token value from query string
                            String tokenPart = queryString.substring(tokenIndex + 6); // "token=".length() == 6
                            // Find the end of the token (& or end of string)
                            int endIndex = tokenPart.indexOf('&');
                            token = endIndex >= 0 ? tokenPart.substring(0, endIndex) : tokenPart;
                            logger.debug("Extracted token from query string");
                        }
                    }
                }
                
                // If still no token, try to get from Authorization header
                if (token == null) {
                    String authHeader = servletRequest.getServletRequest().getHeader("Authorization");
                    logger.debug("Authorization header: {}", authHeader != null ? "Present" : "Not present");
                    
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        token = authHeader.substring(7);
                        logger.debug("Token extracted from Authorization header");
                    }
                }
                
                if (token != null) {
                    try {
                        // Validate the token
                        String username = jwtService.extractUsername(token);
                        if (username != null) {
                            logger.info("WebSocket authentication successful for user: {}", username);
                            // Store user info in attributes for later use
                            attributes.put("username", username);
                            attributes.put("token", token);
                            return true;
                        } else {
                            logger.warn("Username could not be extracted from token");
                        }
                    } catch (Exception e) {
                        // Token validation failed
                        logger.error("Token validation failed: {}", e.getMessage());
                        return true; // Still allow the connection in development
                    }
                } else {
                    logger.debug("No token found in request");
                }
            } else {
                logger.warn("Request is not a ServletServerHttpRequest: {}", request.getClass().getName());
            }
            
            // Allow connection even without a token - this is helpful during development
            // In production, you might want to return false here
            logger.info("Allowing WebSocket connection without authentication (development mode)");
            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, 
                                  WebSocketHandler wsHandler, Exception exception) {
            if (exception != null) {
                logger.error("Error during handshake: {}", exception.getMessage());
            } else {
                logger.debug("WebSocket handshake completed successfully for: {}", request.getURI());
            }
        }
    }
}