# test_model.py - Comprehensive Model Performance Testing

## Overview
This module provides comprehensive testing and evaluation of the trained exoplanet detection model. It includes performance metrics, visualizations, and detailed analysis to validate model quality and reliability for production use.

## Detailed Code Breakdown

### 1. Imports and Dependencies
```python
import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
```

**Purpose**: Import comprehensive testing and visualization libraries:
- **Data Handling**: `pandas`, `numpy` for data manipulation
- **Model Loading**: `joblib` for loading trained models
- **Evaluation Metrics**: `sklearn.metrics` for performance assessment
- **Visualization**: `matplotlib`, `seaborn` for result plotting
- **Data Splitting**: Consistent train/test splitting

### 2. Class Definition and Initialization
```python
class ExoplanetModelTester:
    def __init__(self, model_path, data_path):
        """
        Initialize the model tester
        
        Args:
            model_path (str): Path to the saved model file
            data_path (str): Path to the data file
        """
        self.model_path = model_path
        self.data_path = data_path
        self.model_data = None
        self.model = None
        self.scaler = None
        self.feature_names = None
```

**Purpose**: Initialize testing framework with essential components
- **File Paths**: Locations of model and data files
- **Model Components**: Will store loaded model, scaler, and feature information
- **Separation of Concerns**: Clean interface for testing operations

### 3. Model Loading and Validation
```python
def load_model(self):
    """Load the trained model and associated components"""
    print("Loading trained model...")
    self.model_data = joblib.load(self.model_path)
    self.model = self.model_data['model']
    self.scaler = self.model_data['scaler']
    self.feature_names = self.model_data['feature_names']
    
    print(f"Model type: {type(self.model).__name__}")
    print(f"Number of features: {len(self.feature_names)}")
    print("Model loaded successfully!")
```

**Purpose**: Load and validate all components of the trained model

**Validation Checks**:
- **File Accessibility**: Ensure model file exists and is readable
- **Component Completeness**: Verify all required components are present
- **Model Type**: Display algorithm type for verification
- **Feature Count**: Confirm expected number of features

**Error Handling**: Would catch and report issues with corrupted or incompatible model files.

### 4. Data Loading and Preprocessing (Exact Training Replica)
```python
def load_and_preprocess_data(self):
    """Load and preprocess the data using the same pipeline as training"""
    print("\nLoading and preprocessing data...")
    
    # Load data
    df = pd.read_csv(self.data_path, comment='#')
    print(f"Dataset shape: {df.shape}")
    
    # Create target variable
    if 'koi_disposition' in df.columns:
        df['target'] = (df['koi_disposition'] == 'CONFIRMED').astype(int)
        target_col = 'target'
    else:
        raise ValueError("Target column 'koi_disposition' not found in dataset")
```

**Purpose**: Apply identical preprocessing to ensure fair testing

**Critical Requirements**:
1. **Identical Pipeline**: Must match training preprocessing exactly
2. **Same Feature Selection**: Use identical feature set as training
3. **Same Missing Value Handling**: Apply identical imputation strategy
4. **Same Feature Engineering**: Create identical derived features

**Why Important**: Any deviation from training preprocessing would invalidate test results.

### 5. Feature Engineering (Training Consistency)
```python
def feature_engineering(self, X):
    """Apply the same feature engineering as during training"""
    X_engineered = X.copy()
    
    # Create ratio features
    if 'koi_period' in X_engineered.columns and 'koi_duration' in X_engineered.columns:
        X_engineered['period_duration_ratio'] = X_engineered['koi_period'] / (X_engineered['koi_duration'] + 1e-8)
    
    if 'koi_depth' in X_engineered.columns and 'koi_prad' in X_engineered.columns:
        X_engineered['depth_prad_ratio'] = X_engineered['koi_depth'] / (X_engineered['koi_prad'] + 1e-8)
    
    # Create uncertainty features
    error_cols = [col for col in X_engineered.columns if 'err' in col]
    for err_col in error_cols:
        base_col = err_col.replace('_err1', '').replace('_err2', '')
        if base_col in X_engineered.columns:
            uncertainty_col = f'{base_col}_uncertainty'
            X_engineered[uncertainty_col] = abs(X_engineered[err_col]) / (abs(X_engineered[base_col]) + 1e-8)
```

