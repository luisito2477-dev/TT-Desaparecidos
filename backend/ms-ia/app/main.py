from fastapi import FastAPI
from contextlib import asynccontextmanager
from logging import Logger, getLogger
from app.routes.controller import router
from app.exception.exceptions import *
from app.exception.exception_handlers import *
from app.service.nlp_service import EmbeddingService
from typing import (
    Optional,
    Final
)

logger: Logger = getLogger("MS-IA")

# Nombre del transformer model
MODEL_NAME: Final[str] = "paraphrase-multilingual-MiniLM-L12-v2"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Funcion que administra el ciclo de vida de la aplicacion.
    Servira para cargar todos los modelos y hacer todos los preparativos necesarios
    antes de correr el servidor.
    """
    # STARTUP: Se ejecuta cuando FastAPI levanta el servidor
    logger.info("Cargando modelo en RAM..")

    # Aqui creamos un objeto y lo guardamos en el contenedor global de la aplicacion (asi como un Bean en Spring Boot)
    app.state.embedding_service = EmbeddingService(MODEL_NAME)

    logger.info("Transformer model cargado y listo.")

    yield # La aplicacion se mantiene corriendo aqui

    # SHUTDOWN: Se ejecuta al apagar el servidor
    logger.info("Limpiando recursos de IA...")


app: FastAPI = FastAPI(
    title="MS-IA",
    version="1.0",
    lifespan=lifespan
)

# Registrar rutas
app.include_router(router)

# Exceptions
app.add_exception_handler(
    Exception,
    global_exception_handler
)

app.add_exception_handler(
    EmbeddingGenerationException,
    embedding_exception_handler
)

app.add_exception_handler(
    FileFormatNotAllowedException,
    file_format_exception_handler
)


@app.get("/")
def home():
    return { 
        "message": "Server corriendo en el puerto 8000." 
        }



