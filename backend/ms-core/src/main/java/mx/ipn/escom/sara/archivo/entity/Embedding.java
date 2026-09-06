package mx.ipn.escom.sara.archivo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "embeddings", schema = "ai_schema")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Embedding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private String id;

    @Column(name = "expediente_id", nullable = false, unique = true)
    private UUID expedienteId;

    @Column(name = "modelo_embedding", length = 100)
    private String modeloEmbedding;

    @Column(name = "dimension")
    private Integer dimension;

    //Como el hibernate no soporta de forma nativa el tipo vector
    //lo tendremos que guardar manualmente con consulta SQL en el repository
    @Transient
    private float[] vectorValores;

    @CreatedDate
    @Column(name = "creado_en")
    private LocalDateTime creadoEn;

}