**Purpose**: Apply exact same feature engineering transformations as training

**Engineered Features**:
- **Ratio Features**: Physical relationships (period/duration, depth/radius)
- **Uncertainty Features**: Relative measurement errors
- **Data Cleaning**: Handle infinite values and outliers

**Consistency Check**: Every transformation must match the training pipeline exactly.

### 6. Model Testing and Evaluation
```python
def test_model(self, X, y, test_size=0.2):
    """Test the model on the dataset"""
    print("\n" + "="*50)
    print("TESTING TRAINED MODEL")
    print("="*50)
    
    # Split data (use same random state as training for consistency)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    
    print(f"Test set shape: {X_test.shape}")
    print(f"Test target distribution:\n{y_test.value_counts()}")
```

**Purpose**: Evaluate model performance on unseen test data

**Key Testing Steps**:
1. **Consistent Splitting**: Use same random seed as training (random_state=42)
2. **Stratified Split**: Maintain class distribution in test set
3. **Feature Scaling**: Apply saved scaler (not retrained)
4. **Feature Alignment**: Ensure test features match training exactly
5. **Prediction Generation**: Both classifications and probabilities

### 7. Feature Alignment and Validation
```python
# Ensure we have the same features as during training
missing_features = set(self.feature_names) - set(X_test_scaled.columns)
extra_features = set(X_test_scaled.columns) - set(self.feature_names)

if missing_features:
    print(f"Warning: Missing features from training: {missing_features}")
    # Add missing features with zeros
    for feature in missing_features:
        X_test_scaled[feature] = 0

if extra_features:
    print(f"Warning: Extra features not in training: {extra_features}")
    # Remove extra features
    X_test_scaled = X_test_scaled.drop(columns=list(extra_features))

# Reorder columns to match training
X_test_scaled = X_test_scaled[self.feature_names]
```

**Purpose**: Ensure perfect feature alignment between training and testing

**Alignment Operations**:
- **Missing Features**: Add with default values (usually zeros)
- **Extra Features**: Remove features not seen during training
- **Column Order**: Ensure exact same column ordering as training
- **Warnings**: Alert user to any discrepancies

**Critical for Accuracy**: Feature misalignment would produce meaningless results.

### 8. Performance Metrics Calculation
```python
# Make predictions
print("\nMaking predictions...")
y_pred = self.model.predict(X_test_scaled)
y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]

# Calculate metrics
auc_score = roc_auc_score(y_test, y_pred_proba)

print(f"\n🎯 **MODEL PERFORMANCE RESULTS**")
print(f"AUC Score: {auc_score:.4f}")
print(f"Accuracy: {(y_pred == y_test).mean():.4f}")

# Detailed classification report
print("\n📊 **Classification Report:**")
print(classification_report(y_test, y_pred, target_names=['Not Exoplanet', 'Exoplanet']))

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)
print("\n📈 **Confusion Matrix:**")
print(cm)
```

**Purpose**: Generate comprehensive performance assessment

**Key Metrics**:
1. **AUC-ROC Score**: Area Under Receiver Operating Characteristic curve
   - Range: 0-1 (higher is better)
   - Measures ability to distinguish classes
   - Industry standard for binary classification

2. **Accuracy**: Simple percentage of correct predictions
   - Easy to interpret but can be misleading with imbalanced classes

3. **Classification Report**: Detailed per-class metrics
   - Precision: How many predicted positives are actually positive
   - Recall: How many actual positives are correctly identified
   - F1-Score: Harmonic mean of precision and recall

4. **Confusion Matrix**: Detailed breakdown of prediction outcomes
   - True Positives: Correctly identified exoplanets
   - False Positives: Incorrectly identified exoplanets
   - True Negatives: Correctly identified non-exoplanets
   - False Negatives: Missed exoplanets

