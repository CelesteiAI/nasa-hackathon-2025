# showresult.py - Model Prediction Demonstration and Validation

## Overview
This module provides a comprehensive demonstration of the trained exoplanet detection model's performance. It loads the saved model, processes test data, and displays detailed prediction results with confidence scores and accuracy metrics.

## Detailed Code Breakdown

### 1. Imports and Dependencies
```python
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
import warnings
warnings.filterwarnings('ignore')
```

**Purpose**: Import essential libraries for:
- **Data Handling**: `pandas`, `numpy` for data manipulation
- **Model Loading**: `joblib` for loading saved models
- **Preprocessing**: `sklearn` components for data preparation
- **Clean Output**: Suppress warnings for cleaner demonstration

### 2. Class Definition and Initialization
```python
class ExoplanetPredictor:
    def __init__(self, model_path, data_path):
        """
        Initialize the predictor for showing actual results
        
        Args:
            model_path (str): Path to the saved model file
            data_path (str): Path to the data file
        """
        self.model_path = model_path
        self.data_path = data_path
        self.model = None
        self.scaler = None
        self.feature_names = None
```

**Purpose**: Initialize the prediction demonstration system
- `model_path`: Location of the trained model file (`.pkl`)
- `data_path`: Location of the NASA Kepler dataset
- Model components will be loaded from the saved file

### 3. Model Loading
```python
def load_model(self):
    """Load the trained model"""
    print("Loading trained model...")
    model_data = joblib.load(self.model_path)
    self.model = model_data['model']
    self.scaler = model_data['scaler']
    self.feature_names = model_data['feature_names']
    print("✓ Model loaded successfully!\n")
```

**Purpose**: Load all components saved during training
- **Model**: The trained machine learning algorithm
- **Scaler**: Preprocessing component for feature normalization
- **Feature Names**: Ensures consistent feature ordering with training

**Why Important**: These components must match exactly what was used during training for accurate predictions.

### 4. Data Loading and Preprocessing
```python
def load_and_preprocess_data(self):
    """Load and preprocess the data"""
    df = pd.read_csv(self.data_path, comment='#')
    
    # Create target variable
    df['target'] = (df['koi_disposition'] == 'CONFIRMED').astype(int)
    
    # Keep KOI identifiers for reference
    koi_names = df['kepoi_name'] if 'kepoi_name' in df.columns else df.index
```

**Purpose**: Prepare the dataset for prediction demonstration

**Key Steps**:
1. **Load NASA Data**: Read Kepler Object of Interest dataset
2. **Target Creation**: Convert dispositions to binary (CONFIRMED vs. not CONFIRMED)
3. **Identifier Preservation**: Keep KOI names for result interpretation
4. **Feature Selection**: Use same features as training pipeline
5. **Missing Value Handling**: Apply same preprocessing as training

**Consistency Requirement**: Preprocessing must exactly match the training pipeline to ensure valid predictions.

### 5. Feature Engineering (Identical to Training)
```python
def feature_engineering(self, X):
    """Apply feature engineering"""
    X_engineered = X.copy()
    
    if 'koi_period' in X_engineered.columns and 'koi_duration' in X_engineered.columns:
        X_engineered['period_duration_ratio'] = X_engineered['koi_period'] / (X_engineered['koi_duration'] + 1e-8)
    
    if 'koi_depth' in X_engineered.columns and 'koi_prad' in X_engineered.columns:
        X_engineered['depth_prad_ratio'] = X_engineered['koi_depth'] / (X_engineered['koi_prad'] + 1e-8)
```

**Purpose**: Apply the same feature engineering transformations used during training

**Generated Features**:
- **Ratio Features**: Physical relationships between measurements
- **Uncertainty Features**: Relative measurement errors
- **Data Cleaning**: Handle infinite values and missing data

**Critical**: These transformations must be identical to training to ensure model compatibility.

### 6. Prediction Demonstration
```python
def show_predictions(self, num_examples=20):
    """
    Show actual predictions for test examples
    
    Args:
        num_examples (int): Number of examples to display
    """
    print("="*80)
    print("EXOPLANET DETECTION MODEL - PREDICTION RESULTS")
    print("="*80)
    
    # Load model and data
    self.load_model()
    X, y, koi_names, original_df = self.load_and_preprocess_data()
    
    # Split data
    X_train, X_test, y_train, y_test, names_train, names_test = train_test_split(
        X, y, koi_names, test_size=0.2, random_state=42, stratify=y
    )
```

