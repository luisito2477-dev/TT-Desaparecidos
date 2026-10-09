package mx.ipn.escom.sara.archivo.utils;

import mx.ipn.escom.sara.archivo.dto.ProcessedFileResponse;
import mx.ipn.escom.sara.archivo.entity.Expediente;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;

/**
 * Convierte la respuesta de MS-IA en una entidad Expediente aplicando
 * las reglas de validacion de datos extraidos (RN-06).
 *
 * Un valor invalido se guarda como null; el resto de la ficha se conserva.
 */
@Component
public class ExpedienteMapper {

    private static final int EDAD_MINIMA = 0;
    private static final int EDAD_MAXIMA = 120;
    private static final Set<String> VALORES_VACIOS = Set.of("", "SIN DATO", "NO ENCONTRADO", "N/A");

    public Expediente aExpediente(ProcessedFileResponse r) {
        Expediente e = new Expediente();

        e.setNombre(texto(r.nombre()));
        e.setLugarNacimiento(texto(r.lugarNacimiento()));
        e.setSexo(mayusculas(texto(r.sexo())));
        e.setNacionalidad(texto(r.nacionalidad()));
        e.setHablaEspanol(r.hablaEspanol());
        e.setLenguaIndigena(texto(r.lenguaIndigena()));
        e.setDiscapacidad(texto(r.discapacidad()));
        e.setAutoridadReporte(texto(r.autoridadReporte()));
        e.setEstadoHechos(mayusculas(texto(r.estadoHechos())));
        e.setMunicipioHechos(mayusculas(texto(r.municipioHechos())));
        e.setCaracteristicasFisicas(texto(r.caracteristicasFisicas()));
        e.setSenasParticulares(texto(r.senasParticulares()));
        e.setPrendasVestir(texto(r.prendasVestir()));

        // Edades: rango valido y coherencia entre ambas
        Integer edadDesaparicion = edadValida(r.edadDesaparicion());
        Integer edadActual = edadValida(r.edadActual());
        if (edadDesaparicion != null && edadActual != null && edadActual < edadDesaparicion) {
            edadActual = null;
        }
        e.setEdadDesaparicion(edadDesaparicion);
        e.setEdadActual(edadActual);

        // Fechas: no futuras y coherentes entre si
        LocalDate hoy = LocalDate.now();
        LocalDate fechaHechos = fechaValida(r.fechaHechos(), hoy);
        LocalDate fechaPercato = fechaValida(r.fechaPercato(), hoy);
        if (fechaHechos != null && fechaPercato != null && fechaPercato.isBefore(fechaHechos)) {
            fechaPercato = null;
        }
        e.setFechaHechos(fechaHechos);
        e.setFechaPercato(fechaPercato);

        return e;
    }

    private String texto(String valor) {
        if (valor == null) {
            return null;
        }
        String limpio = valor.trim().replaceAll("\\s+", " ");
        return VALORES_VACIOS.contains(limpio.toUpperCase(Locale.ROOT)) ? null : limpio;
    }

    private String mayusculas(String valor) {
        return valor == null ? null : valor.toUpperCase(Locale.ROOT);
    }

    private Integer edadValida(Integer edad) {
        if (edad == null || edad < EDAD_MINIMA || edad > EDAD_MAXIMA) {
            return null;
        }
        return edad;
    }

    private LocalDate fechaValida(LocalDate fecha, LocalDate hoy) {
        if (fecha == null || fecha.isAfter(hoy)) {
            return null;
        }
        return fecha;
    }
}