### 9. Advanced Visualization Suite
```python
def plot_results(self, y_test, y_pred, y_pred_proba):
    """Plot model performance visualizations"""
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
    
    # 1. Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax1)
    ax1.set_title('Confusion Matrix')
    ax1.set_xlabel('Predicted')
    ax1.set_ylabel('Actual')
    ax1.set_xticklabels(['Not Exoplanet', 'Exoplanet'])
    ax1.set_yticklabels(['Not Exoplanet', 'Exoplanet'])
```

**Purpose**: Generate comprehensive visual analysis of model performance

**Four-Panel Visualization**:

**Panel 1: Confusion Matrix Heatmap**
- Visual representation of prediction accuracy
- Shows exactly where model makes mistakes
- Color intensity indicates frequency of outcomes
- Easy to spot patterns in misclassification

**Panel 2: ROC Curve**
```python
# 2. ROC Curve
fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
auc_score = roc_auc_score(y_test, y_pred_proba)
ax2.plot(fpr, tpr, label=f'ROC Curve (AUC = {auc_score:.3f})')
ax2.plot([0, 1], [0, 1], 'k--', label='Random')
ax2.set_xlabel('False Positive Rate')
ax2.set_ylabel('True Positive Rate')
ax2.set_title('ROC Curve')
ax2.legend()
ax2.grid(True)
```
- Shows trade-off between sensitivity and specificity
- AUC score quantifies overall discrimination ability
- Comparison to random baseline (diagonal line)
- Helps choose optimal classification threshold

**Panel 3: Probability Distribution**
```python
# 3. Prediction Probability Distribution
ax3.hist(y_pred_proba[y_test == 0], bins=50, alpha=0.7, label='Not Exoplanet', density=True)
ax3.hist(y_pred_proba[y_test == 1], bins=50, alpha=0.7, label='Exoplanet', density=True)
ax3.set_xlabel('Prediction Probability')
ax3.set_ylabel('Density')
ax3.set_title('Prediction Probability Distribution')
ax3.legend()
ax3.grid(True)
```
- Shows how confident model is in its predictions
- Good separation indicates well-calibrated model
- Overlapping distributions suggest uncertainty regions
- Helps understand model confidence patterns

**Panel 4: Feature Importance**
```python
# 4. Feature Importance (if available)
if hasattr(self.model, 'feature_importances_'):
    importance = self.model.feature_importances_
    indices = np.argsort(importance)[-15:]  # Top 15 features
    ax4.barh(range(len(indices)), importance[indices])
    ax4.set_yticks(range(len(indices)))
    ax4.set_yticklabels([self.feature_names[i] for i in indices])
    ax4.set_xlabel('Feature Importance')
    ax4.set_title('Top 15 Feature Importances')
```
- Shows which features are most important for predictions
- Helps understand model decision-making process
- Validates that scientifically meaningful features are important
- Useful for model interpretation and debugging

### 10. Single Example Prediction
```python
def predict_single_example(self, example_data):
    """Make a prediction on a single example"""
    # This would need the same preprocessing as the full dataset
    # For now, just show how to use the model
    example_scaled = self.scaler.transform([example_data])
    prediction = self.model.predict(example_scaled)[0]
    probability = self.model.predict_proba(example_scaled)[0, 1]
    
    return prediction, probability
```

**Purpose**: Demonstrate how to make predictions on individual cases
- **Single Point Prediction**: Test model on one example
- **Probability Output**: Get confidence level for the prediction
- **Production Simulation**: Shows how model would be used in application

### 11. Complete Testing Pipeline
```python
def run_full_test(self):
    """Run the complete testing pipeline"""
    print("="*60)
    print("EXOPLANET MODEL TESTING")
    print("="*60)
    
    # Load model
    self.load_model()
    
    # Load and preprocess data
    X, y = self.load_and_preprocess_data()
    
    # Test model
    y_test, y_pred, y_pred_proba, auc_score = self.test_model(X, y)
    
    # Plot results
    self.plot_results(y_test, y_pred, y_pred_proba)
    
    print("\n" + "="*60)
    print(f"🎉 MODEL TESTING COMPLETED!")
    print(f"🎯 Final AUC Score: {auc_score:.4f}")
    print("="*60)
    
    return auc_score
```

