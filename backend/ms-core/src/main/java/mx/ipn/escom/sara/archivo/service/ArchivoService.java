package mx.ipn.escom.sara.archivo.service;

import mx.ipn.escom.sara.archivo.dto.ProcessedFileResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ArchivoService {

    public ProcessedFileResponse subirArchivo(MultipartFile archivo);
}
