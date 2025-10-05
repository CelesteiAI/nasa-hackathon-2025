# pipeline.py - Machine Learning Pipeline for Exoplanet Detection

## Overview
This module implements a comprehensive machine learning pipeline for detecting exoplanets from NASA Kepler Object of Interest (KOI) data. It handles the complete workflow from data loading to model training and evaluation, using multiple algorithms and advanced preprocessing techniques.

## Detailed Code Breakdown

### 1. Imports and Dependencies
```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder, RobustScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
from sklearn.impute import SimpleImputer, KNNImputer
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostClassifier
import joblib
import warnings
warnings.filterwarnings('ignore')
```

**Purpose**: Import comprehensive ML and data science libraries:
- **Data Manipulation**: `pandas`, `numpy` for data handling
- **Visualization**: `matplotlib`, `seaborn` for plotting
- **ML Framework**: `sklearn` for traditional ML algorithms
- **Gradient Boosting**: `xgboost`, `lightgbm`, `catboost` for advanced algorithms
- **Class Imbalance**: `imblearn` for handling unbalanced datasets
- **Persistence**: `joblib` for model saving/loading

### 2. Class Initialization
```python
class ExoplanetMLPipeline:
    def __init__(self, data_path):
        """
        Initialize the ML pipeline for exoplanet classification
        
        Args:
            data_path (str): Path to the cumulative_exoplanets.csv file
        """
        self.data_path = data_path
        self.df = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.scaler = None
        self.models = {}
        self.feature_importance = {}
```

**Purpose**: Initialize the pipeline with essential attributes:
- `data_path`: Location of NASA Kepler dataset
- Data containers for train/test splits
- `scaler`: For feature normalization
- `models`: Dictionary to store trained models
- `feature_importance`: For model interpretability

### 3. Data Loading and Initial Analysis
```python
def load_data(self):
    """Load and display basic information about the dataset"""
    print("Loading KOI dataset...")
    self.df = pd.read_csv(self.data_path, comment='#')
    
    print(f"Dataset shape: {self.df.shape}")
    print(f"Columns: {len(self.df.columns)}")
    print("\nFirst few rows:")
    print(self.df.head())
    
    print("\nDataset info:")
    print(self.df.info())
    
    return self.df
```

**Purpose**: 
- Load NASA Kepler dataset (handles comment lines with `comment='#'`)
- Display dataset dimensions and structure
- Provide initial data quality assessment
- Return loaded dataframe for pipeline use

### 4. Exploratory Data Analysis
```python
def explore_data(self):
    """Perform exploratory data analysis"""
    print("\n" + "="*50)
    print("EXPLORATORY DATA ANALYSIS")
    print("="*50)
    
    # Target variable analysis
    if 'koi_disposition' in self.df.columns:
        print("\nTarget variable distribution (koi_disposition):")
        print(self.df['koi_disposition'].value_counts())
        
        plt.figure(figsize=(10, 6))
        self.df['koi_disposition'].value_counts().plot(kind='bar')
        plt.title('Distribution of KOI Dispositions')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()
```

**Purpose**: Comprehensive data exploration including:
- **Target Distribution**: Analyze KOI dispositions (CONFIRMED, FALSE POSITIVE, CANDIDATE)
- **Missing Data Analysis**: Identify features with missing values
- **Correlation Analysis**: Understand relationships between numerical features
- **Visualization**: Generate plots for data understanding

**KOI Dispositions Explained**:
- **CONFIRMED**: Validated exoplanets
- **FALSE POSITIVE**: Not actually exoplanets
- **CANDIDATE**: Potential exoplanets needing further validation

### 5. Data Preprocessing
```python
def preprocess_data(self):
    """
    Preprocess the data for machine learning
    """
    print("\n" + "="*50)
    print("DATA PREPROCESSING")
    print("="*50)
    
    # Create a copy for preprocessing
    df_processed = self.df.copy()
    
    # Define target variable
    if 'koi_disposition' in df_processed.columns:
        # Convert to binary classification: CONFIRMED vs rest
        df_processed['target'] = (df_processed['koi_disposition'] == 'CONFIRMED').astype(int)
        target_col = 'target'
    else:
        raise ValueError("Target column 'koi_disposition' not found in dataset")
```

**Purpose**: Transform raw NASA data into ML-ready format

**Key Preprocessing Steps**:

1. **Target Creation**: Convert multi-class problem (CONFIRMED/FALSE POSITIVE/CANDIDATE) to binary (CONFIRMED vs. not CONFIRMED)

2. **Feature Selection**: Focus on scientifically relevant features:
   - **Orbital Characteristics**: `koi_period` (orbital period), `koi_duration` (transit duration)
   - **Transit Properties**: `koi_depth` (transit depth), `koi_impact` (impact parameter)
   - **Planetary Properties**: `koi_prad` (planet radius), `koi_teq` (equilibrium temperature)
   - **Stellar Properties**: `koi_steff` (stellar temperature), `koi_srad` (stellar radius)
   - **Measurement Uncertainties**: Error columns for all measurements

3. **Data Quality Control**: Remove identifier columns that don't contribute to prediction

