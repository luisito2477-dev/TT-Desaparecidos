package mx.ipn.escom.sara.archivo.service;

import mx.ipn.escom.sara.archivo.dto.EmbeddingResponse;
import mx.ipn.escom.sara.archivo.dto.ProcessedFileResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface HttpService {

    ProcessedFileResponse enviarArchivo(byte[] contenido, String nombreArchivo);

    public EmbeddingResponse textoAEmbedding(String textoBusqueda) throws IOException;
}
