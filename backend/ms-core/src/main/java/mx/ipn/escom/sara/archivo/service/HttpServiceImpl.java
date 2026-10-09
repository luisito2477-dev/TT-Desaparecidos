package mx.ipn.escom.sara.archivo.service;


import lombok.extern.slf4j.Slf4j;
import mx.ipn.escom.sara.archivo.dto.EmbeddingResponse;
import mx.ipn.escom.sara.archivo.dto.ProcessedFileResponse;
import mx.ipn.escom.sara.archivo.exception.ProcesamientoIAException;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class HttpServiceImpl implements HttpService {

    private final RestClient restClient;

    private final String MS_IA_PROCESAR_ARCHIVO_URI = "/api/ms-ia/extraer-datos";
    private final String MS_IA_GENERAR_EMBEDDING_URI = "/api/ms-ia/embedding";
    private final ObjectMapper objectMapper;

    public HttpServiceImpl(RestClient iaRestClient, ObjectMapper objectMapper) {
        this.restClient = iaRestClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public ProcessedFileResponse enviarArchivo(byte[] contenido, String nombreArchivo) {
        final String nombre = (nombreArchivo == null || nombreArchivo.isBlank()) ? "ficha.pdf" : nombreArchivo;

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        ByteArrayResource resource = new ByteArrayResource(contenido) {
            @Override
            // FastAPI necesita el nombre de archivo para tratar la parte como UploadFile
            public String getFilename() {
                return nombre;
            }
        };

        HttpHeaders fileHeaders = new HttpHeaders();

        fileHeaders.setContentType(MediaType.APPLICATION_PDF);

        HttpEntity<ByteArrayResource> fileEntity =
                new HttpEntity<>(resource, fileHeaders);

        body.add("ficha", fileEntity);

        try {
            ProcessedFileResponse response = restClient.post()
                    .uri(MS_IA_PROCESAR_ARCHIVO_URI)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, this::manejarError)
                    .body(ProcessedFileResponse.class);

            if (response == null) {
                throw new ProcesamientoIAException(502, "MS-IA devolvio una respuesta vacia.");
            }
            return response;
        } catch (ResourceAccessException e) {
            // Timeout o MS-IA apagado
            throw new ProcesamientoIAException(503, "No fue posible comunicarse con MS-IA: " + e.getMessage());
        }
    }

    @Override
    public EmbeddingResponse textoAEmbedding(String textoBusqueda) throws IOException{
        return restClient.post()
                .uri(MS_IA_GENERAR_EMBEDDING_URI)
                .contentType(MediaType.APPLICATION_JSON)
                .body(textoBusqueda)
                .retrieve()
                .body(EmbeddingResponse.class);
    }

    /**
     * Convierte una respuesta de error de MS-IA en ProcesamientoIAException,
     * conservando el codigo HTTP y el mensaje que envio MS-IA.
     */
    private void manejarError(HttpRequest request, ClientHttpResponse response) throws IOException {
        int status = response.getStatusCode().value();
        String cuerpo = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
        String mensaje = extraerMensaje(cuerpo);
        log.warn("MS-IA respondio {} en {}: {}", status, request.getURI(), mensaje);
        throw new ProcesamientoIAException(status, mensaje);
    }

    private String extraerMensaje(String cuerpo) {
        try {
            JsonNode json = objectMapper.readTree(cuerpo);
            if (json.hasNonNull("message")) {
                return json.get("message").asText();
            }
            if (json.hasNonNull("detail")) {
                return json.get("detail").toString();
            }
        } catch (Exception ignored) {
            // El cuerpo no es JSON
        }
        return cuerpo.isBlank() ? "Error en MS-IA" : cuerpo;
    }

}
