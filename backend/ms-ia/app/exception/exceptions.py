
class EmbeddingGenerationException(Exception):
    def __init__(self, message: str):
        self.message = message


class FileFormatNotAllowedException(Exception):
    def __init__(self, message: str):
            self.message = message