**Purpose**: Demonstrate model performance on real test data

**Process Flow**:
1. **Model Loading**: Load trained components
2. **Data Preparation**: Process dataset using training pipeline
3. **Data Splitting**: Create test set (same split as training for consistency)
4. **Feature Scaling**: Apply saved scaler to test data
5. **Feature Alignment**: Ensure features match training exactly
6. **Prediction**: Generate classifications and probabilities

### 7. Feature Alignment (Critical Step)
```python
# Align features with training
missing_features = set(self.feature_names) - set(X_test_scaled.columns)
for feature in missing_features:
    X_test_scaled[feature] = 0

extra_features = set(X_test_scaled.columns) - set(self.feature_names)
if extra_features:
    X_test_scaled = X_test_scaled.drop(columns=list(extra_features))

X_test_scaled = X_test_scaled[self.feature_names]
```

**Purpose**: Ensure test data features exactly match training data features

**Why Necessary**:
- **Missing Features**: Add with default values (0) if not present
- **Extra Features**: Remove features not seen during training
- **Feature Order**: Ensure columns are in the exact same order as training

**Without This**: Model predictions would be unreliable or fail entirely.

### 8. Results Analysis and Formatting
```python
# Create results dataframe
results_df = pd.DataFrame({
    'KOI_Name': names_test.values,
    'Actual_Label': y_test.values,
    'Predicted_Label': predictions,
    'Exoplanet_Probability': probabilities
})

results_df['Actual_Status'] = results_df['Actual_Label'].map({1: 'EXOPLANET', 0: 'NOT EXOPLANET'})
results_df['Predicted_Status'] = results_df['Predicted_Label'].map({1: 'EXOPLANET', 0: 'NOT EXOPLANET'})
results_df['Correct'] = (results_df['Actual_Label'] == results_df['Predicted_Label'])
results_df['Confidence'] = results_df.apply(
    lambda row: row['Exoplanet_Probability'] if row['Predicted_Label'] == 1 
    else 1 - row['Exoplanet_Probability'], 
    axis=1
)
```

**Purpose**: Create comprehensive results analysis

**Generated Metrics**:
- **Actual vs. Predicted**: Clear comparison of ground truth vs. model output
- **Probability Scores**: Model confidence in predictions
- **Correctness**: Binary indicator of prediction accuracy
- **Confidence**: Unified confidence metric (always 0.5-1.0 range)

### 9. Summary Statistics Display
```python
# Display summary statistics
print(f"\nTest Set Size: {len(results_df)}")
print(f"Accuracy: {results_df['Correct'].mean():.2%}")
print(f"Correct Predictions: {results_df['Correct'].sum()} / {len(results_df)}")
print(f"Incorrect Predictions: {(~results_df['Correct']).sum()}")
```

**Purpose**: Provide high-level performance overview
- **Overall Accuracy**: Percentage of correct predictions
- **Count Statistics**: Raw numbers for detailed analysis
- **Error Analysis**: Number of misclassifications

### 10. Detailed Prediction Display
```python
for idx, row in results_df.head(num_examples).iterrows():
    status_emoji = "✓" if row['Correct'] else "✗"
    confidence_bar = "█" * int(row['Confidence'] * 20)
    
    print(f"\n{status_emoji} KOI: {row['KOI_Name']}")
    print(f"   Actual:     {row['Actual_Status']}")
    print(f"   Predicted:  {row['Predicted_Status']}")
    print(f"   Probability: {row['Exoplanet_Probability']:.4f} (Confidence: {row['Confidence']:.2%})")
    print(f"   Confidence: {confidence_bar}")
```

**Purpose**: Show individual prediction details with visual elements

**Features**:
- **Visual Indicators**: ✓/✗ for correct/incorrect predictions
- **Clear Labeling**: Human-readable status descriptions
- **Probability Scores**: Exact numerical confidence
- **Visual Confidence**: ASCII bar chart for quick assessment

