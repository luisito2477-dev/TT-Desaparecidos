package mx.ipn.escom.sara.archivo.repository;

import mx.ipn.escom.sara.archivo.entity.Embedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface EmbeddingRepository extends JpaRepository<Embedding, UUID> {

    @Modifying
    @Query(value = """
        INSERT INTO ai_schema.embeddings
            (id, expediente_id, embedding, modelo_embedding, dimension)
        VALUES
            (:id, :expedienteId, CAST(:embeddingStr AS VECTOR), :modelo, :dimension)
    """, nativeQuery = true)
    void guardarEmbedding(
            @Param("id") UUID id,
            @Param("expedienteId") UUID expedienteId,
            @Param("embeddingStr") String embeddingStr,
            @Param("modelo") String modelo,
            @Param("dimension") Integer dimension
    );
}
