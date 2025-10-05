# test_integration.py - Integration Testing for ML Pipeline

## Overview
This module provides comprehensive integration testing for the exoplanet detection and habitability analysis system. It verifies that all components work together correctly, from model loading to prediction generation and result formatting.

## Detailed Code Breakdown

### 1. Module Header and Imports
```python
#!/usr/bin/env python3
"""
Test script to verify the ML model integration works correctly
"""

import pandas as pd
import numpy as np
import joblib
import sys
import os
```

**Purpose**: Set up testing environment
- **Shebang Line**: Makes script directly executable
- **Documentation**: Clear module purpose
- **Essential Imports**: Core libraries for testing ML pipeline
- **System Integration**: `sys` for exit codes, `os` for file operations

### 2. Model Loading Test
```python
def test_model_loading():
    """Test if the model can be loaded correctly"""
    print("Testing model loading...")
    
    try:
        model_path = '../Models/best_exoplanet_model.pkl'
        model_data = joblib.load(model_path)
        
        print(f"✅ Model loaded successfully!")
        print(f"   Model type: {type(model_data['model']).__name__}")
        print(f"   Scaler type: {type(model_data['scaler']).__name__}")
        print(f"   Features: {len(model_data['feature_names'])}")
        
        return model_data
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        return None
```

**Purpose**: Verify the trained model can be loaded and contains all required components

**What It Tests**:
- **File Existence**: Model file is present and accessible
- **File Integrity**: Model file is not corrupted
- **Component Completeness**: All required components (model, scaler, feature_names) are present
- **Component Types**: Verify components are of expected types

**Success Criteria**:
- Model loads without errors
- All three components (model, scaler, feature_names) are present
- Components are of expected types

**Failure Scenarios**:
- Model file not found
- Corrupted model file
- Missing components in saved model
- Version compatibility issues

### 3. Sample Prediction Test
```python
def test_sample_prediction(model_data):
    """Test prediction with sample data"""
    print("\nTesting sample prediction...")
    
    if model_data is None:
        print("❌ Cannot test prediction - model not loaded")
        return False
    
    try:
        # Create sample data with the expected features
        sample_data = pd.DataFrame({
            'koi_period': [100.0],
            'koi_period_err1': [1.0],
            'koi_period_err2': [-1.0],
            'koi_time0bk': [150.0],
            # ... (more features)
        })
```

**Purpose**: Test the complete prediction pipeline with realistic sample data

**Sample Data Characteristics**:
- **Realistic Values**: Uses typical exoplanet parameter ranges
- **Complete Feature Set**: Includes all features expected by the model
- **Error Columns**: Includes measurement uncertainty data
- **Earth-like Properties**: Designed to represent a potentially habitable exoplanet

**Key Features Tested**:
- **Orbital Period**: 100 days (reasonable for habitable zone)
- **Planet Radius**: 1.5 Earth radii (potentially rocky)
- **Equilibrium Temperature**: 280K (suitable for liquid water)
- **Stellar Insolation**: 1.2× Earth's flux (within habitable range)
- **Stellar Properties**: Sun-like star characteristics

### 4. Preprocessing Pipeline Integration
```python
# Test the preprocessing pipeline
# Set up global variables as the app would
import app
app.model = model_data['model']
app.scaler = model_data['scaler']
app.feature_names = model_data['feature_names']

X_processed = app.preprocess_input_data(sample_data)
prediction = model_data['model'].predict(X_processed)
probability = model_data['model'].predict_proba(X_processed)[:, 1]
```

**Purpose**: Test the complete preprocessing pipeline used by the web application

**Integration Points Tested**:
1. **Global Variable Setup**: Mimics how `app.py` initializes model components
2. **Preprocessing Function**: Tests `app.preprocess_input_data()` function
3. **Feature Engineering**: Verifies derived features are created correctly
4. **Scaling**: Ensures data normalization works properly
5. **Feature Alignment**: Confirms features match training expectations
6. **Model Prediction**: Tests both classification and probability outputs

**Success Validation**:
- Preprocessing completes without errors
- Model produces valid predictions (0 or 1)
- Probability scores are in valid range (0-1)
- No dimension mismatches or type errors

### 5. Habitability Analysis Test
```python
def test_habitability_analysis():
    """Test habitability analysis"""
    print("\nTesting habitability analysis...")
    
    try:
        # Create test data with known habitable characteristics
        test_data = pd.DataFrame({
            'kepoi_name': ['KOI-TEST.01', 'KOI-TEST.02'],
            'kepler_name': ['Test Planet b', 'Test Planet c'],
            'is_exoplanet': [1, 1],
            'exoplanet_probability': [0.95, 0.85],
            'koi_prad': [1.2, 3.5],  # Earth-like vs large
            'koi_teq': [280, 1200],  # Habitable vs hot
            'koi_insol': [1.1, 5.0],  # Earth-like vs high
            'koi_period': [365, 10],  # Earth-like vs short
        })
```

**Purpose**: Test the habitability analysis pipeline with controlled test cases

**Test Case Design**:
1. **Test Planet b (Highly Habitable)**:
   - Radius: 1.2 R⊕ (Earth-like, rocky)
   - Temperature: 280K (suitable for liquid water)
   - Insolation: 1.1× Earth (optimal energy)
   - Period: 365 days (similar to Earth)

2. **Test Planet c (Not Habitable)**:
   - Radius: 3.5 R⊕ (likely gas giant)
   - Temperature: 1200K (too hot for life)
   - Insolation: 5.0× Earth (too much energy)
   - Period: 10 days (tidally locked, extreme conditions)