### 11. Special Case Analysis
```python
# Show some interesting cases
print("\n" + "="*80)
print("HIGH-CONFIDENCE CORRECT PREDICTIONS")
print("="*80)
high_confidence_correct = results_df[
    (results_df['Correct']) & (results_df['Confidence'] > 0.9)
].head(5)
```

**Purpose**: Highlight model performance in different scenarios

**Categories Analyzed**:
1. **High-Confidence Correct**: Model is very sure and right (best case)
2. **Misclassifications**: Model is wrong (needs attention)
3. **Edge Cases**: Low confidence predictions (uncertain cases)

**Value**: Helps understand model strengths and weaknesses.

### 12. Results Persistence
```python
# Save results to CSV
output_file = 'exoplanet_predictions.csv'
results_df.to_csv(output_file, index=False)
print(f"\n{'='*80}")
print(f"✓ Full results saved to: {output_file}")
print(f"{'='*80}\n")
```

**Purpose**: Save detailed results for further analysis
- **Complete Dataset**: All predictions with metadata
- **External Analysis**: Can be imported into other tools
- **Record Keeping**: Permanent record of model performance

### 13. Main Function for Easy Execution
```python
def showresult(model_path, data_path):
    """Main function to run predictions"""
    # Create predictor
    predictor = ExoplanetPredictor(model_path, data_path)
    
    # Show predictions
    results = predictor.show_predictions(num_examples=20)
    
    print("\n" + "="*80)
    print("PREDICTION SUMMARY")
    print("="*80)
    print(f"Total Predictions: {len(results)}")
    print(f"Accuracy: {results['Correct'].mean():.2%}")
    print(f"True Exoplanets Detected: {((results['Actual_Label'] == 1) & (results['Predicted_Label'] == 1)).sum()}")
    print(f"False Positives: {((results['Actual_Label'] == 0) & (results['Predicted_Label'] == 1)).sum()}")
    print(f"False Negatives: {((results['Actual_Label'] == 1) & (results['Predicted_Label'] == 0)).sum()}")
    print(f"Average Confidence: {results['Confidence'].mean():.2%}")
    print("="*80)
```

**Purpose**: Provide a simple interface for running complete prediction demonstration

**Final Summary Includes**:
- **Total Predictions**: Complete dataset size
- **Overall Accuracy**: Primary performance metric
- **Confusion Matrix Elements**: 
  - True Positives (correctly identified exoplanets)
  - False Positives (incorrectly identified exoplanets)
  - False Negatives (missed exoplanets)
- **Average Confidence**: Model certainty across all predictions

### 14. Standalone Execution
```python
if __name__ == "__main__":
    model_path = '../Models/best_exoplanet_model (3).pkl'
    data_path = '../data/cumulative_exoplanets.csv'
    showresult(model_path, data_path)
```

**Purpose**: Allow independent execution for model validation

## Key Features

1. **Model Validation**: Verifies trained model works correctly on new data
2. **Performance Visualization**: Clear, intuitive display of prediction results
3. **Detailed Analysis**: Individual prediction examination with confidence scores
4. **Error Analysis**: Specific identification of misclassifications
5. **Export Capability**: Save results for external analysis
6. **Production Testing**: Validates deployment readiness
7. **User-Friendly Output**: Visual elements make results easy to interpret

## Use Cases

1. **Model Validation**: Verify training pipeline worked correctly
2. **Performance Assessment**: Understand model strengths and weaknesses
3. **Demo Preparation**: Show stakeholders how the model performs
4. **Error Analysis**: Identify patterns in misclassifications
5. **Confidence Calibration**: Understand when model is uncertain
6. **Production Testing**: Validate model before deployment

## Integration with Main System

This module serves as:
- **Quality Assurance**: Validates the model used by `app.py`
- **Performance Baseline**: Establishes expected accuracy for production
- **Debugging Tool**: Helps identify issues in the prediction pipeline
- **Demo Platform**: Shows real-world model performance to users

## Scientific Value

The detailed prediction analysis helps astronomers:
- **Validate Discoveries**: Confirm model accuracy on known exoplanets
- **Prioritize Candidates**: Focus on high-confidence predictions
- **Understand Limitations**: Know when model might be unreliable
- **Guide Observations**: Allocate telescope time based on model confidence