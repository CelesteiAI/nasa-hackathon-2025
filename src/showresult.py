import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
import warnings
warnings.filterwarnings('ignore')


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
        
    def load_model(self):
        """Load the trained model"""
        print("Loading trained model...")
        model_data = joblib.load(self.model_path)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        print("✓ Model loaded successfully!\n")
        
    def load_and_preprocess_data(self):
        """Load and preprocess the data"""
        df = pd.read_csv(self.data_path, comment='#')
        
        # Create target variable
        df['target'] = (df['koi_disposition'] == 'CONFIRMED').astype(int)
        
        # Keep KOI identifiers for reference
        koi_names = df['kepoi_name'] if 'kepoi_name' in df.columns else df.index
        
        # Select features
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
        
        available_features = [col for col in feature_columns if col in df.columns]
        X = df[available_features].copy()
        y = df['target'].copy()
        
        # Handle missing values
        missing_threshold = 0.5
        high_missing = X.isnull().mean() > missing_threshold
        cols_to_drop = X.columns[high_missing].tolist()
        if cols_to_drop:
            X = X.drop(columns=cols_to_drop)
        
        imputer = SimpleImputer(strategy='median')
        X_imputed = pd.DataFrame(
            imputer.fit_transform(X),
            columns=X.columns,
            index=X.index
        )
        
        # Feature engineering
        X_engineered = self.feature_engineering(X_imputed)
        
        return X_engineered, y, koi_names, df
    
    def feature_engineering(self, X):
        """Apply feature engineering"""
        X_engineered = X.copy()
        
        if 'koi_period' in X_engineered.columns and 'koi_duration' in X_engineered.columns:
            X_engineered['period_duration_ratio'] = X_engineered['koi_period'] / (X_engineered['koi_duration'] + 1e-8)
        
        if 'koi_depth' in X_engineered.columns and 'koi_prad' in X_engineered.columns:
            X_engineered['depth_prad_ratio'] = X_engineered['koi_depth'] / (X_engineered['koi_prad'] + 1e-8)
        
        error_cols = [col for col in X_engineered.columns if 'err' in col]
        for err_col in error_cols:
            base_col = err_col.replace('_err1', '').replace('_err2', '')
            if base_col in X_engineered.columns:
                uncertainty_col = f'{base_col}_uncertainty'
                X_engineered[uncertainty_col] = abs(X_engineered[err_col]) / (abs(X_engineered[base_col]) + 1e-8)
        
        X_engineered = X_engineered.replace([np.inf, -np.inf], np.nan)
        X_engineered = X_engineered.fillna(X_engineered.median())
        
        return X_engineered
    
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
        
        # Scale features
        X_test_scaled = pd.DataFrame(
            self.scaler.transform(X_test),
            columns=X_test.columns,
            index=X_test.index
        )
        
        # Align features with training
        missing_features = set(self.feature_names) - set(X_test_scaled.columns)
        for feature in missing_features:
            X_test_scaled[feature] = 0
        
        extra_features = set(X_test_scaled.columns) - set(self.feature_names)
        if extra_features:
            X_test_scaled = X_test_scaled.drop(columns=list(extra_features))
        
        X_test_scaled = X_test_scaled[self.feature_names]
        
        # Make predictions
        predictions = self.model.predict(X_test_scaled)
        probabilities = self.model.predict_proba(X_test_scaled)[:, 1]
        
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
        
        # Display summary statistics
        print(f"\nTest Set Size: {len(results_df)}")
        print(f"Accuracy: {results_df['Correct'].mean():.2%}")
        print(f"Correct Predictions: {results_df['Correct'].sum()} / {len(results_df)}")
        print(f"Incorrect Predictions: {(~results_df['Correct']).sum()}")
        
        # Show sample predictions
        print("\n" + "="*80)
        print(f"SAMPLE PREDICTIONS (showing {min(num_examples, len(results_df))} examples)")
        print("="*80)
        
        for idx, row in results_df.head(num_examples).iterrows():
            status_emoji = "✓" if row['Correct'] else "✗"
            confidence_bar = "█" * int(row['Confidence'] * 20)
            
            print(f"\n{status_emoji} KOI: {row['KOI_Name']}")
            print(f"   Actual:     {row['Actual_Status']}")
            print(f"   Predicted:  {row['Predicted_Status']}")
            print(f"   Probability: {row['Exoplanet_Probability']:.4f} (Confidence: {row['Confidence']:.2%})")
            print(f"   Confidence: {confidence_bar}")
        
        # Show some interesting cases
        print("\n" + "="*80)
        print("HIGH-CONFIDENCE CORRECT PREDICTIONS")
        print("="*80)
        high_confidence_correct = results_df[
            (results_df['Correct']) & (results_df['Confidence'] > 0.9)
        ].head(5)
        
        for idx, row in high_confidence_correct.iterrows():
            print(f"\n✓ KOI: {row['KOI_Name']}")
            print(f"   Status: {row['Actual_Status']}")
            print(f"   Confidence: {row['Confidence']:.2%}")
        
        # Show misclassifications
        print("\n" + "="*80)
        print("MISCLASSIFICATIONS (If any)")
        print("="*80)
        misclassified = results_df[~results_df['Correct']].head(5)
        
        if len(misclassified) > 0:
            for idx, row in misclassified.iterrows():
                print(f"\n✗ KOI: {row['KOI_Name']}")
                print(f"   Actual:     {row['Actual_Status']}")
                print(f"   Predicted:  {row['Predicted_Status']}")
                print(f"   Probability: {row['Exoplanet_Probability']:.4f}")
        else:
            print("\nNo misclassifications in the sample!")
        
        # Save results to CSV
        output_file = 'exoplanet_predictions.csv'
        results_df.to_csv(output_file, index=False)
        print(f"\n{'='*80}")
        print(f"✓ Full results saved to: {output_file}")
        print(f"{'='*80}\n")
        
        return results_df


def showresult(model_path, data_path):
    """Main function to run predictions"""
    # Update these paths to match your file locations
    
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


if __name__ == "__main__":
    model_path = '../Models/best_exoplanet_model (3).pkl'
    data_path = '../data/cumulative_exoplanets.csv'
    showresult(model_path, data_path)