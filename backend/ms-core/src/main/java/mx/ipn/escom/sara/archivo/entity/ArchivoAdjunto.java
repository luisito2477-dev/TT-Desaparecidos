package mx.ipn.escom.sara.archivo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "archivos_adjuntos", schema = "core_schema")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
public class ArchivoAdjunto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediente_id", nullable = false)
    private Expediente expediente;

    @Column(name = "nombre_original")
    private String nombreOriginal;

    @Column(name = "nombre_sistema")
    private String nombreSistema;

    @Column(name = "hash_md5")
    private String hashMd5;

    @Column(name = "ruta")
    private String ruta;

    @CreatedDate
    @Column(name = "creado_en")
    private LocalDateTime creadoEn;

}
