package mx.ipn.escom.sara.archivo.controller;


import lombok.AllArgsConstructor;
import mx.ipn.escom.sara.archivo.dto.ProcessedFileResponse;
import mx.ipn.escom.sara.archivo.service.ArchivoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ms-core/archivos")
@CrossOrigin(origins = "*") // Habilita CORS para este controlador
@AllArgsConstructor
public class ArchivoController {

    private final ArchivoService archivoService;

    @PostMapping("/upload")
    public ResponseEntity<ProcessedFileResponse> subirArchivo(
            @RequestParam("file") MultipartFile archivo
            ){

        ProcessedFileResponse response = archivoService.subirArchivo(archivo);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

}
