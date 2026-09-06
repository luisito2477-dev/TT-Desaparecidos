package mx.ipn.escom.sara.archivo.service;


import mx.ipn.escom.sara.archivo.dto.ProcessedFileResponse;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class HttpServiceImpl implements HttpService {

    private final RestClient restClient;



    private final String MS_IA_PROCESAR_ARCHIVO_URI = "/api/ms-ia/extraer-datos";

    public HttpServiceImpl(RestClient iaRestClient){
        this.restClient = iaRestClient;
    }

    @Override
    public ProcessedFileResponse enviarArchivo(MultipartFile file) throws IOException {

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };

        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(
                MediaType.parseMediaType(file.getContentType())
        );

        HttpEntity<ByteArrayResource> fileEntity =
                new HttpEntity<>(resource, fileHeaders);

        body.add("ficha", fileEntity);

        return restClient.post()
                .uri(MS_IA_PROCESAR_ARCHIVO_URI)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(ProcessedFileResponse.class);
    }

}
