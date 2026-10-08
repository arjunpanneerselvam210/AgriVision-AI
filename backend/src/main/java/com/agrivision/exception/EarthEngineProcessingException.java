package com.agrivision.exception;

public class EarthEngineProcessingException extends RuntimeException {
    public EarthEngineProcessingException(String message) {
        super(message);
    }

    public EarthEngineProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}
