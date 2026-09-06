import pytesseract
from typing import Final
TESSERACT_PATH: Final[str] = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
POPPLER_PATH: Final[str] = r'C:\poppler\Library\bin'

OCR_CONFIG: Final[str] = r'--oem 3 --psm 6'

TRANSFORMER_MODEL: Final[str] = "paraphrase-multilingual-MiniLM-L12-v2"

pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH