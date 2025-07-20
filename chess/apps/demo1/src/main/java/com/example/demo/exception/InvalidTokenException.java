package com.example.demo.exception;

public class InvalidTokenException extends Throwable {
    public InvalidTokenException(String invalidJwtToken, RuntimeException e) {
    }
}
