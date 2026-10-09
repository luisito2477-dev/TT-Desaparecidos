package mx.ipn.escom.sara.archivo.dto;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


/**
 * Embedding devuelto por MS-IA: {embedding, dimension, transformerModel}
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record EmbeddingResponse(
        List<Float> embedding,
        int dimension,
        String transformerModel
) {}
