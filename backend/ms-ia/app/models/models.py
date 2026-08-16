import uuid
from app.database.connection import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import String, DateTime, func
from pgvector.sqlalchemy import Vector
from datetime import datetime, timezone


def generate_uuid() -> str:
    """Genera un UUID unico en formato string de 36 caracteres."""
    return str(uuid.uuid4())

class Embedding(Base):
    __tablename__ = "embeddings"
    __table_args__ = {'schema': 'ai_schema'}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )

    ficha_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False
    )

    vector: Mapped[list[float]] = mapped_column(
        Vector(384),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )

    modelo_transformer: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="paraphrase-multilingual-MiniLM-L12-v2"
    )







