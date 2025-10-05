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


app = Flask(__name__)
# app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs("results", exist_ok=True)

# Global variables for model components
model = None
scaler = None
feature_names = None
habitability_analyzer = None

ALLOWED_EXTENSIONS = {'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home(): # Home page (file upload option)
    return render_template('index.html')

@app.route('/results')
def results(): # Page to display results
    return render_template('results.html')

@app.route('/api/upload', methods=['POST'])
def upload(): # Endpoint for file upload
    try:
        # Check if this is a demo data request
        if request.get_data() == b'demo':
            return handle_demo_data()
        
        # Deal with the demo data request (legacy support)
        if request.form.get('use_demo_data') == 'true':
            return handle_demo_data()

        # Regular file upload handling
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'status': 'error', 'message': 'Only CSV files are allowed'}), 400
        
        # Save file to directory
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the uploaded file
        return process_uploaded_file(filepath)
                
    except Exception as e:
        print(f"Error in upload: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Upload failed. Please try again.'}), 500


def handle_demo_data():
    """Handle demo KOI data processing"""
    try:
        demo_file_path = 'data/koi_data.csv'
        
        if not os.path.exists(demo_file_path):
            return jsonify({
                'status': 'error', 
                'message': 'Demo data file not found. Please upload your own CSV file.'
            }), 404
        
        print("Loading demo KOI data...")
        # Process the demo file
        return process_uploaded_file(demo_file_path, is_demo=True)
        
    except Exception as e:
        print(f"Error loading demo data: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': 'Failed to load demo data. Please try uploading your own file.'
        }), 500


def process_uploaded_file(filepath, is_demo=False):
    """Process uploaded or demo file through ML pipeline"""
    try:
        # Load the data
        print(f"Processing file: {filepath}")
        df = pd.read_csv(filepath, comment='#')  # Handle comment lines like in Kepler data
        
        row_count = len(df)
        col_count = len(df.columns)
        
        filename = "Demo KOI Dataset" if is_demo else os.path.basename(filepath)
        print(f"CSV loaded successfully: {filename}")
        print(f"Rows: {row_count}, Columns: {col_count}")
        print(f"Columns: {list(df.columns)[:10]}...")  # Show first 10 columns
        
        # Load model if not already loaded
        if model is None:
            print("Loading ML model...")
            if not load_ml_model():
                return jsonify({
                    'status': 'error', 
                    'message': 'ML model not available. Please check server configuration.'
                }), 500
        
        # Process through ML pipeline
        print("Processing data through ML pipeline...")
        
        # Make exoplanet predictions
        df_with_predictions = predict_exoplanets(df)
        exoplanet_count = df_with_predictions['is_exoplanet'].sum()
        print(f"Detected {exoplanet_count} potential exoplanets")
        
        # Process habitability analysis
        df_habitable = process_habitability(df_with_predictions)
        habitable_count = len(df_habitable[df_habitable['habitability_class'].isin(['highly_habitable', 'potentially_habitable'])])
        print(f"Found {habitable_count} potentially habitable planets")
        
        # Format results for frontend
        results = format_results_for_frontend(df_habitable)
        
        # Save results to global variable for API access
        app.config['LATEST_RESULTS'] = results
        
        print(f"Formatted {len(results)} results for frontend display")
        
        return jsonify({
            'status': 'success', 
            'message': f'Analysis complete! Found {exoplanet_count} exoplanets, {habitable_count} potentially habitable.',
            "redirect": "/results",
            'exoplanet_count': int(exoplanet_count),
            'habitable_count': int(habitable_count),
            'total_analyzed': int(row_count)
        })
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        if os.path.exists(filepath):
            os.remove(filepath)  # Clean up invalid file
        return jsonify({'status': 'error', 'message': f'Error processing file: {str(e)}'}), 400
                
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Upload failed: {str(e)}'}), 500

