import re
import pytesseract
from io import BytesIO
from config import settings, logger
from services.image_processor import preprocess_image


def extract_text_from_image(image_file: BytesIO) -> str:
    """Extract text using optimized OCR settings with error handling."""
    try:
        processed_img = preprocess_image(image_file)
        
        # Apply OCR with custom configuration
        text = pytesseract.image_to_string(
            processed_img, 
            config=settings.ocr_config
        )
        
        # Apply basic text cleaning
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        text = re.sub(r'[^\w\s.,:\-\(\)]', '', text)  # Remove special characters
        
        return text.strip()
    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        raise ValueError(f"Failed to extract text from image: {e}")