package mx.ipn.escom.sara.archivo.exception;

import lombok.Getter;

/**
 * Error al comunicarse con MS-IA o al procesar la ficha en MS-IA.
 * statusOrigen guarda el codigo HTTP que devolvio MS-IA
 * (o 503 si MS-IA no respondio).
 */
@Getter
public class ProcesamientoIAException extends RuntimeException {

    private final int statusOrigen;

    public ProcesamientoIAException(int statusOrigen, String message) {
        super(message);
        this.statusOrigen = statusOrigen;
    }
}