@app.route('/api/get_results', methods=['GET'])
def get_results(): # get processed data from ML model
    """Get results from ML model processing and return as JSON"""
    
    try:
        # Get the latest results from the app config
        results = app.config.get('LATEST_RESULTS', [])
        
        if not results:
            return jsonify({
                'status': 'error',
                'message': 'No results available. Please upload and process a CSV file first.',
                'results': []
            }), 404
        
        # Separate highly habitable planets (for glow effect)
        highly_habitable = [r for r in results if r.get('is_highly_habitable', False)]
        
        return jsonify({
            'status': 'success',
            'total_count': len(results),
            'highly_habitable_count': len(highly_habitable),
            'results': results
        })
        
    except Exception as e:
        print(f"Error getting results: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error retrieving results: {str(e)}',
            'results': []
        }), 500


def load_ml_model():
    # \"\"\"Load the trained ML model and components\"\"\"
    global model, scaler, feature_names, habitability_analyzer
    
    try:
        # Try different possible model paths
        possible_paths = [
            'Models/best_exoplanet_model.pkl',
            '../Models/best_exoplanet_model.pkl',
            './Models/best_exoplanet_model.pkl'
        ]
        
        model_path = None
        for path in possible_paths:
            if os.path.exists(path):
                model_path = path
                break
        
        if not model_path:
            raise FileNotFoundError("Model file not found in any expected location")
        
        print(f"Loading model from: {model_path}")
        
        model_data = joblib.load(model_path)
        model = model_data['model']
        scaler = model_data['scaler']
        feature_names = model_data.get('feature_names', [])
        
        print(f"Model type: {type(model).__name__}")
        print(f"Number of features: {len(feature_names)}")
        print("Model loaded successfully!")
        
        return True
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return False

