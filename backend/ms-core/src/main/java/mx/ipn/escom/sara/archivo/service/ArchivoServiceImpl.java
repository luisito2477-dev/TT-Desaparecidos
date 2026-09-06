package mx.ipn.escom.sara.archivo.service;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import mx.ipn.escom.sara.archivo.dto.ProcessedFileResponse;
import mx.ipn.escom.sara.archivo.entity.ArchivoAdjunto;
import mx.ipn.escom.sara.archivo.entity.Expediente;
import mx.ipn.escom.sara.archivo.exception.AlmacenamientoArchivoException;
import mx.ipn.escom.sara.archivo.exception.FichaDuplicadaException;
import mx.ipn.escom.sara.archivo.repository.ArchivoAdjuntoRepository;
import mx.ipn.escom.sara.archivo.repository.EmbeddingRepository;
import mx.ipn.escom.sara.archivo.repository.ExpedienteRepository;
import mx.ipn.escom.sara.archivo.utils.ArchivoUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ArchivoServiceImpl implements ArchivoService {

    private final HttpService httpService;

    private final ArchivoAdjuntoRepository archivoAdjuntoRepository;

    private final ExpedienteRepository expedienteRepository;

    private final EmbeddingRepository embeddingRepository;


    @Override
    @Transactional
    public ProcessedFileResponse subirArchivo(MultipartFile archivo) {

        //verificar que el archivo no este vacio
        if(archivo.isEmpty()){
            throw new IllegalArgumentException("El archivo esta vacio.");
        }

        //verificamos que el archivo no exista ya en el bucket
        try {
            String hashMd5 = DigestUtils.md5DigestAsHex(archivo.getInputStream());
            if (archivoAdjuntoRepository.existsByHashMd5(hashMd5)) {
                throw new FichaDuplicadaException("El archivo subido ya ha sido procesado anteriormente.");
            }

            //hacemos peticion HTTP a MS-IA y obtenemos los datos de la ficha
            ProcessedFileResponse response = httpService.enviarArchivo(archivo);

            //podriamos aqui agregar una validacion para validar que la persona aun no exista en la DB
            // creando una clave como "ERNESTO MAGDALENO GONZALEZ GONZALES" + "06/03/2026" + "NUEVO LEON".
            //y comparar que no haya rows con los mismos datos


            //guardamos el archivo en el bucket
            String nombreSistema = ArchivoUtils.subirArchivo(archivo);

            //inserciones en la bd
            Expediente expediente = new Expediente();
            expediente.setNombre(response.nombre());
            expediente.setEdadDesaparicion(response.edadDesaparicion());
            expediente.setEdadActual(response.edadActual());
            expediente.setLugarNacimiento(response.lugarNacimiento());
            expediente.setSexo(response.sexo());
            expediente.setNacionalidad(response.nacionalidad());
            expediente.setHablaEspanol(response.hablaEspanol());
            expediente.setLenguaIndigena(response.lenguaIndigena());
            expediente.setDiscapacidad(response.discapacidad());
            expediente.setFechaHechos(LocalDate.parse(response.fechaHechos(), DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            expediente.setFechaPercato(LocalDate.parse(response.fechaPercato(), DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            expediente.setAutoridadReporte(response.autoridadReporte());
            expediente.setEstadoHechos(response.estadoHechos());
            expediente.setMunicipioHechos(response.municipioHechos());
            expediente.setCaracteristicasFisicas(response.caracteristicasFisicas());
            expediente.setSenasParticulares(response.senasParticulares());
            expediente.setPrendasVestir(response.prendasVestir());

            ArchivoAdjunto archivoAdjunto = new ArchivoAdjunto();
            archivoAdjunto.setNombreOriginal(archivo.getOriginalFilename());
            archivoAdjunto.setNombreSistema(nombreSistema);
            archivoAdjunto.setRuta("/archivos/" + nombreSistema);
            archivoAdjunto.setHashMd5(hashMd5);

            expediente.agregarArchivo(archivoAdjunto);

            //guardamos expediente y archivo Adjunto
            Expediente expedienteGuardado = expedienteRepository.save(expediente);


            String embeddingStr = response.embeddingData().embedding().toString();

            embeddingRepository.guardarEmbedding(
                    UUID.randomUUID(),
                    expedienteGuardado.getId(),
                    embeddingStr,
                    response.embeddingData().transformerModel(),
                    response.embeddingData().dimension()
            );

            return response;


        } catch(IOException e){
            throw new AlmacenamientoArchivoException("Error al procesar el flujo del archivo: " + e.getMessage());
        }

    }

}
