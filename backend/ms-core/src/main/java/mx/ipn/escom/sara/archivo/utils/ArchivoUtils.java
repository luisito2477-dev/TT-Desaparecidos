package mx.ipn.escom.sara.archivo.utils;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

public class ArchivoUtils {

    private static final Path bucketPath = Paths
            .get(System.getProperty("user.dir"))
            .getParent()
            .resolve("bucket");


    public static String subirArchivo(MultipartFile file) throws IOException{

        String nombreArchivo = file.getOriginalFilename();
        Path destino = bucketPath.resolve(nombreArchivo);
        file.transferTo(destino);

        return nombreArchivo;

    }

    /*
    public static String subirArchivo(MultipartFile file) throws IOException {

    // Obtener la extension .pdf
    String nombreOriginal = file.getOriginalFilename();
    String extension = "";
    if (nombreOriginal != null && nombreOriginal.contains(".")) {
        extension = nombreOriginal.substring(nombreOriginal.lastIndexOf("."));
    }

    //  Generar un nombre unico (ej. "8f93a12b-3124-4f92-a1b2-c3d4e5f6a7b8.pdf")
    String nombreSistema = UUID.randomUUID().toString() + extension;

    // resolver la ruta en el bucket local y guardar el archivo
    Path destino = bucketPath.resolve(nombreSistema);
    file.transferTo(destino);

    // Devolver el nombre del sistema para la base de datos
    return nombreSistema;
}
     */



}
