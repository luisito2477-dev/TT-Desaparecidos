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
@AllArgsConstructor
public class ArchivoController {

    private final ArchivoService archivoService;

    @PostMapping("/upload")
    public ResponseEntity<ProcessedFileResponse> subirArchivo(
            @RequestParam("file") MultipartFile archivo
            ){

        ProcessedFileResponse response = archivoService.subirArchivo(archivo);

        System.out.println(response.nombre());
        System.out.println(response.edadDesaparicion());
        System.out.println(response.caracteristicasFisicas());

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

}