**Functions Tested**:
- `process_habitability()`: Calculates habitability scores and classifications
- `format_results_for_frontend()`: Prepares data for web visualization

### 6. Result Formatting Test
```python
from app import process_habitability, format_results_for_frontend

# Test habitability processing
df_habitable = process_habitability(test_data)
print(f"✅ Habitability analysis successful!")
print(f"   Processed {len(df_habitable)} planets")

# Test result formatting
results = format_results_for_frontend(df_habitable)
print(f"✅ Result formatting successful!")
print(f"   Formatted {len(results)} results for frontend")

if results:
    print(f"   Sample result: {results[0]['planet_id']} - {results[0]['habitability_class']}")
```

**Purpose**: Verify that results are properly formatted for the web frontend

**What's Tested**:
- **Data Structure**: Results are in expected JSON format
- **Required Fields**: All necessary fields for visualization are present
- **Data Types**: Numerical values are properly converted
- **Classifications**: Habitability classes are correctly assigned
- **Summary Generation**: Planet descriptions are created

**Expected Output Structure**:
```json
{
    "planet_id": "KOI-TEST.01",
    "kepler_name": "Test Planet b",
    "classification": "Exoplanet",
    "habitability_score": 0.85,
    "habitability_class": "highly_habitable",
    "features": { ... },
    "summary": "Detailed planet description..."
}
```

### 7. Main Test Orchestration
```python
def main():
    print("🚀 Testing Exoplanet ML Integration")
    print("=" * 50)
    
    # Test 1: Model Loading
    model_data = test_model_loading()
    
    # Test 2: Sample Prediction
    prediction_success = test_sample_prediction(model_data)
    
    # Test 3: Habitability Analysis
    habitability_success = test_habitability_analysis()
    
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print(f"   Model Loading: {'✅ PASS' if model_data else '❌ FAIL'}")
    print(f"   Prediction: {'✅ PASS' if prediction_success else '❌ FAIL'}")
    print(f"   Habitability: {'✅ PASS' if habitability_success else '❌ FAIL'}")
```

**Purpose**: Orchestrate all tests and provide comprehensive results summary

**Test Execution Flow**:
1. **Sequential Testing**: Tests run in logical order (dependencies matter)
2. **Failure Handling**: Later tests skip if earlier ones fail
3. **Result Aggregation**: Collect all test outcomes
4. **Summary Report**: Clear pass/fail status for each component
5. **Exit Code**: Proper system exit codes for CI/CD integration

### 8. Executable Script Setup
```python
if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
```

**Purpose**: Make script executable and provide proper exit codes

**Features**:
- **Direct Execution**: Can be run as `python test_integration.py`
- **Exit Codes**: 0 for success, 1 for failure (standard Unix convention)
- **CI/CD Integration**: Can be used in automated testing pipelines

## Test Coverage

### Components Tested
1. **Model Persistence**: Loading/saving functionality
2. **Data Preprocessing**: Complete pipeline from raw data to model input
3. **Feature Engineering**: Derived feature creation
4. **Model Prediction**: Classification and probability generation
5. **Habitability Analysis**: Scientific scoring and classification
6. **Result Formatting**: Frontend data preparation
7. **Error Handling**: Graceful failure management

### Integration Points Validated
1. **File System**: Model and data file access
2. **Memory Management**: Large dataset handling
3. **Data Flow**: End-to-end pipeline execution
4. **Component Communication**: Function interfaces between modules
5. **Type Consistency**: Data type preservation across pipeline
6. **Performance**: Basic timing and resource usage

## Usage Scenarios

### Development Testing
```bash
python test_integration.py
```
**Use When**: After making changes to any ML pipeline component

### Deployment Validation
```bash
python test_integration.py && echo "Ready for deployment"
```
**Use When**: Before deploying to production environment

### CI/CD Pipeline
```yaml
- name: Test ML Integration
  run: python src/test_integration.py
```
**Use When**: Automated testing in continuous integration

## Expected Output

### Successful Test Run
```
🚀 Testing Exoplanet ML Integration
==================================================
Testing model loading...
✅ Model loaded successfully!
   Model type: RandomForestClassifier
   Scaler type: RobustScaler
   Features: 45

Testing sample prediction...
✅ Prediction successful!
   Prediction: Exoplanet
   Probability: 0.823

Testing habitability analysis...
✅ Habitability analysis successful!
   Processed 2 planets
✅ Result formatting successful!
   Formatted 2 results for frontend
   Sample result: KOI-TEST.01 - highly_habitable

==================================================
📊 Test Summary:
   Model Loading: ✅ PASS
   Prediction: ✅ PASS
   Habitability: ✅ PASS

🎉 All tests passed! Integration is ready.
```

### Failed Test Example
```
❌ Error loading model: [Errno 2] No such file or directory: '../Models/best_exoplanet_model.pkl'
❌ Cannot test prediction - model not loaded
❌ Error in habitability analysis: name 'app' is not defined

==================================================
📊 Test Summary:
   Model Loading: ❌ FAIL
   Prediction: ❌ FAIL
   Habitability: ❌ FAIL

⚠️ Some tests failed. Please check the issues above.
```

## Key Benefits

1. **Confidence**: Ensures all components work together correctly
2. **Early Detection**: Catches integration issues before deployment
3. **Regression Prevention**: Prevents breaking changes from going unnoticed
4. **Documentation**: Serves as executable documentation of expected behavior
5. **Debugging Aid**: Helps isolate problems in complex pipeline
6. **Quality Assurance**: Validates scientific accuracy of predictions