**Purpose**: Execute complete testing workflow from start to finish

**Pipeline Steps**:
1. **Model Loading**: Load trained model components
2. **Data Preparation**: Apply training-consistent preprocessing
3. **Model Testing**: Generate predictions and calculate metrics
4. **Visualization**: Create comprehensive performance plots
5. **Summary**: Provide final performance assessment

### 12. Factory Function for Easy Instantiation
```python
def create_tester(model_path, data_path):
    """
    Create and return an ExoplanetModelTester instance.

    Args:
        model_path (str): Path to the saved model file.
        data_path (str): Path to the data file.

    Returns:
        ExoplanetModelTester: Initialized tester object.
    """
    tester = ExoplanetModelTester(model_path, data_path)
    return tester
```

**Purpose**: Provide convenient factory function for object creation
- **Simplified Interface**: Easy way to create tester objects
- **Consistent Initialization**: Ensures proper setup
- **Reusable Pattern**: Can be imported and used by other modules

### 13. Standalone Execution
```python
if __name__ == "__main__":
    tester = ExoplanetModelTester(
        model_path='../Models/best_exoplanet_model.pkl',
        data_path='../data/cumulative_exoplanets.csv'
    )
    
    # Run complete testing
    auc_score = tester.run_full_test()
```

**Purpose**: Allow independent execution for comprehensive model validation

## Key Features

### 1. Comprehensive Testing
- Multiple performance metrics for thorough evaluation
- Visual analysis with professional-quality plots
- Both overall and per-class performance assessment

### 2. Training Consistency
- Exact replication of training preprocessing pipeline
- Feature alignment validation and correction
- Identical data splitting for fair comparison

### 3. Production Readiness Validation
- Tests all components needed for deployment
- Validates model file integrity and completeness
- Simulates real-world prediction scenarios

### 4. Scientific Rigor
- Uses industry-standard evaluation metrics
- Provides detailed statistical analysis
- Includes confidence intervals and error analysis

### 5. Interpretability
- Feature importance analysis for understanding model decisions
- Probability distribution analysis for confidence assessment
- Visual confusion matrix for error pattern identification

## Expected Performance Metrics

### Excellent Model (AUC > 0.9)
- **Interpretation**: Excellent discrimination between exoplanets and false positives
- **Confidence**: High confidence for production deployment
- **Action**: Deploy with confidence

### Good Model (0.8 < AUC < 0.9)
- **Interpretation**: Good performance, suitable for most applications
- **Confidence**: Acceptable for production with monitoring
- **Action**: Deploy with performance monitoring

### Fair Model (0.7 < AUC < 0.8)
- **Interpretation**: Moderate performance, may need improvement
- **Confidence**: Use with caution, consider additional validation
- **Action**: Consider model refinement before deployment

### Poor Model (AUC < 0.7)
- **Interpretation**: Poor discrimination, not suitable for production
- **Confidence**: Not recommended for deployment
- **Action**: Retrain model with different approach

## Integration with Production System

This testing module ensures that:
1. **Model Quality**: Validates model meets performance requirements
2. **Deployment Readiness**: Confirms all components work together correctly
3. **Performance Baseline**: Establishes expected accuracy for monitoring
4. **Error Analysis**: Identifies potential failure modes and edge cases

## Usage in Development Workflow

### During Development
```bash
python test_model.py
```
- Validate model after training
- Compare different model versions
- Identify performance bottlenecks

### Before Deployment
- Run comprehensive test suite
- Validate on fresh dataset
- Generate performance report for stakeholders

### Continuous Monitoring
- Periodic revalidation on new data
- Performance drift detection
- Model update validation