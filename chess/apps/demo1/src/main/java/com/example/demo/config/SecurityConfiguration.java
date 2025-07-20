package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {
    private final AuthenticationProvider authenticationProvider;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfiguration(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            AuthenticationProvider authenticationProvider //ignore Bean warning we will get to that
    ) {
        this.authenticationProvider = authenticationProvider;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Authentication endpoints
                        .requestMatchers("/auth/**").permitAll()
                        
                        // Game-related endpoints
                        .requestMatchers("/game/**").permitAll()
                        .requestMatchers("/waiting-room/join/**").permitAll()
                        .requestMatchers("/waiting-room/**").permitAll()
                        
                        // WebSocket endpoints - very important to allow these
                        .requestMatchers("/game-ws/**").permitAll()
                        .requestMatchers("/game-ws").permitAll() // Main WebSocket endpoint
                        .requestMatchers("/game-ws/info").permitAll() // SockJS info endpoint
                        .requestMatchers("/game-ws/websocket").permitAll() // WebSocket transport endpoint
                        .requestMatchers("/game-ws/*/**").permitAll() // All SockJS transports
                        .requestMatchers("/topic/**").permitAll()
                        .requestMatchers("/app/**").permitAll()
                        
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:8080",
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5500"));
        
        // Allow all common HTTP methods plus WebSocket protocols
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        
        // Allow all standard headers plus WebSocket-specific ones
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization", 
                "Content-Type", 
                "X-Requested-With",
                "upgrade",
                "connection",
                "sec-websocket-key", 
                "sec-websocket-version", 
                "sec-websocket-extensions",
                "sec-websocket-protocol"));
                
        // Add WebSocket upgrade to exposed headers
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization", 
                "upgrade", 
                "connection", 
                "sec-websocket-accept"));
                
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}