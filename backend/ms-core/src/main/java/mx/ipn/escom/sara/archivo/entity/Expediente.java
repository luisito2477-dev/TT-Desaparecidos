package mx.ipn.escom.sara.archivo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "expedientes", schema = "core_schema")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
public class Expediente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToMany(mappedBy = "expediente", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ArchivoAdjunto> archivos = new ArrayList<>();

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "edad_desaparicion")
    private int edadDesaparicion;

    @Column(name = "edad_actual")
    private int edadActual;

    @Column(name = "lugar_nacimiento")
    private String lugarNacimiento;

    @Column(name = "sexo")
    private String sexo;

    @Column(name = "nacionalidad")
    private String nacionalidad;

    @Column(name = "habla_espanol")
    private String hablaEspanol; //NOTA: igual y se podria usar ENUM

    @Column(name = "lengua_indigena")
    private String lenguaIndigena; //NOTA: igual y se podria usar ENUM

    @Column(name = "discapacidad")
    private String discapacidad;

    @Column(name = "fecha_hechos")
    private LocalDate fechaHechos;

    @Column(name = "fecha_percato")
    private LocalDate fechaPercato;

    @Column(name = "autoridad_reporte")
    private String autoridadReporte;

    @Column(name = "estado_hechos")
    private String estadoHechos;

    @Column(name = "municipio_hechos")
    private String municipioHechos;

    @Column(name = "caracteristicas_fisicas")
    private String caracteristicasFisicas;

    @Column(name = "senas_particulares")
    private String senasParticulares;

    @Column(name = "prendas_vestir")
    private String prendasVestir;

    @CreatedDate
    @Column(name = "creado_en")
    private LocalDateTime creadoEn;


    public void agregarArchivo(ArchivoAdjunto archivo) {
        this.archivos.add(archivo);
        archivo.setExpediente(this); // Asigna la clave foránea en memoria
    }



}
