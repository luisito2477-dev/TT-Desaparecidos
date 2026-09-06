package mx.ipn.escom.sara.exception;

import java.util.Map;

public record ErrorResponse(

        int status,
        String message,
        Map<String, String> errors

){}
