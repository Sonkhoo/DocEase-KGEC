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
DB_NAME = "Diversion"

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

async def get_specialty_and_doctor(query: str):
    """
    First check predefined specialties, then fallback to LLM if necessary.
    """
    query_lower = query.lower()
    specialty = next((spec for cond, spec in condition_to_specialty.items() if cond in query_lower), None)

    # If specialty is not found, use LLM
    if not specialty:
        specialty = await determine_specialty(query)
    
    if specialty:
        return await find_doctor_by_specialty(specialty)
    
    return "I couldn't determine the appropriate specialty. Please be more specific about your symptoms."

@app.get("/chat/")
async def chat(query: str):
    """
    Chat endpoint: Determines whether to return a doctor recommendation
    or an AI-generated response.
    """
    response = await get_specialty_and_doctor(query)
    return {"response": response}

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

# Run FastAPI Server on Port 5000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=5000, log_level="info")
