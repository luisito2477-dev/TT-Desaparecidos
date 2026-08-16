package mx.ipn.escom.sara.busqueda.controller;


import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.function.EntityResponse;

@RequestMapping("/api/busqueda")
public class BusquedaController {


    @PostMapping("/avanzada")
    public EntityResponse<?> busquedaAvanzada(){

        //crear el dto request

        //llamar al service

        //crear el dto response


        return null;
    }

}