4. **Missing Value Handling**: 
   - Drop features with >50% missing values
   - Apply median imputation for remaining missing values
   - Use median (robust to outliers) rather than mean

### 6. Feature Engineering
```python
def feature_engineering(self, X, y):
    """
    Create new features and prepare data for modeling
    """
    print("\n" + "="*50)
    print("FEATURE ENGINEERING")
    print("="*50)
    
    X_engineered = X.copy()
    
    # Create ratio features
    if 'koi_period' in X_engineered.columns and 'koi_duration' in X_engineered.columns:
        X_engineered['period_duration_ratio'] = X_engineered['koi_period'] / (X_engineered['koi_duration'] + 1e-8)
    
    if 'koi_depth' in X_engineered.columns and 'koi_prad' in X_engineered.columns:
        X_engineered['depth_prad_ratio'] = X_engineered['koi_depth'] / (X_engineered['koi_prad'] + 1e-8)
```

**Purpose**: Create scientifically meaningful derived features

**Engineered Features**:

1. **Ratio Features**:
   - `period_duration_ratio`: Relationship between orbital period and transit duration
   - `depth_prad_ratio`: Relationship between transit depth and planet radius

2. **Uncertainty Features**: 
   - Calculate relative uncertainties for all measurements
   - Formula: `uncertainty = |error| / |value|`
   - Helps model understand measurement quality

3. **Data Cleaning**:
   - Replace infinite values with NaN
   - Fill remaining NaN with median values
   - Ensure numerical stability with small epsilon values (1e-8)

**Scientific Rationale**: These ratios capture important physical relationships that help distinguish real exoplanets from false positives.

### 7. Data Splitting and Scaling
```python
def split_and_scale_data(self, X, y):
    """
    Split data into train/test sets and apply scaling
    """
    print("\n" + "="*50)
    print("DATA SPLITTING AND SCALING")
    print("="*50)
    
    # Split the data
    self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set shape: {self.X_train.shape}")
    print(f"Test set shape: {self.X_test.shape}")
    print(f"Training target distribution:\n{self.y_train.value_counts()}")
    
    # Scale the features using RobustScaler (less sensitive to outliers)
    self.scaler = RobustScaler()
```

**Purpose**: Prepare data for machine learning algorithms

**Key Decisions**:
- **80/20 Split**: Standard train/test ratio
- **Stratified Splitting**: Maintains class distribution in both sets
- **RobustScaler**: Less sensitive to outliers than StandardScaler
- **Consistent Scaling**: Apply same transformation to train and test sets

### 8. Class Imbalance Handling
```python
def handle_class_imbalance(self, X_train, y_train):
    """
    Handle class imbalance using SMOTE
    """
    print("\n" + "="*50)
    print("HANDLING CLASS IMBALANCE")
    print("="*50)
    
    print("Original class distribution:")
    print(y_train.value_counts())
    
    # Apply SMOTE for oversampling minority class
    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X_train, y_train)
    
    print("\nAfter SMOTE:")
    print(pd.Series(y_resampled).value_counts())
    
    return X_resampled, y_resampled
```

**Purpose**: Address class imbalance problem (confirmed exoplanets are rare)

**SMOTE Algorithm**:
- **Synthetic Minority Oversampling Technique**
- Creates synthetic examples of minority class
- Interpolates between existing minority class samples
- Avoids simple duplication which can lead to overfitting
- Generates realistic-looking synthetic data points

**Why Important**: Without balancing, models might achieve high accuracy by simply predicting "no exoplanet" for everything.

### 9. Model Training and Evaluation
```python
def train_models(self, X_train, y_train, X_test, y_test):
    """
    Train multiple models and evaluate their performance
    """
    print("\n" + "="*50)
    print("MODEL TRAINING AND EVALUATION")
    print("="*50)
    
    # Define models
    self.models = {
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        'XGBoost': xgb.XGBClassifier(random_state=42, eval_metric='logloss'),
        'LightGBM': lgb.LGBMClassifier(random_state=42, verbose=-1),
        'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
        'Gradient Boosting': GradientBoostingClassifier(random_state=42)
    }
```

**Purpose**: Train multiple algorithms and compare performance

**Model Selection Rationale**:

1. **Random Forest**: 
   - Ensemble method, handles overfitting well
   - Good for feature importance analysis
   - Robust to outliers and missing values

2. **XGBoost**: 
   - State-of-the-art gradient boosting
   - Often wins competitions
   - Excellent performance on tabular data

3. **LightGBM**: 
   - Faster alternative to XGBoost
   - Memory efficient
   - Good for large datasets

4. **Logistic Regression**: 
   - Simple, interpretable baseline
   - Fast training and prediction
   - Good for understanding feature relationships

5. **Gradient Boosting**: 
   - Traditional sklearn implementation
   - Good baseline for boosting methods

**Evaluation Metrics**:
- **AUC-ROC Score**: Area Under Receiver Operating Characteristic curve
- **Cross-Validation**: 5-fold CV for robust performance estimation
- **Classification Report**: Precision, recall, F1-score for detailed analysis

