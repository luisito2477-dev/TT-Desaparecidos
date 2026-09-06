package mx.ipn.escom.sara.archivo.controller;


import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import mx.ipn.escom.sara.archivo.dto.BusquedaVectorialRequest;
import mx.ipn.escom.sara.archivo.service.ArchivoService;
import mx.ipn.escom.sara.archivo.service.BusquedaService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.function.EntityResponse;

@AllArgsConstructor
@RestController()
@RequestMapping("/api/busqueda")
public class BusquedaController {

    private final BusquedaService busquedaService;


    @PostMapping("/avanzada")
    public EntityResponse<?> busquedaAvanzada(){

        //crear el dto request

        //llamar al service

        //crear el dto response


        return null;
    }

    @PostMapping("/vectorial")
    public EntityResponse<?> busquedaVectorial(
            @Valid
            @RequestBody
            BusquedaVectorialRequest request
    ){

        busquedaService.busquedaVectorial(request);

        return null;
    }

}
