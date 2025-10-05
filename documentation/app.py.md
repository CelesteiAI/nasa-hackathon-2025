# app.py - Flask Web Application for Exoplanet Classification

## Overview
This is the main Flask web application that serves as the backend for an exoplanet classification and habitability analysis system. It provides a REST API for file uploads, machine learning predictions, and result visualization.

## Detailed Code Breakdown

### 1. Imports and Dependencies
```python
#!/usr/bin/env python3
import os
import joblib
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from habitability_classifier import ExoplanetHabitabilityClassifier
import json
```

**Purpose**: Import all necessary libraries for the web application:
- `os`: File system operations
- `joblib`: Loading pre-trained ML models
- `pandas/numpy`: Data manipulation and numerical operations
- `flask`: Web framework for creating the API
- `werkzeug.utils.secure_filename`: Secure file name handling
- `sklearn`: Machine learning preprocessing tools
- `habitability_classifier`: Custom module for exoplanet analysis

### 2. Flask Application Setup
```python
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs("results", exist_ok=True)
```

**Purpose**: 
- Initialize Flask application
- Configure upload directory for CSV files
- Create necessary directories for file storage and results

### 3. Global Variables
```python
# Global variables for model components
model = None
scaler = None
feature_names = None
habitability_analyzer = None

ALLOWED_EXTENSIONS = {'csv'}
```

**Purpose**: Store ML model components globally so they persist across requests:
- `model`: The trained exoplanet classification model
- `scaler`: Data preprocessing scaler
- `feature_names`: List of features the model expects
- `habitability_analyzer`: Custom habitability analysis component
- `ALLOWED_EXTENSIONS`: Restrict uploads to CSV files only

### 4. Utility Functions

#### File Validation
```python
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
```
**Purpose**: Check if uploaded file has a valid CSV extension

### 5. Web Routes

#### Home Page Route
```python
@app.route('/')
def home():
    return render_template('index.html')
```
**Purpose**: Serve the main upload page where users can submit CSV files

#### Results Page Route
```python
@app.route('/results')
def results():
    return render_template('results.html')
```
**Purpose**: Serve the results visualization page after analysis is complete

#### File Upload API Endpoint
```python
@app.route('/api/upload', methods=['POST'])
def upload():
```
**Purpose**: Main API endpoint that handles file uploads and triggers ML analysis

**Process Flow**:
1. **File Validation**: Checks if file exists, has correct extension
2. **File Saving**: Securely saves uploaded CSV to uploads directory
3. **Data Loading**: Reads CSV with pandas, handles comment lines
4. **ML Pipeline**: 
   - Calls `predict_exoplanets()` to classify potential exoplanets
   - Calls `process_habitability()` to analyze habitability
   - Calls `format_results_for_frontend()` to prepare data for visualization
5. **Response**: Returns JSON with analysis summary and redirect information

#### Results API Endpoint
```python
@app.route('/api/get_results', methods=['GET'])
def get_results():
```
**Purpose**: API endpoint to retrieve processed results for the frontend visualization

**Features**:
- Returns latest analysis results stored in app config
- Separates highly habitable planets for special UI effects
- Provides detailed JSON response with counts and planet data

### 6. Machine Learning Functions

#### Model Loading
```python
def load_ml_model():
    global model, scaler, feature_names, habitability_analyzer
```
**Purpose**: Load the pre-trained ML model and preprocessing components

**Process**:
- Tries multiple possible model file paths
- Loads model, scaler, and feature names using joblib
- Sets global variables for use across the application
- Handles errors gracefully if model can't be loaded

#### Data Preprocessing
```python
def preprocess_input_data(df):
    global feature_names, scaler
```
**Purpose**: Transform uploaded CSV data to match the format expected by the trained model

**Complex Process**:
1. **Feature Alignment**: Ensures input data has same features as training data
2. **Missing Data Handling**: 
   - Adds missing expected features with default values
   - Uses median imputation for missing values
3. **Feature Engineering**: 
   - Creates derived features like `period_duration_ratio`
   - Calculates uncertainty features from error columns
4. **Data Cleaning**: Removes infinite values, handles NaN
5. **Scaling**: Applies the same StandardScaler used during training

#### Exoplanet Prediction
```python
def predict_exoplanets(df):
    global model
```
**Purpose**: Use the trained model to classify which objects are likely exoplanets

**Process**:
- Preprocesses input data
- Makes binary predictions (exoplanet/not exoplanet)
- Calculates probability scores
- Returns dataframe with predictions added

#### Habitability Analysis
```python
def process_habitability(df_with_predictions):
```
**Purpose**: Analyze detected exoplanets for potential habitability

**Criteria Used**:
- **Earth-like radius**: 0.5-2.0 Earth radii (weight: 30%)
- **Habitable temperature**: 200-350K (weight: 40%)
- **Appropriate insolation**: 0.3-1.7× Earth's flux (weight: 20%)
- **Reasonable orbital period**: 10-500 days (weight: 10%)

**Classification**:
- `highly_habitable`: Score ≥ 0.7
- `potentially_habitable`: Score ≥ 0.5
- `marginally_habitable`: Score ≥ 0.3
- `not_habitable`: Score < 0.3

#### Results Formatting
```python
def format_results_for_frontend(df_habitable):
```
**Purpose**: Prepare analysis results for the Three.js frontend visualization

**Features**:
- Selects top 20 exoplanet candidates by probability
- Identifies top 8 most habitable for special highlighting
- Generates unique, detailed summaries for each planet
- Creates structured JSON with all planetary characteristics
- Provides different summary templates based on planet properties

### 7. Application Startup
```python
if __name__ == '__main__':
    print("Starting Exoplanet Classification Server...")
    
    if not load_ml_model():
        print("Warning: Could not load ML model. The application may not work correctly.")
    
    print("Server starting on http://0.0.0.0:8080")
    app.run(host='0.0.0.0', port=8080, debug=True)
```

**Purpose**: Application entry point that:
- Loads the ML model on startup
- Starts the Flask development server
- Binds to all network interfaces (0.0.0.0) on port 8080
- Enables debug mode for development

## Key Features

1. **Robust Error Handling**: Comprehensive try-catch blocks throughout
2. **Data Validation**: Multiple layers of input validation
3. **ML Pipeline Integration**: Seamless integration of complex ML workflows
4. **Frontend-Ready Output**: Structured data optimized for Three.js visualization
5. **Flexible Model Loading**: Handles different deployment scenarios
6. **Comprehensive Logging**: Detailed console output for debugging
7. **RESTful API Design**: Clean separation of concerns with proper HTTP methods

## Security Considerations

- Uses `secure_filename()` to prevent directory traversal attacks
- Validates file extensions to prevent malicious uploads
- Implements file size limits (commented out but available)
- Cleans up invalid files automatically

## Dependencies

This application requires the trained ML model file at `Models/best_exoplanet_model.pkl` and depends on the custom `habitability_classifier` module for extended analysis capabilities.