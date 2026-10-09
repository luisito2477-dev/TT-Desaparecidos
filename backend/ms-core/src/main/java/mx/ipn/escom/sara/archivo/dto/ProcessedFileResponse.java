package mx.ipn.escom.sara.archivo.dto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;

/**
 * Respuesta de MS-IA al procesar una ficha (POST /api/ms-ia/extraer-datos).
 *
 * Contrato con MS-IA:
 * - Los campos no extraidos llegan como null (nunca "SIN DATO").
 * - Fechas en formato ISO (yyyy-MM-dd).
 * - embeddingData es null si la ficha no tiene campos descriptivos.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProcessedFileResponse(
        String nombre,
        Integer edadDesaparicion,
        Integer edadActual,
        String lugarNacimiento,
        String sexo,
        String nacionalidad,
        Boolean hablaEspanol,
        String lenguaIndigena,
        String discapacidad,
        LocalDate fechaHechos,
        LocalDate fechaPercato,
        String estadoHechos,
        String municipioHechos,
        String autoridadReporte,
        String caracteristicasFisicas,
        String senasParticulares,
        String prendasVestir,
        EmbeddingResponse embeddingData
) {}