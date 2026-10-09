class EmbeddingGenerationException(Exception):
    """No se pudo generar el embedding (respuesta 502)."""
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class FileFormatNotAllowedException(Exception):
    """El archivo recibido no es un PDF valido o esta vacio (respuesta 400)."""
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class FichaIlegibleException(Exception):
    """
    El PDF es valido pero no se pudo leer o no tiene el formato de una ficha
    del RNPDNO (respuesta 422).
    """
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message