package mx.ipn.escom.sara.archivo.service;

import lombok.AllArgsConstructor;
import mx.ipn.escom.sara.archivo.dto.BusquedaVectorialRequest;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class BusquedaServiceImpl implements BusquedaService {

    private final HttpService httpService;

    @Override

    public void busquedaVectorial(BusquedaVectorialRequest request){
        //cacheo de busqueda en redis

        //si el texto recibido es el mismo que la consulta anterior
        //pues ya no hacemos la peticion xd

        //transformar textoBusqueda a vector

        //Realizar consulta vectorial en sql

        //paginacion y cacheo

        //devolvemos response

    }



}
