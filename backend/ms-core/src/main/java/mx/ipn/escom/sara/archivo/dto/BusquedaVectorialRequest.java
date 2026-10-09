package mx.ipn.escom.sara.archivo.dto;

import jakarta.validation.constraints.NotBlank;

public record BusquedaVectorialRequest(
        @NotBlank(message = "El texto de busqueda no puede estar vacio")
        String textoBusqueda
) {
        public BusquedaVectorialRequest {
                // Se aplica la transformación antes de la asignación implícita
                textoBusqueda = (textoBusqueda != null) ? textoBusqueda.trim().toLowerCase() : null;
        }
}
