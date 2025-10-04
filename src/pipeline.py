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
        
        # Missing values analysis
        print("\nMissing values:")
        missing_data = self.df.isnull().sum()
        missing_data = missing_data[missing_data > 0].sort_values(ascending=False)
        print(missing_data.head(20))
        
        # Correlation analysis for numerical features
        numerical_cols = self.df.select_dtypes(include=[np.number]).columns
        if len(numerical_cols) > 1:
            plt.figure(figsize=(12, 10))
            correlation_matrix = self.df[numerical_cols].corr()
            sns.heatmap(correlation_matrix, annot=False, cmap='coolwarm', center=0)
            plt.title('Correlation Matrix of Numerical Features')
            plt.tight_layout()
            plt.show()
    
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
        
        # Remove identifier columns and original target
        cols_to_drop = ['kepid', 'kepoi_name', 'kepler_name', 'koi_disposition']
        cols_to_drop = [col for col in cols_to_drop if col in df_processed.columns]
        
        # Select relevant features for exoplanet detection
        feature_columns = [
            'koi_period', 'koi_period_err1', 'koi_period_err2',
            'koi_time0bk', 'koi_time0bk_err1', 'koi_time0bk_err2',
            'koi_impact', 'koi_impact_err1', 'koi_impact_err2',
            'koi_duration', 'koi_duration_err1', 'koi_duration_err2',
            'koi_depth', 'koi_depth_err1', 'koi_depth_err2',
            'koi_prad', 'koi_prad_err1', 'koi_prad_err2',
            'koi_teq', 'koi_teq_err1', 'koi_teq_err2',
            'koi_insol', 'koi_insol_err1', 'koi_insol_err2',
            'koi_model_snr', 'koi_tce_plnt_num', 'koi_steff', 'koi_steff_err1', 'koi_steff_err2',
            'koi_slogg', 'koi_slogg_err1', 'koi_slogg_err2',
            'koi_srad', 'koi_srad_err1', 'koi_srad_err2'
        ]
        
        # Keep only existing feature columns
        available_features = [col for col in feature_columns if col in df_processed.columns]
        
        print(f"Available features: {len(available_features)}")
        print("Features to use:", available_features[:10], "..." if len(available_features) > 10 else "")
        
        # Create feature matrix and target vector
        X = df_processed[available_features].copy()
        y = df_processed[target_col].copy()
        
        print(f"\nOriginal feature matrix shape: {X.shape}")
        print(f"Target distribution:\n{y.value_counts()}")
        
        # Handle missing values
        print("\nHandling missing values...")
        
        # For features with >50% missing values, consider dropping
        missing_threshold = 0.5
        high_missing = X.isnull().mean() > missing_threshold
        cols_to_drop_missing = X.columns[high_missing].tolist()
        
        if cols_to_drop_missing:
            print(f"Dropping columns with >{missing_threshold*100}% missing values: {cols_to_drop_missing}")
            X = X.drop(columns=cols_to_drop_missing)
        
        # Impute remaining missing values using median for numerical features
        imputer = SimpleImputer(strategy='median')
        X_imputed = pd.DataFrame(
            imputer.fit_transform(X),
            columns=X.columns,
            index=X.index
        )
        
        print(f"Final feature matrix shape: {X_imputed.shape}")
        print(f"Missing values after imputation: {X_imputed.isnull().sum().sum()}")
        
        return X_imputed, y
    
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
        
        # Create uncertainty features (ratio of error to value)
        error_cols = [col for col in X_engineered.columns if 'err' in col]
        for err_col in error_cols:
            base_col = err_col.replace('_err1', '').replace('_err2', '')
            if base_col in X_engineered.columns:
                uncertainty_col = f'{base_col}_uncertainty'
                X_engineered[uncertainty_col] = abs(X_engineered[err_col]) / (abs(X_engineered[base_col]) + 1e-8)
        
        print(f"Features after engineering: {X_engineered.shape[1]}")
        
        # Remove infinite and extremely large values
        X_engineered = X_engineered.replace([np.inf, -np.inf], np.nan)
        X_engineered = X_engineered.fillna(X_engineered.median())
        
        return X_engineered, y
    
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
        self.X_train_scaled = pd.DataFrame(
            self.scaler.fit_transform(self.X_train),
            columns=self.X_train.columns,
            index=self.X_train.index
        )
        self.X_test_scaled = pd.DataFrame(
            self.scaler.transform(self.X_test),
            columns=self.X_test.columns,
            index=self.X_test.index
        )
        
        return self.X_train_scaled, self.X_test_scaled, self.y_train, self.y_test
    
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
        
        # Train and evaluate each model
        results = {}
        
        for name, model in self.models.items():
            print(f"\nTraining {name}...")
            
            # Fit the model
            model.fit(X_train, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None
            
            # Calculate metrics
            auc_score = roc_auc_score(y_test, y_pred_proba) if y_pred_proba is not None else None
            
            # Cross-validation score
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
            
            results[name] = {
                'model': model,
                'auc_score': auc_score,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'y_pred': y_pred,
                'y_pred_proba': y_pred_proba
            }
            
            print(f"AUC Score: {auc_score:.4f}" if auc_score else "AUC Score: N/A")
            print(f"CV AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
            print("\nClassification Report:")
            print(classification_report(y_test, y_pred))
        
        return results
    
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
        
        plt.tight_layout()
        plt.show()
    
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
        
        print("\n" + "="*60)
        print("PIPELINE COMPLETED SUCCESSFULLY!")
        print("="*60)
        
        return results, best_model_name

# Example usage
if __name__ == "__main__":
    # Initialize pipeline
    pipeline = ExoplanetMLPipeline('../data/cumulative_exoplanets.csv')
    
    # Run the complete pipeline
    results, best_model = pipeline.run_full_pipeline()
