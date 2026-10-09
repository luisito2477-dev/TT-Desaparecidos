package mx.ipn.escom.sara.archivo.service;

import mx.ipn.escom.sara.archivo.dto.BusquedaResponse;
import mx.ipn.escom.sara.archivo.dto.BusquedaVectorialRequest;

public interface BusquedaService {

    public BusquedaResponse busquedaVectorial(BusquedaVectorialRequest request);
}
