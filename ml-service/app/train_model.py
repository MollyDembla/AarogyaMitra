import os
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import r2_score, mean_squared_error

# Path configurations
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
DATASET_PATH = os.path.join(PROJECT_ROOT, "synthetic_multimodal_wellbeing_dataset_25000.csv")
MODEL_SAVE_PATH = os.path.join(BASE_DIR, "app", "domain_regressor.joblib")

# Define target columns
TARGET_COLUMNS = [
    "Physical_Health_Score",
    "Sleep_Recovery_Score",
    "Psychological_Wellbeing_Score",
    "Social_Wellbeing_Score",
    "Lifestyle_Balance_Score",
    "Stress_Profile_Score"
]

# Define categorical features
CATEGORICAL_FEATURES = [
    "Gender",
    "Education_Level",
    "Occupation",
    "Work_Pattern",
    "Living_Arrangement",
    "Relationship_Status",
    "Smoking_Status",
    "Alcohol_Frequency",
    "Substance_Use",
    "Chronic_Condition",
    "Current_Medications",
    "Previous_Diagnosis",
    "Allergies",
    "Physical_Limitation"
]

# Define numerical features
NUMERICAL_FEATURES = [
    "Age", "Height_cm", "Weight_kg", "BMI",
    "Relationship_Satisfaction_0_10", "Social_Circle_Size",
    "Social_Interaction_Frequency_0_10", "Social_Support_Score_0_10",
    "Family_Contact_Frequency_0_10", "Loneliness_Score_0_10",
    "Academic_Stress_0_10", "Work_Stress_0_10", "Financial_Stress_0_10",
    "Screen_Time_Hours", "Social_Media_Hours",
    "Physical_Activity_Minutes_Daily", "Exercise_Days_Per_Week", "Sedentary_Hours_Daily",
    "Dietary_Quality_0_10", "Meals_Per_Day", "Water_Intake_Liters", "Caffeine_Cups_Daily",
    "Sleep_Hours", "Sleep_Quality_0_10", "Sleep_Efficiency_Percent",
    "Number_of_Chronic_Conditions",
    "WHO5_Q1", "WHO5_Q2", "WHO5_Q3", "WHO5_Q4", "WHO5_Q5",
    "PSS10_Q1", "PSS10_Q2", "PSS10_Q3", "PSS10_Q4", "PSS10_Q5",
    "PSS10_Q6", "PSS10_Q7", "PSS10_Q8", "PSS10_Q9", "PSS10_Q10",
    "GAD7_Q1", "GAD7_Q2", "GAD7_Q3", "GAD7_Q4", "GAD7_Q5", "GAD7_Q6", "GAD7_Q7",
    "PHQ9_Q1", "PHQ9_Q2", "PHQ9_Q3", "PHQ9_Q4", "PHQ9_Q5", "PHQ9_Q6", "PHQ9_Q7", "PHQ9_Q8", "PHQ9_Q9"
]

def train_domain_prediction_model():
    print(f"Loading dataset from: {DATASET_PATH}")
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")
    
    df = pd.read_csv(DATASET_PATH)
    print(f"Dataset loaded successfully with shape: {df.shape}")

    # Prepare X and y
    feature_cols = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
    X = df[feature_cols].copy()
    y = df[TARGET_COLUMNS].copy()

    # Preprocessing pipelines
    num_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    cat_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='None')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_pipeline, NUMERICAL_FEATURES),
            ('cat', cat_pipeline, CATEGORICAL_FEATURES)
        ]
    )

    # Multi-output Random Forest regressor
    rf_base = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    multi_rf = MultiOutputRegressor(rf_base)

    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', multi_rf)
    ])

    print("Splitting train/test data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)

    print("Training Random Forest Multi-Output Model...")
    pipeline.fit(X_train, y_train)

    print("Evaluating model performance on test set...")
    y_pred = pipeline.predict(X_test)
    y_pred_df = pd.DataFrame(y_pred, columns=TARGET_COLUMNS)

    for i, col in enumerate(TARGET_COLUMNS):
        r2 = r2_score(y_test[col], y_pred_df[col])
        rmse = np.sqrt(mean_squared_error(y_test[col], y_pred_df[col]))
        print(f"Domain: {col:<30} | R² Score: {r2:.4f} | RMSE: {rmse:.4f}")

    print(f"Saving trained model pipeline to: {MODEL_SAVE_PATH}")
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_SAVE_PATH)
    print("Model saved successfully!")

if __name__ == "__main__":
    train_domain_prediction_model()
