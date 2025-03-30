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
                temperature=0.6,  # Lower temperature for more predictable corrections
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


def extract_medications_with_llm(text: str) -> list:
    """Use LLM to extract structured medication information from complex prescriptions."""
    max_retries = 2
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            # Configure Groq client
            client = Groq(api_key=settings.groq_api_key)
            
            response = client.chat.completions.create(
                model="llama-3.1-70b-versatile",  # Using a powerful LLM for accurate extraction
                messages=[
                    {"role": "system", "content": (
                        "You are a medical prescription analyzer specialized in extracting medication information. "
                        "Extract all medications from the prescription with their complete details. "
                        "For each medication, identify: "
                        "1. Exact name (correct any misspellings) "
                        "2. Dosage (amount and unit) "
                        "3. Administration instructions (frequency, timing, etc.) "
                        "Respond ONLY with a JSON array of medication objects containing 'name', 'dosage', and 'instructions' fields. "
                        "Example format: [{\"name\":\"Metformin\",\"dosage\":\"500 mg\",\"instructions\":\"1 tablet twice daily\"}]"
                    )},
                    {"role": "user", "content": f"Extract medications from this prescription:\n{text}"}
                ],
                temperature=0.2,  # Low temperature for more deterministic extraction
                max_tokens=1024,
                response_format={"type": "json_object"}
            )
            
            result = response.choices[0].message.content.strip()
            logger.info("Successfully extracted medications with LLM")
            
            import json
            try:
                # Parse the JSON response
                parsed_response = json.loads(result)
                if "medications" in parsed_response:
                    return parsed_response["medications"]
                return parsed_response.get("medications", [])
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON: {e}")
                logger.debug(f"Raw LLM response: {result}")
                return []
            
        except Exception as e:
            logger.warning(f"LLM Extraction Error (attempt {attempt+1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                logger.error(f"Failed all {max_retries} attempts to extract medications with LLM")
                return []  # Return empty list if all retries fail


@lru_cache(maxsize=100)
def correct_medication_name(med_name: str) -> str:
    """Use fuzzy matching to correct medication names with caching."""
    match, score = process.extractOne(med_name, ALL_MEDICINES)
    logger.debug(f"Medication match: '{med_name}' → '{match}' (score: {score})")
    return match if score > settings.fuzzy_match_threshold else med_name


def extract_structured_medications(text: str) -> list:
    """Extract structured medication information from prescription text.
    First tries LLM-based extraction, then falls back to rule-based extraction if needed."""
    
    # Try LLM-based extraction first for complex prescriptions
    llm_medications = extract_medications_with_llm(text)
    if llm_medications and len(llm_medications) > 0:
        logger.info(f"Successfully extracted {len(llm_medications)} medications using LLM")
        return llm_medications
    
    # Initialize medications list for rule-based extraction
    medications = []
    
    # Process the text with NLP model
    doc = nlp(text)
    
    # Common dosage patterns
    dosage_pattern = re.compile(r'(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|tablet|capsule|tablespoon|teaspoon)', re.IGNORECASE)
    
    # Common frequency patterns including medical abbreviations (QD, BID, TID, QID)
    frequency_pattern = re.compile(
        r'(once|twice|three times|four times|every\s*\d+\s*hours?|daily|weekly|monthly|morning|evening|night|before meal|after meal|QD|BID|TID|QID)',
        re.IGNORECASE
    )
    
    # Split text into lines to process prescription items
    lines = text.split('\n')
    current_medication = None
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Look for numbered items or bullet points which often indicate medications
        # Also look for lines containing dosage information or medical abbreviations
        if re.match(r'^\d+[\.\)]|•', line) or any(keyword in line.lower() for keyword in ['tab', 'capsule', 'mg', 'ml']) or re.search(r'\b(QD|BID|TID|QID)\b', line, re.IGNORECASE):
            # Extract medication name
            # First, try to find the dosage pattern to split the line
            dosage_match = dosage_pattern.search(line)
            if dosage_match:
                # The medication name is likely before the dosage
                med_name = line[:dosage_match.start()].strip()
                med_name = re.sub(r'^\d+[\.\)]|•', '', med_name).strip()  # Remove numbering
                
                # Use fuzzy matching to correct medication name
                med_name = correct_medication_name(med_name)
                
                # Extract dosage
                dosage = dosage_match.group(0)
                
                # Extract frequency/instructions (might be on the next line)
                instructions = ""
                freq_match = frequency_pattern.search(line)
                if freq_match:
                    instructions = line[freq_match.start():].strip()
                elif i + 1 < len(lines) and lines[i + 1].strip() and not re.match(r'^\d+[\.\)]|•', lines[i + 1]):
                    # Check if next line has instructions
                    instructions = lines[i + 1].strip()
                
                # Look for medical abbreviations in the line
                for abbr in ["QD", "BID", "TID", "QID"]:
                    if re.search(rf'\b{abbr}\b', line, re.IGNORECASE):
                        abbr_meanings = {
                            "QD": "once daily",
                            "BID": "twice daily",
                            "TID": "three times daily",
                            "QID": "four times daily"
                        }
                        if not instructions:
                            instructions = abbr_meanings.get(abbr.upper(), abbr)
                        elif abbr.upper() not in instructions.upper():
                            instructions += f" ({abbr_meanings.get(abbr.upper(), abbr)})"
                
                # Create medication object
                medication = {
                    "name": med_name,
                    "dosage": dosage,
                    "instructions": instructions
                }
                
                medications.append(medication)
    
    # If no structured medications found, try fallback method
    if not medications:
        for entity in doc.ents:
            if entity.label_ in ["CHEMICAL", "ORG", "PRODUCT"]:  # These labels often catch medication names
                # Try to find dosage near this entity
                context = text[max(0, entity.start_char-50):min(len(text), entity.end_char+50)]
                dosage_match = dosage_pattern.search(context)
                dosage = dosage_match.group(0) if dosage_match else ""
                
                # Look for frequency abbreviations
                instructions = ""
                for abbr in ["QD", "BID", "TID", "QID"]:
                    if re.search(rf'\b{abbr}\b', context, re.IGNORECASE):
                        abbr_meanings = {
                            "QD": "once daily",
                            "BID": "twice daily",
                            "TID": "three times daily",
                            "QID": "four times daily"
                        }
                        instructions = abbr_meanings.get(abbr.upper(), abbr)
                        break
                
                # Create medication object with limited info
                medication = {
                    "name": correct_medication_name(entity.text),
                    "dosage": dosage,
                    "instructions": instructions
                }
                
                medications.append(medication)
    
    return medications