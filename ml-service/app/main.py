import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import numpy as np

# Try importing pandas and joblib
try:
    import pandas as pd
    import joblib
    HAS_ML_LIBS = True
except ImportError:
    HAS_ML_LIBS = False

app = FastAPI(
    title="AarogyaMitra ML Domain Scoring Service",
    description="Dataset-aligned ML Inference Service for AarogyaMitra 6 Well-Being Domains",
    version="2.0.0"
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "domain_regressor.joblib")
pipeline_model = None

@app.on_event("startup")
def load_model():
    global pipeline_model
    if HAS_ML_LIBS and os.path.exists(MODEL_PATH):
        try:
            pipeline_model = joblib.load(MODEL_PATH)
            print(f"[ML Service] Model pipeline loaded successfully from {MODEL_PATH}")
        except Exception as e:
            print(f"[ML Service] Error loading model pipeline: {e}")
    else:
        print("[ML Service] Trained model file not found or ML libraries not installed. Using empirical heuristic fallback.")

class AssessmentInputSchema(BaseModel):
    # Personal Info
    Age: Optional[float] = 25.0
    Gender: Optional[str] = "Female"
    Height_cm: Optional[float] = 165.0
    Weight_kg: Optional[float] = 65.0
    BMI: Optional[float] = 23.88
    Education_Level: Optional[str] = "Undergraduate"
    Occupation: Optional[str] = "Student"
    Work_Pattern: Optional[str] = "Day"
    Living_Arrangement: Optional[str] = "With Parents"
    Relationship_Status: Optional[str] = "Single"

    # Social & Relationship
    Relationship_Satisfaction_0_10: Optional[float] = 5.0
    Social_Circle_Size: Optional[float] = 5.0
    Social_Interaction_Frequency_0_10: Optional[float] = 5.0
    Social_Support_Score_0_10: Optional[float] = 5.0
    Family_Contact_Frequency_0_10: Optional[float] = 5.0
    Loneliness_Score_0_10: Optional[float] = 5.0

    # Stress Profile
    Academic_Stress_0_10: Optional[float] = 3.0
    Work_Stress_0_10: Optional[float] = 3.0
    Financial_Stress_0_10: Optional[float] = 3.0

    # Digital & Activity
    Screen_Time_Hours: Optional[float] = 6.0
    Social_Media_Hours: Optional[float] = 2.0
    Physical_Activity_Minutes_Daily: Optional[float] = 45.0
    Exercise_Days_Per_Week: Optional[float] = 3.0
    Sedentary_Hours_Daily: Optional[float] = 6.0

    # Diet & Habits
    Dietary_Quality_0_10: Optional[float] = 6.0
    Meals_Per_Day: Optional[float] = 3.0
    Water_Intake_Liters: Optional[float] = 2.0
    Caffeine_Cups_Daily: Optional[float] = 2.0
    Smoking_Status: Optional[str] = "Never"
    Alcohol_Frequency: Optional[str] = "Never"
    Substance_Use: Optional[str] = "No"

    # Sleep / Recovery
    Sleep_Hours: Optional[float] = 7.0
    Sleep_Quality_0_10: Optional[float] = 7.0
    Sleep_Efficiency_Percent: Optional[float] = 75.0

    # Medical Context
    Chronic_Condition: Optional[str] = "None"
    Number_of_Chronic_Conditions: Optional[float] = 0.0
    Current_Medications: Optional[str] = "None"
    Previous_Diagnosis: Optional[str] = "None"
    Allergies: Optional[str] = "None"
    Physical_Limitation: Optional[str] = "None"

    # Psychometric Items
    WHO5_Q1: Optional[float] = 4.0
    WHO5_Q2: Optional[float] = 4.0
    WHO5_Q3: Optional[float] = 4.0
    WHO5_Q4: Optional[float] = 4.0
    WHO5_Q5: Optional[float] = 4.0

    PSS10_Q1: Optional[float] = 1.0
    PSS10_Q2: Optional[float] = 1.0
    PSS10_Q3: Optional[float] = 1.0
    PSS10_Q4: Optional[float] = 3.0
    PSS10_Q5: Optional[float] = 3.0
    PSS10_Q6: Optional[float] = 1.0
    PSS10_Q7: Optional[float] = 3.0
    PSS10_Q8: Optional[float] = 3.0
    PSS10_Q9: Optional[float] = 1.0
    PSS10_Q10: Optional[float] = 1.0

    GAD7_Q1: Optional[float] = 0.0
    GAD7_Q2: Optional[float] = 0.0
    GAD7_Q3: Optional[float] = 0.0
    GAD7_Q4: Optional[float] = 0.0
    GAD7_Q5: Optional[float] = 0.0
    GAD7_Q6: Optional[float] = 0.0
    GAD7_Q7: Optional[float] = 0.0

    PHQ9_Q1: Optional[float] = 0.0
    PHQ9_Q2: Optional[float] = 0.0
    PHQ9_Q3: Optional[float] = 0.0
    PHQ9_Q4: Optional[float] = 0.0
    PHQ9_Q5: Optional[float] = 0.0
    PHQ9_Q6: Optional[float] = 0.0
    PHQ9_Q7: Optional[float] = 0.0
    PHQ9_Q8: Optional[float] = 0.0
    PHQ9_Q9: Optional[float] = 0.0

