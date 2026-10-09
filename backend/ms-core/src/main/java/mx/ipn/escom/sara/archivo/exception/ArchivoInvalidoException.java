package mx.ipn.escom.sara.archivo.exception;

/**
 * El archivo recibido esta vacio o no es un PDF valido.
 */
public class ArchivoInvalidoException extends RuntimeException {
    public ArchivoInvalidoException(String message) {
        super(message);
    }
}
