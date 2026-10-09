package mx.ipn.escom.sara.archivo.utils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

/**
 * Manejo del almacenamiento fisico de las fichas (bucket local).
 *
 * La ruta del bucket se puede definir con la variable de entorno SARA_BUCKET_PATH
 * (por ejemplo, el volumen de Docker). Si no existe, se usa ../bucket.
 */
public final class ArchivoUtils {

    private static final Path bucketPath = Paths.get("../bucket").toAbsolutePath().normalize();

    private ArchivoUtils() {
    }

    private static Path resolverBucket() {
        String configurada = System.getenv("SARA_BUCKET_PATH");
        if (configurada != null && !configurada.isBlank()) {
            return Paths.get(configurada).toAbsolutePath().normalize();
        }
        Path actual = Paths.get(System.getProperty("user.dir")).toAbsolutePath();
        Path base = actual.getParent() != null ? actual.getParent() : actual;
        return base.resolve("bucket").normalize();
    }

    /**
     * Genera un nombre unico para el archivo (evita que dos fichas
     * con el mismo nombre original se sobrescriban).
     */
    public static String generarNombreSistema() {
        return UUID.randomUUID() + ".pdf";
    }

    public static Path guardarArchivo(byte[] contenido, String nombreSistema) throws IOException {
        Files.createDirectories(bucketPath);
        Path destino = bucketPath.resolve(nombreSistema).normalize();
        Files.write(destino, contenido, StandardOpenOption.CREATE_NEW);
        return destino;
    }

    public static void eliminarArchivo(String nombreSistema) {
        try {
            Files.deleteIfExists(bucketPath.resolve(nombreSistema).normalize());
        } catch (IOException ignored) {
            // No se interrumpe el flujo si no se pudo borrar el archivo huerfano
        }
    }
}
