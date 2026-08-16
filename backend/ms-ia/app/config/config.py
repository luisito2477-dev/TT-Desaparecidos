import pytesseract

TESSERACT_PATH = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
POPPLER_PATH = r'C:\poppler\Library\bin'

OCR_CONFIG = r'--oem 3 --psm 6'

pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH