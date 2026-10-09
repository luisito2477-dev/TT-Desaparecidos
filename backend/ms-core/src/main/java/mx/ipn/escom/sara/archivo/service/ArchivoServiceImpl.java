package mx.ipn.escom.sara.archivo.service;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mx.ipn.escom.sara.archivo.dto.EmbeddingResponse;
import mx.ipn.escom.sara.archivo.dto.ProcessedFileResponse;
import mx.ipn.escom.sara.archivo.entity.ArchivoAdjunto;
import mx.ipn.escom.sara.archivo.entity.Expediente;
import mx.ipn.escom.sara.archivo.exception.AlmacenamientoArchivoException;
import mx.ipn.escom.sara.archivo.exception.ArchivoInvalidoException;
import mx.ipn.escom.sara.archivo.exception.FichaDuplicadaException;
import mx.ipn.escom.sara.archivo.exception.ProcesamientoIAException;
import mx.ipn.escom.sara.archivo.repository.ArchivoAdjuntoRepository;
import mx.ipn.escom.sara.archivo.repository.EmbeddingRepository;
import mx.ipn.escom.sara.archivo.repository.ExpedienteRepository;
import mx.ipn.escom.sara.archivo.utils.ArchivoUtils;
import mx.ipn.escom.sara.archivo.utils.ExpedienteMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.DigestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.springframework.transaction.support.TransactionSynchronization.STATUS_ROLLED_BACK;

@Slf4j
@Service
@AllArgsConstructor
public class ArchivoServiceImpl implements ArchivoService {

    private static final byte[] FIRMA_PDF = "%PDF-".getBytes(StandardCharsets.US_ASCII);

    private final HttpService httpService;

    private final ArchivoAdjuntoRepository archivoAdjuntoRepository;

    private final ExpedienteRepository expedienteRepository;

    private final EmbeddingRepository embeddingRepository;

    private final ExpedienteMapper expedienteMapper;


    @Override
    @Transactional
    public ProcessedFileResponse subirArchivo(MultipartFile archivo) {

        // 1. Leer el archivo una sola vez y validar que sea un PDF real
        byte[] contenido = leerContenido(archivo);
        validarPdf(contenido);

        // 2. Verificar duplicados (RN-05)
        String hashMd5 = DigestUtils.md5DigestAsHex(contenido);
        if (archivoAdjuntoRepository.existsByHashMd5(hashMd5)) {
            throw new FichaDuplicadaException("El archivo subido ya ha sido procesado anteriormente.");
        }

        // 3. Procesar la ficha en MS-IA (OCR + extraccion + embedding)
        ProcessedFileResponse response = httpService.enviarArchivo(contenido, archivo.getOriginalFilename());

        // 4. Construir el expediente aplicando las validaciones (RN-06)
        Expediente expediente = expedienteMapper.aExpediente(response);

        String nombreSistema = ArchivoUtils.generarNombreSistema();
        ArchivoAdjunto archivoAdjunto = new ArchivoAdjunto();
        archivoAdjunto.setNombreOriginal(archivo.getOriginalFilename());
        archivoAdjunto.setNombreSistema(nombreSistema);
        archivoAdjunto.setRuta("/archivos/" + nombreSistema);
        archivoAdjunto.setHashMd5(hashMd5);
        expediente.agregarArchivo(archivoAdjunto);

        // 5. Guardar expediente + archivo adjunto. saveAndFlush asegura que el
        //    expediente ya exista en la BD antes de insertar el embedding (llave foranea).
        Expediente expedienteGuardado = expedienteRepository.saveAndFlush(expediente);

        // 6. Guardar el vector (si la ficha tiene campos descriptivos)
        guardarEmbedding(expedienteGuardado.getId(), response.embeddingData());

        // 7. Guardar el PDF al final: si algo falla antes, no queda un archivo huerfano.
        //    Si la transaccion falla despues de guardarlo, se borra en afterCompletion.
        guardarPdf(contenido, nombreSistema);

        log.info("Ficha registrada: expediente {} ({})", expedienteGuardado.getId(), archivo.getOriginalFilename());
        return response;

    }

    private byte[] leerContenido(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ArchivoInvalidoException("El archivo esta vacio.");
        }
        try {
            return archivo.getBytes();
        } catch (IOException e) {
            throw new AlmacenamientoArchivoException("Error al leer el archivo: " + e.getMessage());
        }
    }

    private void validarPdf(byte[] contenido) {
        // La extension y el Content-Type pueden ser incorrectos; la firma del archivo no
        if (contenido.length < FIRMA_PDF.length
                || !Arrays.equals(Arrays.copyOf(contenido, FIRMA_PDF.length), FIRMA_PDF)) {
            throw new ArchivoInvalidoException("El archivo no es un PDF valido.");
        }
    }

    private void guardarEmbedding(UUID expedienteId, EmbeddingResponse data) {
        if (data == null || data.embedding() == null || data.embedding().isEmpty()) {
            log.warn("El expediente {} se registro sin embedding (sin campos descriptivos).", expedienteId);
            return;
        }
        if (data.dimension() != data.embedding().size()) {
            throw new ProcesamientoIAException(502,
                    "Dimension del embedding inconsistente: " + data.dimension() + " vs " + data.embedding().size());
        }

        // Formato que entiende pgvector: [0.1,0.2,...]
        String vector = data.embedding().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",", "[", "]"));
        String modelo = data.transformerModel() != null ? data.transformerModel() : "desconocido";

        embeddingRepository.guardarEmbedding(UUID.randomUUID(), expedienteId, vector, modelo, data.dimension());
    }

    private void guardarPdf(byte[] contenido, String nombreSistema) {
        try {
            ArchivoUtils.guardarArchivo(contenido, nombreSistema);
        } catch (IOException e) {
            // Lanza la excepcion -> la transaccion hace rollback de los inserts
            throw new AlmacenamientoArchivoException("No se pudo guardar el PDF: " + e.getMessage());
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    ArchivoUtils.eliminarArchivo(nombreSistema);
                }
            }
        });
    }

}
