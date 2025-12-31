from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import pickle
from collections import Counter
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the FastAPI app
app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the label encoder and feature names
with open('label_encoder.pkl', 'rb') as f:
    le = pickle.load(f)
with open('feature_names.pkl', 'rb') as f:
    feature_names = pickle.load(f)

# Load datasets for merging results
doc_data = pd.read_csv("Doctor_Versus_Disease.csv", encoding='latin1', names=['Disease', 'Specialist'])
des_data = pd.read_csv("Disease_Description.csv")

# Update specialist for Tuberculosis
doc_data['Specialist'] = np.where((doc_data['Disease'] == 'Tuberculosis'), 'Pulmonologist', doc_data['Specialist'])

# Load models
models = {}
model_names = ['Logistic Regression', 'Decision Tree', 'Random Forest', 'SVM', 'NaiveBayes', 'K-Nearest Neighbors']
for model_name in model_names:
    with open(f'{model_name}.pkl', 'rb') as f:
        models[model_name] = pickle.load(f)

# Define the request model
class SymptomsRequest(BaseModel):
    symptoms: list

# Health check endpoint
@app.get("/")
def health_check():
    return {"status": "healthy", "message": "Arogami Disease Prediction API is running"}

# Get available symptoms endpoint
@app.get("/symptoms")
def get_symptoms():
    return {"symptoms": feature_names, "total": len(feature_names)}

# Define function to normalize and map symptoms
def normalize_symptoms(input_symptoms):
    """
    Normalize user input symptoms to match model feature names
    """
    # Create a mapping of common user inputs to actual feature names
    symptom_mapping = {
        'fever': 'high fever',
        'low fever': 'mild fever', 
        'temperature': 'high fever',
        'cold': 'cold hands and feets',
        'stomach ache': 'stomach pain',
        'back ache': 'back pain',
        'headaches': 'headache',
        'vomit': 'vomiting',
        'throwing up': 'vomiting',
        'diarrhea': 'diarrhoea',
        'loose motion': 'diarrhoea',
        'tiredness': 'fatigue',
        'tired': 'fatigue',
        'weakness': 'muscle weakness',
        'joint pain': 'swelling joints',
        'eye pain': 'pain behind the eyes',
        'hip pain': 'hip joint pain',
        'breathlessness': 'continuous sneezing',
        'sneezing': 'continuous sneezing',
        'runny nose': 'congestion',
        'stuffy nose': 'congestion',
        'dizzy': 'dizziness',
        'light headed': 'dizziness',
        'belly pain': 'abdominal pain',
        'tummy pain': 'abdominal pain',
        'stomach pain': 'stomach pain'
    }
    
    normalized_symptoms = []
    for symptom in input_symptoms:
        symptom_lower = symptom.lower().strip()
        
        # Direct match in feature names
        if symptom_lower in [f.lower() for f in feature_names]:
            # Find the exact case match
            exact_match = next(f for f in feature_names if f.lower() == symptom_lower)
            normalized_symptoms.append(exact_match)
        # Check mapping
        elif symptom_lower in symptom_mapping:
            normalized_symptoms.append(symptom_mapping[symptom_lower])
        # Partial matching for common cases
        else:
            # Try to find partial matches
            partial_matches = [f for f in feature_names if symptom_lower in f.lower() or f.lower() in symptom_lower]
            if partial_matches:
                normalized_symptoms.append(partial_matches[0])  # Take first match
    
    return normalized_symptoms
# Define function to predict disease based on symptoms
def predict_disease(symptoms):
    test_data = {col: 1 if col in symptoms else 0 for col in feature_names}
    test_df = pd.DataFrame(test_data, index=[0])

    predicted = []
    for model_name, model in models.items():
        predict_disease = model.predict(test_df)
        predict_disease = le.inverse_transform(predict_disease)
        predicted.extend(predict_disease)
    
    disease_counts = Counter(predicted)
    percentage_per_disease = {disease: (count / 6) * 100 for disease, count in disease_counts.items()}
    result_df = pd.DataFrame({"Disease": list(percentage_per_disease.keys()),"Chances": list(percentage_per_disease.values())})
    result_df = result_df.merge(doc_data, on='Disease', how='left')
    result_df = result_df.merge(des_data, on='Disease', how='left')
    return result_df

# Define the route for prediction
@app.post("/predict")
def predict(request: SymptomsRequest):
    try:
        logger.info(f"Received prediction request with symptoms: {request.symptoms}")
        
        if not request.symptoms:
            raise HTTPException(status_code=400, detail="No symptoms provided")
        
        # Normalize symptoms to match model feature names
        normalized_symptoms = normalize_symptoms(request.symptoms)
        logger.info(f"Normalized symptoms: {normalized_symptoms}")
        
        # Check if any normalized symptoms match our feature names
        valid_symptoms = [s for s in normalized_symptoms if s in feature_names]
        invalid_original = [orig for orig, norm in zip(request.symptoms, normalized_symptoms) if norm not in feature_names]
        
        if invalid_original:
            logger.warning(f"Could not map these symptoms: {invalid_original}")
        
        if not valid_symptoms:
            # Provide helpful suggestions
            suggestions = feature_names[:10]  # Show first 10 as examples
            raise HTTPException(
                status_code=400, 
                detail=f"None of the provided symptoms could be recognized. Please use symptoms like: {', '.join(suggestions[:5])}..."
            )
        
        logger.info(f"Valid symptoms for prediction: {valid_symptoms}")
        
        result = predict_disease(valid_symptoms)
        logger.info(f"Prediction successful, returning {len(result)} results")
        
        # Sort results by chances (highest first)
        result = result.sort_values('Chances', ascending=False)
        
        return result.to_dict(orient='records')
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