def preprocess_input_data(df):
    """Preprocess input data to match training pipeline"""
    global feature_names, scaler
    
    if feature_names is None or len(feature_names) == 0:
        raise ValueError("Feature names not loaded from model")
    
    print(f"Input dataframe shape: {df.shape}")
    print(f"Input columns: {list(df.columns)}")
    
    # Define the base feature columns used during training
    expected_features = [
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
    
    print(f"Expected {len(expected_features)} base features")
    
    # Keep only available features from the uploaded data
    available_features = [col for col in expected_features if col in df.columns]
    missing_features = [col for col in expected_features if col not in df.columns]
    
    print(f"Available features: {len(available_features)} - {available_features[:5]}...")
    print(f"Missing features: {len(missing_features)} - {missing_features[:5]}...")
    
    # Start with available features only
    X = df[available_features].copy() if available_features else pd.DataFrame(index=df.index)
    
    # Add missing expected features with zeros
    for feature in missing_features:
        X[feature] = 0.0
    
    # Ensure columns are in the expected order
    X = X[expected_features]
    
    print(f"Pre-imputation X shape: {X.shape}")
    
    # Handle missing values with median imputation, but handle all-NaN columns first
    # Replace completely missing columns with zeros before imputation
    for col in X.columns:
        if X[col].isna().all():
            print(f"Column {col} is completely missing, filling with zeros")
            X[col] = 0.0
    
    # Now apply imputation only to columns that have some data
    imputer = SimpleImputer(strategy='median')
    X_imputed_array = imputer.fit_transform(X)
    
    # Create DataFrame ensuring we maintain all expected columns
    X_imputed = pd.DataFrame(
        X_imputed_array,
        columns=X.columns,  # Use actual X columns, not expected_features
        index=X.index
    )
    
    # Make sure we have all expected features (this handles any discrepancies)
    for feature in expected_features:
        if feature not in X_imputed.columns:
            X_imputed[feature] = 0.0
    
    # Reorder to match expected_features
    X_imputed = X_imputed[expected_features]
    
    # Feature engineering (same as training)
    if 'koi_period' in X_imputed.columns and 'koi_duration' in X_imputed.columns:
        X_imputed['period_duration_ratio'] = X_imputed['koi_period'] / (X_imputed['koi_duration'] + 1e-8)
    
    if 'koi_depth' in X_imputed.columns and 'koi_prad' in X_imputed.columns:
        X_imputed['depth_prad_ratio'] = X_imputed['koi_depth'] / (X_imputed['koi_prad'] + 1e-8)
    
    # Create uncertainty features
    error_cols = [col for col in X_imputed.columns if 'err' in col]
    for err_col in error_cols:
        base_col = err_col.replace('_err1', '').replace('_err2', '')
        if base_col in X_imputed.columns:
            uncertainty_col = f'{base_col}_uncertainty'
            X_imputed[uncertainty_col] = abs(X_imputed[err_col]) / (abs(X_imputed[base_col]) + 1e-8)
    
    # Remove infinite values
    X_imputed = X_imputed.replace([np.inf, -np.inf], np.nan)
    X_imputed = X_imputed.fillna(X_imputed.median())
    
    print(f"After feature engineering, X_imputed shape: {X_imputed.shape}")
    print(f"Available feature names: {len(X_imputed.columns)}")
    print(f"Expected model features: {len(feature_names)}")
    
    # Ensure we have exactly the same features as training in the same order
    missing_features = set(feature_names) - set(X_imputed.columns)
    if missing_features:
        print(f"Adding {len(missing_features)} missing model features with default values")
        for feature in missing_features:
            X_imputed[feature] = 0.0
    
    # Select and order features to match training exactly
    X_final = X_imputed[feature_names]
    print(f"Final feature matrix shape: {X_final.shape}")
    
    # Apply scaling
    X_scaled = scaler.transform(X_final)
    
    return X_scaled

def predict_exoplanets(df):
    """Predict exoplanets using the trained model"""
    global model
    
    try:
        # Preprocess the data
        X_processed = preprocess_input_data(df)
        
        # Make predictions
        predictions = model.predict(X_processed)
        probabilities = model.predict_proba(X_processed)[:, 1]  # Probability of being an exoplanet
        
        # Add predictions to dataframe
        df_results = df.copy()
        df_results['is_exoplanet'] = predictions
        df_results['exoplanet_probability'] = probabilities
        
        return df_results
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        raise e

def process_habitability(df_with_predictions):
    """Process habitability analysis for detected exoplanets"""
    global habitability_analyzer
    
    # Filter for detected exoplanets
    exoplanets = df_with_predictions[df_with_predictions['is_exoplanet'] == 1].copy()
    
    if len(exoplanets) == 0:
        return []
    
    # Create a temporary habitability analyzer
    # We'll manually calculate habitability scores since we don't have the full dataset
    habitability_criteria = {
        'earth_like_radius': {'min': 0.5, 'max': 2.0, 'feature': 'koi_prad', 'weight': 0.3},
        'habitable_temperature': {'min': 200, 'max': 350, 'feature': 'koi_teq', 'weight': 0.4},
        'appropriate_insolation': {'min': 0.3, 'max': 1.7, 'feature': 'koi_insol', 'weight': 0.2},
        'reasonable_orbital_period': {'min': 10, 'max': 500, 'feature': 'koi_period', 'weight': 0.1}
    }
    
    def calculate_habitability_score(row):
        total_score = 0
        total_weight = 0
        
        for criterion, params in habitability_criteria.items():
            feature = params['feature']
            weight = params['weight']
            
            if feature in row and pd.notna(row[feature]):
                value = row[feature]
                if params['min'] <= value <= params['max']:
                    optimal = (params['min'] + params['max']) / 2
                    range_size = params['max'] - params['min']
                    deviation = abs(value - optimal) / (range_size / 2)
                    criterion_score = max(0, 1 - deviation)
                else:
                    criterion_score = 0
                
                total_score += criterion_score * weight
                total_weight += weight
        
        return total_score / total_weight if total_weight > 0 else 0
    
    def classify_habitability(score):
        if score >= 0.7:
            return 'highly_habitable'
        elif score >= 0.5:
            return 'potentially_habitable'
        elif score >= 0.3:
            return 'marginally_habitable'
        else:
            return 'not_habitable'
    
    # Calculate habitability scores
    exoplanets['habitability_score'] = exoplanets.apply(calculate_habitability_score, axis=1)
    exoplanets['habitability_class'] = exoplanets['habitability_score'].apply(classify_habitability)
    
    return exoplanets

def format_results_for_frontend(df_habitable):
    """Format results for the Three.js frontend"""
    if len(df_habitable) == 0:
        return []
    
    # Sort by exoplanet probability and limit to top 20
    top_candidates = df_habitable.nlargest(20, 'exoplanet_probability')
    
    # Get top 8 most habitable among the top 20
    top_habitable = top_candidates.nlargest(8, 'habitability_score')
    top_habitable_ids = set(top_habitable.index)
    
    results = []
    
    for idx, row in top_candidates.iterrows():
        # Generate diverse summary based on characteristics
        radius = row.get('koi_prad', 0)
        temp = row.get('koi_teq', 0)
        insolation = row.get('koi_insol', 0)
        period = row.get('koi_period', 0)
        stellar_temp = row.get('koi_steff', 0)
        hab_score = row['habitability_score']
        planet_id = row.get('kepoi_name', f"Planet-{idx}")
        
        # Create unique summaries based on planet characteristics
        if hab_score >= 0.8:
            if radius < 1.5 and 250 <= temp <= 320:
                summary = f"Exceptional habitability candidate! {planet_id} exhibits Earth-like conditions with a radius of {radius:.1f} R⊕ and surface temperatures around {temp:.0f}K. This rocky world orbits within the optimal habitable zone."
            else:
                summary = f"Highly promising for life! {planet_id} scores {hab_score:.2f} on habitability metrics. Its orbital period of {period:.1f} days suggests stable climate conditions around a {stellar_temp:.0f}K star."
        elif hab_score >= 0.6:
            if temp > 400:
                summary = f"Potentially habitable despite warmer conditions. {planet_id} receives {insolation:.1f}× Earth's stellar flux, but its {radius:.1f} Earth-radius size could support a substantial atmosphere."
            elif temp < 200:
                summary = f"Cold world candidate. {planet_id} orbits in the outer habitable zone with temperatures around {temp:.0f}K. Subsurface oceans or greenhouse warming could enable habitability."
            else:
                summary = f"Moderate habitability prospect. {planet_id} balances size ({radius:.1f} R⊕) and temperature ({temp:.0f}K) reasonably well, warranting further atmospheric analysis."
        elif hab_score >= 0.4:
            summary = f"Marginally habitable candidate. {planet_id} shows some promising features but faces challenges - orbital period: {period:.1f} days, stellar irradiation: {insolation:.1f}× Earth levels."
        else:
            if radius > 3.0:
                summary = f"Gas giant candidate. {planet_id} with {radius:.1f} Earth radii likely lacks a solid surface, but could host habitable moons in its system."
            elif temp > 1000:
                summary = f"Hot world. {planet_id} experiences extreme temperatures ({temp:.0f}K) due to proximity to its {stellar_temp:.0f}K host star. Atmospheric studies could reveal exotic chemistry."
            else:
                summary = f"Interesting detection. {planet_id} represents a valuable addition to exoplanet demographics, helping refine our understanding of planetary system architecture."
        
        result = {
            "planet_id": row.get('kepoi_name', f"KOI-{idx}"),
            "kepler_name": row.get('kepler_name', f"Kepler-{idx} b"),
            "classification": "Exoplanet",
            "classification_probability": float(row['exoplanet_probability']),
            "habitability_score": float(row['habitability_score']),
            "habitability_class": row['habitability_class'],
            "is_highly_habitable": idx in top_habitable_ids,  # For Three.js glow effect
            "features": {
                "radius_earth_radii": float(row.get('koi_prad', 0)),
                "temperature_k": float(row.get('koi_teq', 0)),
                "insolation_earth_flux": float(row.get('koi_insol', 0)),
                "orbital_period_days": float(row.get('koi_period', 0)),
                "stellar_temp_k": float(row.get('koi_steff', 0)),
                "stellar_radius_solar": float(row.get('koi_srad', 0)),
                "stellar_mass_solar": float(row.get('koi_smass', 1.0))
            },
            "summary": summary
        }
        results.append(result)
    
    return results





if __name__ == '__main__':
    print("Starting Exoplanet Classification Server...")
    
    # Load the ML model on startup
    if not load_ml_model():
        print("Warning: Could not load ML model. The application may not work correctly.")
    
    print("Server starting on http://0.0.0.0:8080")
    app.run(host='0.0.0.0', port=8080, debug=True)