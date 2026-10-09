/*package mx.ipn.escom.sara.archivo.service;

import lombok.AllArgsConstructor;
import mx.ipn.escom.sara.archivo.dto.BusquedaResponse;
import mx.ipn.escom.sara.archivo.dto.BusquedaVectorialRequest;
import mx.ipn.escom.sara.archivo.dto.EmbeddingResponse;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.IOException;


@Service
@AllArgsConstructor
public class BusquedaServiceImpl implements BusquedaService {

    private final HttpService httpService;

    @Override
    public BusquedaResponse busquedaVectorial(BusquedaVectorialRequest request){

        try {
            //transformar textoBusqueda a vector
            EmbeddingResponse embeddingResponse = httpService.textoAEmbedding(request.textoBusqueda());
            //Realizar consulta vectorial en sql

            //paginacion

            //devolvemos response
            return null;
        } catch (IOException e){
            return null;
        }

    }



}
*/