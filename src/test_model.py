import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns

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
        
        # Select the same features used in training
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
        available_features = [col for col in feature_columns if col in df.columns]
        
        # Create feature matrix and target vector
        X = df[available_features].copy()
        y = df[target_col].copy()
        
        # Handle missing values (same as training)
        missing_threshold = 0.5
        high_missing = X.isnull().mean() > missing_threshold
        cols_to_drop_missing = X.columns[high_missing].tolist()
        
        if cols_to_drop_missing:
            print(f"Dropping columns with >{missing_threshold*100}% missing values: {cols_to_drop_missing}")
            X = X.drop(columns=cols_to_drop_missing)
        
        # Impute missing values using median
        from sklearn.impute import SimpleImputer
        imputer = SimpleImputer(strategy='median')
        X_imputed = pd.DataFrame(
            imputer.fit_transform(X),
            columns=X.columns,
            index=X.index
        )
        
        # Feature engineering (same as training)
        X_engineered = self.feature_engineering(X_imputed)
        
        return X_engineered, y
    
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
        
        # Remove infinite and extremely large values
        X_engineered = X_engineered.replace([np.inf, -np.inf], np.nan)
        X_engineered = X_engineered.fillna(X_engineered.median())
        
        return X_engineered
    
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
        
        # Scale features using the saved scaler
        X_test_scaled = pd.DataFrame(
            self.scaler.transform(X_test),
            columns=X_test.columns,
            index=X_test.index
        )
        
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
        
        return y_test, y_pred, y_pred_proba, auc_score
    
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
        
        # 3. Prediction Probability Distribution
        ax3.hist(y_pred_proba[y_test == 0], bins=50, alpha=0.7, label='Not Exoplanet', density=True)
        ax3.hist(y_pred_proba[y_test == 1], bins=50, alpha=0.7, label='Exoplanet', density=True)
        ax3.set_xlabel('Prediction Probability')
        ax3.set_ylabel('Density')
        ax3.set_title('Prediction Probability Distribution')
        ax3.legend()
        ax3.grid(True)
        
        # 4. Feature Importance (if available)
        if hasattr(self.model, 'feature_importances_'):
            importance = self.model.feature_importances_
            indices = np.argsort(importance)[-15:]  # Top 15 features
            ax4.barh(range(len(indices)), importance[indices])
            ax4.set_yticks(range(len(indices)))
            ax4.set_yticklabels([self.feature_names[i] for i in indices])
            ax4.set_xlabel('Feature Importance')
            ax4.set_title('Top 15 Feature Importances')
        else:
            ax4.text(0.5, 0.5, 'Feature importance\nnot available\nfor this model', 
                    ha='center', va='center', transform=ax4.transAxes)
            ax4.set_title('Feature Importance')
        
        plt.tight_layout()
        plt.show()
    
    def predict_single_example(self, example_data):
        """Make a prediction on a single example"""
        # This would need the same preprocessing as the full dataset
        # For now, just show how to use the model
        example_scaled = self.scaler.transform([example_data])
        prediction = self.model.predict(example_scaled)[0]
        probability = self.model.predict_proba(example_scaled)[0, 1]
        
        return prediction, probability
    
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

# Example usage
if __name__ == "__main__":
    # Initialize tester
    tester = ExoplanetModelTester(
        model_path='/home/tron/Code/nasa-hackathon-2025/Models/best_exoplanet_model.pkl',
        data_path='/home/tron/Code/nasa-hackathon-2025/cumulative_exoplanets.csv'
    )
    
    # Run complete testing
    auc_score = tester.run_full_test()