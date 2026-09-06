package mx.ipn.escom.sara.exception;

import mx.ipn.escom.sara.archivo.exception.AlmacenamientoArchivoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;


@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Captura errores relacionados con el procesamiento de fichas
     */
    @ExceptionHandler(AlmacenamientoArchivoException.class)
    public ResponseEntity<ErrorResponse> fileUploadExceptionErrorHandler(AlmacenamientoArchivoException ex){

        ErrorResponse errorDto = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                null
        );

        return new ResponseEntity<>(errorDto, HttpStatus.BAD_REQUEST);
    }



}
