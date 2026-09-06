package mx.ipn.escom.sara.archivo.dto;

import java.util.List;

public record EmbeddingResponse (
        List<Float> embedding,
        int dimension,
        String transformerModel
){}
