import time
import spacy
import re
from groq import Groq
from functools import lru_cache
from fuzzywuzzy import process
from config import settings, logger
from db.medicine_db import ALL_MEDICINES

# Load medical NLP model
try:
    nlp = spacy.load("en_core_sci_sm")
    logger.info("Successfully loaded SpaCy NLP model")
except Exception as e:
    logger.warning(f"Failed to load SpaCy model: {e}. Using fallback model.")
    nlp = spacy.load("en_core_web_sm")


def correct_text_with_groq(text: str) -> str:
    """Use Groq AI model to correct OCR errors with error handling and retries."""
    if not settings.enable_ai_correction:
        logger.info("AI correction disabled")
        return text

    max_retries = 3
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            # Configure Groq client
            client = Groq(api_key=settings.groq_api_key)
            
            response = client.chat.completions.create(
                model="gemma2-9b-it",
                messages=[
                    {"role": "system", "content": (
                        "You are an AI assistant that corrects OCR-extracted text from medical prescriptions. "
                        "Maintain the original format but fix spelling errors, especially in medication names. "
                        "Only output the corrected text, nothing else."
                    )},
                    {"role": "user", "content": f"Correct the following OCR text from a medical prescription:\n{text}"}
                ],
                temperature=0.3,  # Lower temperature for more predictable corrections
                max_tokens=1024
            )
            corrected_text = response.choices[0].message.content.strip()
            logger.info("Successfully corrected text with AI")
            return corrected_text
            
        except Exception as e:
            logger.warning(f"Groq API Error (attempt {attempt+1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                logger.error(f"Failed all {max_retries} attempts to correct text with Groq")
                return text  # Return original text if all retries fail


@lru_cache(maxsize=100)
def correct_medication_name(med_name: str) -> str:
    """Use fuzzy matching to correct medication names with caching."""
    match, score = process.extractOne(med_name, ALL_MEDICINES)
    logger.debug(f"Medication match: '{med_name}' → '{match}' (score: {score})")
    return match if score > settings.fuzzy_match_threshold else med_name