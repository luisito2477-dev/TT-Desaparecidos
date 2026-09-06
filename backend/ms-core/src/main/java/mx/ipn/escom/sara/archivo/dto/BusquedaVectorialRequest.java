package mx.ipn.escom.sara.archivo.dto;

import jakarta.validation.constraints.NotBlank;

public record BusquedaVectorialRequest(
        @NotBlank(message = "El texto de busqueda no puede estar vacio")
        String textoBusqueda
) {
}
