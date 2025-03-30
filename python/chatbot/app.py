import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from langchain_groq import ChatGroq
from motor.motor_asyncio import AsyncIOMotorClient

# Initialize FastAPI
app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq API Key
GROQ_API = "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"
llm = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=GROQ_API)

# MongoDB Connection
MONGO_URI = "mongodb+srv://sankhadeepchowdhury5:kLQVjGEATqicK1fk@cluster0.mox78.mongodb.net"
DB_NAME = "DocEase"

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
doctors_collection = db["doctors"]

# Condition-to-Specialty Mapping
condition_to_specialty = {
    "headache": "medicine",
    "fever": "medicine",
    "cough": "medicine",
    "fracture": "orthopedics",
    "joint pain": "orthopedics",
    "back pain": "orthopedics",
    "heart issue": "cardiology",
    "skin rash": "dermatology",
    "diabetes": "endocrinology",
}

async def determine_specialty(query: str):
    """
    If condition is not found in the predefined list, ask LLM to determine the specialty.
    """
    try:
        response = llm.invoke(
            f"""Given this medical condition or symptom: '{query}',
            what is the most appropriate medical specialty from this list:
            medicine, orthopedics, cardiology, dermatology, endocrinology, neurology, gastroenterology, pulmonology?
            Respond with ONLY the specialty name in lowercase."""
        )
        return response.content.strip().lower()
    except Exception as e:
        return None

async def get_llm_medical_response(query: str):
    """
    Get a general medical information response from the LLM for any medical query.
    """
    try:
        system_prompt = """You are DocAssist, a helpful and informative medical assistant. 
        Your purpose is to provide accurate medical information about symptoms, conditions, treatments, and general health advice.
        
        Guidelines:
        1. Always provide factual, evidence-based medical information
        2. Be thorough but concise in your explanations
        3. Use simple language that patients can understand
        4. Include preventive measures and self-care tips when appropriate
        5. For serious symptoms, always recommend consulting a healthcare professional
        6. Never provide definitive diagnoses - only information and guidance
        7. Avoid prescribing specific medications or dosages
        8. When discussing treatments, mention both benefits and potential risks
        9. Always maintain a calm, reassuring tone
        
        Remember to end your responses with a disclaimer that you're providing general information, not medical advice, and serious concerns should be addressed by a healthcare professional."""
        
        response = llm.invoke(
            f"""System: {system_prompt}
            
            User: {query}
            
            Assistant:"""
        )
        return response.content.strip()
    except Exception as e:
        return "I'm sorry, I'm having trouble processing your medical query. Please try again or consult a healthcare professional directly."

async def find_doctor_by_specialty(specialty: str):
    """
    Query MongoDB to find a doctor by their specialty.
    """
    doctor = await doctors_collection.find_one({"specialty": {"$in": [specialty]}})
    if doctor:
        return f"For this issue, I recommend Dr. {doctor['name']} (Specialty: {specialty})."
    return f"Sorry, no doctor found with specialty: {specialty}. Consider consulting a healthcare professional."

async def find_doctor_by_name(name: str):
    """
    Query MongoDB to find a doctor by their name.
    """
    doctor = await doctors_collection.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
    if doctor:
        specialties = ", ".join(doctor["specialty"])
        return f"Dr. {doctor['name']} specializes in {specialties}."
    return f"No doctor found with the name {name}."

async def determine_query_type(query: str):
    """
    Determine if the query is about finding a doctor or seeking medical information.
    """
    try:
        # Check if query is seeking a doctor recommendation
        doctor_keywords = ["doctor", "specialist", "physician", "recommend", "refer", "consult", "appointment"]
        
        # Convert query to lowercase for case-insensitive matching
        query_lower = query.lower()
        
        # Check if any doctor keywords are in the query
        is_doctor_query = any(keyword in query_lower for keyword in doctor_keywords)
        
        return "doctor" if is_doctor_query else "medical_info"
    except Exception:
        # Default to medical info if determination fails
        return "medical_info"

async def get_specialty_and_doctor(query: str):
    """
    First check predefined specialties, then fallback to LLM if necessary.
    """
    query_lower = query.lower()
    specialty = next((spec for cond, spec in condition_to_specialty.items() if cond in query_lower), None)

    # If specialty is not found, use LLM to determine specialty
    if not specialty:
        specialty = await determine_specialty(query)
    
    if specialty:
        return await find_doctor_by_specialty(specialty)
    
    return "I couldn't determine the appropriate specialty. Please be more specific about your symptoms."

@app.get("/chat/")
async def chat(query: str):
    """
    Chat endpoint: Determines whether to return a doctor recommendation
    or an AI-generated medical information response.
    """
    try:
        # Determine if the query is about finding a doctor or seeking medical information
        query_type = await determine_query_type(query)
        
        if query_type == "doctor":
            # If it's a doctor query, get doctor recommendation
            response = await get_specialty_and_doctor(query)
        else:
            # If it's a medical information query, get LLM response
            response = await get_llm_medical_response(query)
        
        return {"response": response}
    except Exception as e:
        return {"response": "I'm sorry, I encountered an error processing your request. Please try again with a different question."}

@app.get("/doctor/search/")
async def search_doctor(name: str = Query(None), specialty: str = Query(None)):
    """
    Endpoint to search for doctors by name or specialty.
    """
    if name:
        return {"response": await find_doctor_by_name(name)}
    if specialty:
        return {"response": await find_doctor_by_specialty(specialty)}
    
    return {"response": "Please provide a name or specialty to search."}

# Run FastAPI Server on Port 5173
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=5173, log_level="info")