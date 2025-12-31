from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import os
import sys

app = Flask(__name__)
CORS(app)

# Load models and data
try:
    # Load trained models
    with open('Random Forest.pkl', 'rb') as f:
        rf_model = pickle.load(f)
    
    with open('Decision Tree.pkl', 'rb') as f:
        dt_model = pickle.load(f)
    
    with open('label_encoder.pkl', 'rb') as f:
        label_encoder = pickle.load(f)
    
    with open('feature_names.pkl', 'rb') as f:
        feature_names = pickle.load(f)
    
    # Load disease descriptions
    disease_desc = pd.read_csv('Disease_Description.csv')
    disease_dict = dict(zip(disease_desc['Disease'], disease_desc['Description']))
    
    print("Models loaded successfully!")
    
except Exception as e:
    print(f"Error loading models: {e}")
    sys.exit(1)

def create_feature_vector(symptoms, feature_names):
    """Convert symptoms list to feature vector"""
    feature_vector = np.zeros(len(feature_names))
    
    for symptom in symptoms:
        if symptom in feature_names:
            idx = feature_names.index(symptom)
            feature_vector[idx] = 1
    
    return feature_vector.reshape(1, -1)

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Arogami ML API is running",
        "available_endpoints": ["/predict", "/diseases", "/symptoms"]
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        symptoms = data.get('symptoms', [])
        
        if not symptoms:
            return jsonify({"error": "No symptoms provided"}), 400
        
        # Create feature vector
        feature_vector = create_feature_vector(symptoms, feature_names)
        
        # Get predictions from multiple models
        rf_prediction = rf_model.predict(feature_vector)[0]
        rf_proba = rf_model.predict_proba(feature_vector)[0]
        
        dt_prediction = dt_model.predict(feature_vector)[0]
        dt_proba = dt_model.predict_proba(feature_vector)[0]
        
        # Get disease names
        rf_disease = label_encoder.inverse_transform([rf_prediction])[0]
        dt_disease = label_encoder.inverse_transform([dt_prediction])[0]
        
        # Get confidence scores
        rf_confidence = max(rf_proba)
        dt_confidence = max(dt_proba)
        
        # Get disease descriptions
        rf_description = disease_dict.get(rf_disease, "No description available")
        dt_description = disease_dict.get(dt_disease, "No description available")
        
        response = {
            "predictions": {
                "random_forest": {
                    "disease": rf_disease,
                    "confidence": float(rf_confidence),
                    "description": rf_description
                },
                "decision_tree": {
                    "disease": dt_disease,
                    "confidence": float(dt_confidence),
                    "description": dt_description
                }
            },
            "input_symptoms": symptoms,
            "recommendations": generate_recommendations(rf_disease, rf_confidence)
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/diseases', methods=['GET'])
def get_diseases():
    """Get list of all diseases the model can predict"""
    try:
        diseases = label_encoder.classes_.tolist()
        return jsonify({"diseases": diseases, "total": len(diseases)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    """Get list of all symptoms the model recognizes"""
    try:
        return jsonify({"symptoms": feature_names, "total": len(feature_names)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_recommendations(disease, confidence):
    """Generate basic recommendations based on disease and confidence"""
    recommendations = []
    
    if confidence < 0.5:
        recommendations.append("Low confidence prediction. Please consult a healthcare professional.")
    elif confidence < 0.7:
        recommendations.append("Moderate confidence. Consider consulting a doctor for proper diagnosis.")
    else:
        recommendations.append("High confidence prediction. Please consult a healthcare professional for treatment.")
    
    # Add general recommendations
    recommendations.extend([
        "Monitor your symptoms closely",
        "Stay hydrated and get adequate rest",
        "Seek immediate medical attention if symptoms worsen"
    ])
    
    return recommendations

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    app.run(host='0.0.0.0', port=port, debug=False)
