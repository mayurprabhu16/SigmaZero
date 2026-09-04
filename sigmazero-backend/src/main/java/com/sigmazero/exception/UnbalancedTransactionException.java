package com.sigmazero.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class UnbalancedTransactionException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public UnbalancedTransactionException(String message) {
        super(message);
    }
}