package mx.ipn.escom.sara.archivo.dto;

public record ProcessedFileResponse(
        String nombre,
        int edadDesaparicion,
        int edadActual,
        String lugarNacimiento,
        String sexo,
        String nacionalidad,
        String hablaEspanol,
        String lenguaIndigena,
        String discapacidad,
        String fechaHechos,
        String fechaPercato,
        String estadoHechos,
        String municipioHechos,
        String autoridadReporte,
        String caracteristicasFisicas,
        String senasParticulares,
        String prendasVestir,
        EmbeddingResponse embeddingData
) {}