class DomainScoresResponse(BaseModel):
    Physical_Health_Score: float
    Sleep_Recovery_Score: float
    Psychological_Wellbeing_Score: float
    Social_Wellbeing_Score: float
    Lifestyle_Balance_Score: float
    Stress_Profile_Score: float
    model_type: str

@app.get("/")
def read_root():
    return {
        "service": "AarogyaMitra Python ML Service",
        "status": "Online",
        "model_loaded": pipeline_model is not None,
        "version": "2.0.0"
    }

@app.post("/predict-domains", response_model=DomainScoresResponse)
def predict_domains(data: AssessmentInputSchema):
    input_dict = data.dict()
    
    if pipeline_model is not None and HAS_ML_LIBS:
        try:
            df_input = pd.DataFrame([input_dict])
            preds = pipeline_model.predict(df_input)[0]
            return DomainScoresResponse(
                Physical_Health_Score=round(float(np.clip(preds[0], 0, 100)), 2),
                Sleep_Recovery_Score=round(float(np.clip(preds[1], 0, 100)), 2),
                Psychological_Wellbeing_Score=round(float(np.clip(preds[2], 0, 100)), 2),
                Social_Wellbeing_Score=round(float(np.clip(preds[3], 0, 100)), 2),
                Lifestyle_Balance_Score=round(float(np.clip(preds[4], 0, 100)), 2),
                Stress_Profile_Score=round(float(np.clip(preds[5], 0, 100)), 2),
                model_type="RandomForestRegressor"
            )
        except Exception as e:
            print(f"[ML Service] Prediction failed with model, falling back to heuristics: {e}")

    # Empirical heuristic fallback calculation
    # 1. Physical Health
    act_score = min(100, (input_dict['Physical_Activity_Minutes_Daily'] / 60.0) * 50 + (input_dict['Exercise_Days_Per_Week'] / 7.0) * 50)
    sedentary_penalty = min(30, (input_dict['Sedentary_Hours_Daily'] / 14.0) * 30)
    physical_score = max(10, min(100, act_score - sedentary_penalty + 20))

    # 2. Sleep Recovery
    sleep_hr_score = min(100, (input_dict['Sleep_Hours'] / 8.0) * 50)
    sleep_qual_score = input_dict['Sleep_Quality_0_10'] * 5.0
    sleep_score = max(10, min(100, sleep_hr_score + sleep_qual_score))

    # 3. Psychological Well-being
    who5_raw = sum([input_dict[f'WHO5_Q{i}'] for i in range(1, 6)])
    who5_pct = (who5_raw / 25.0) * 100.0
    phq9_tot = sum([input_dict[f'PHQ9_Q{i}'] for i in range(1, 10)])
    gad7_tot = sum([input_dict[f'GAD7_Q{i}'] for i in range(1, 8)])
    psych_score = max(10, min(100, who5_pct - (phq9_tot * 2.0) - (gad7_tot * 1.5)))

    # 4. Social Well-being
    soc_support = input_dict['Social_Support_Score_0_10'] * 6.0
    soc_interact = input_dict['Social_Interaction_Frequency_0_10'] * 4.0
    loneliness_penalty = input_dict['Loneliness_Score_0_10'] * 5.0
    social_score = max(10, min(100, soc_support + soc_interact - loneliness_penalty + 20))

    # 5. Lifestyle Balance
    diet_score = input_dict['Dietary_Quality_0_10'] * 7.0
    water_score = min(30, (input_dict['Water_Intake_Liters'] / 3.0) * 30)
    screen_penalty = min(25, (input_dict['Screen_Time_Hours'] / 12.0) * 25)
    lifestyle_score = max(10, min(100, diet_score + water_score - screen_penalty + 10))

    # 6. Stress Profile / Management
    pss_rev = [4, 5, 7, 8]
    pss_tot = 0
    for i in range(1, 11):
        v = input_dict[f'PSS10_Q{i}']
        pss_tot += (4 - v) if i in pss_rev else v
    stress_score = max(10, min(100, 100 - (pss_tot * 2.2)))

    return DomainScoresResponse(
        Physical_Health_Score=round(physical_score, 2),
        Sleep_Recovery_Score=round(sleep_score, 2),
        Psychological_Wellbeing_Score=round(psych_score, 2),
        Social_Wellbeing_Score=round(social_score, 2),
        Lifestyle_Balance_Score=round(lifestyle_score, 2),
        Stress_Profile_Score=round(stress_score, 2),
        model_type="HeuristicFallback"
    )
