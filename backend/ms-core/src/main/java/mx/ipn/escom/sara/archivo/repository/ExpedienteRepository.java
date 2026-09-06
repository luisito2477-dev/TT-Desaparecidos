package mx.ipn.escom.sara.archivo.repository;

import mx.ipn.escom.sara.archivo.entity.Expediente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ExpedienteRepository extends JpaRepository<Expediente, UUID>{
    /**
     * Metodos ya incluidos por JpaRepository
     * save(User user) (Sirve tanto para registrar nuevos como para actualizar).
     *
     * findById(UUID id) (Busca por llave primaria).
     *
     * findAll() (Trae a todos los registros).
     *
     * deleteById(UUID id) (Borra de la base de datos).
     *
     * existsById(UUID id) (Verifica si el ID ya existe).
     */
}
