package mx.ipn.escom.sara.archivo.service;

import mx.ipn.escom.sara.archivo.dto.ProcessedFileResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface HttpService {

    public ProcessedFileResponse enviarArchivo(MultipartFile file) throws IOException;

}