### 10. Model Comparison and Visualization
```python
def plot_model_comparison(self, results):
    """
    Plot comparison of model performances
    """
    model_names = list(results.keys())
    auc_scores = [results[name]['auc_score'] for name in model_names if results[name]['auc_score'] is not None]
    cv_means = [results[name]['cv_mean'] for name in model_names]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    
    # AUC scores
    if auc_scores:
        ax1.bar(model_names[:len(auc_scores)], auc_scores)
        ax1.set_title('Model AUC Scores on Test Set')
        ax1.set_ylabel('AUC Score')
        ax1.tick_params(axis='x', rotation=45)
    
    # CV scores
    ax2.bar(model_names, cv_means)
    ax2.set_title('Cross-Validation AUC Scores')
    ax2.set_ylabel('CV AUC Score')
    ax2.tick_params(axis='x', rotation=45)
```

**Purpose**: Visual comparison of model performance
- **Side-by-side comparison**: Test set vs. cross-validation performance
- **Easy interpretation**: Bar charts for quick comparison
- **Model selection aid**: Helps choose best performing algorithm

### 11. Model Persistence
```python
def save_best_model(self, results, model_path='trained-models/best_exoplanet_model.pkl'):
    """
    Save the best performing model
    """
    # Find best model based on CV AUC score
    best_model_name = max(results.keys(), key=lambda x: results[x]['cv_mean'])
    best_model = results[best_model_name]['model']
    
    print(f"\nBest model: {best_model_name}")
    print(f"CV AUC Score: {results[best_model_name]['cv_mean']:.4f}")
    
    # Save model and scaler
    joblib.dump({
        'model': best_model,
        'scaler': self.scaler,
        'feature_names': self.X_train.columns.tolist()
    }, model_path)
    
    print(f"Model saved to: {model_path}")
    return best_model_name, best_model
```

**Purpose**: Save best performing model for deployment

**What's Saved**:
- **Trained Model**: The best performing algorithm
- **Scaler**: Preprocessing component for new data
- **Feature Names**: Ensures consistent feature ordering
- **Complete Package**: Everything needed for deployment

**Selection Criteria**: Uses cross-validation AUC score (more robust than single test score)

### 12. Complete Pipeline Execution
```python
def run_full_pipeline(self):
    """
    Run the complete ML pipeline
    """
    print("="*60)
    print("EXOPLANET DETECTION ML PIPELINE")
    print("="*60)
    
    # 1. Load data
    self.load_data()
    
    # 2. Explore data
    self.explore_data()
    
    # 3. Preprocess data
    X, y = self.preprocess_data()
    
    # 4. Feature engineering
    X_engineered, y = self.feature_engineering(X, y)
    
    # 5. Split and scale data
    X_train_scaled, X_test_scaled, y_train, y_test = self.split_and_scale_data(X_engineered, y)
    
    # 6. Handle class imbalance
    X_train_balanced, y_train_balanced = self.handle_class_imbalance(X_train_scaled, y_train)
    
    # 7. Train models
    results = self.train_models(X_train_balanced, y_train_balanced, X_test_scaled, y_test)
    
    # 8. Plot model comparison
    self.plot_model_comparison(results)
    
    # 9. Save best model
    best_model_name, best_model = self.save_best_model(results)
```

**Purpose**: Execute complete ML workflow from start to finish

**Pipeline Steps**:
1. **Data Loading**: Import NASA dataset
2. **EDA**: Understand data characteristics
3. **Preprocessing**: Clean and prepare data
4. **Feature Engineering**: Create derived features
5. **Splitting/Scaling**: Prepare for ML algorithms
6. **Class Balancing**: Handle imbalanced dataset
7. **Model Training**: Train multiple algorithms
8. **Comparison**: Visualize performance differences
9. **Model Selection**: Save best performing model

### 13. Standalone Execution
```python
if __name__ == "__main__":
    # Initialize pipeline
    pipeline = ExoplanetMLPipeline('../data/cumulative_exoplanets.csv')
    
    # Run the complete pipeline
    results, best_model = pipeline.run_full_pipeline()
```

**Purpose**: Allow independent execution for training and testing

## Key Features

1. **Comprehensive Preprocessing**: Handles missing values, outliers, and data quality issues
2. **Multiple Algorithms**: Compares various ML approaches for best performance
3. **Scientific Feature Engineering**: Creates meaningful derived features based on physics
4. **Class Imbalance Handling**: Uses SMOTE for realistic synthetic data generation
5. **Robust Evaluation**: Cross-validation and multiple metrics for reliable assessment
6. **Production Ready**: Saves complete model package for deployment
7. **Visualization**: Clear performance comparisons and data exploration plots
8. **Modular Design**: Each step can be customized or extended independently

## Integration with Web Application

The trained model from this pipeline is used by `app.py` to:
- Make real-time predictions on uploaded CSV files
- Provide probability scores for exoplanet classification
- Enable the habitability analysis workflow

## Scientific Accuracy

The pipeline implements best practices from astronomical data analysis:
- Proper handling of measurement uncertainties
- Physics-based feature engineering
- Robust preprocessing for noisy astronomical data
- Multiple algorithm comparison for reliability