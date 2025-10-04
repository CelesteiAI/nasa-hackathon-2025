#!/usr/bin/env python3
"""
Test script to verify the ML model integration works correctly
"""

import pandas as pd
import numpy as np
import joblib
import sys
import os

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
            'koi_time0bk_err1': [0.5],
            'koi_time0bk_err2': [-0.5],
            'koi_impact': [0.5],
            'koi_impact_err1': [0.1],
            'koi_impact_err2': [-0.1],
            'koi_duration': [3.0],
            'koi_duration_err1': [0.2],
            'koi_duration_err2': [-0.2],
            'koi_depth': [500.0],
            'koi_depth_err1': [50.0],
            'koi_depth_err2': [-50.0],
            'koi_prad': [1.5],
            'koi_prad_err1': [0.2],
            'koi_prad_err2': [-0.2],
            'koi_teq': [280.0],
            'koi_teq_err1': [20.0],
            'koi_teq_err2': [-20.0],
            'koi_insol': [1.2],
            'koi_insol_err1': [0.1],
            'koi_insol_err2': [-0.1],
            'koi_model_snr': [15.0],
            'koi_tce_plnt_num': [1],
            'koi_steff': [5700.0],
            'koi_steff_err1': [100.0],
            'koi_steff_err2': [-100.0],
            'koi_slogg': [4.4],
            'koi_slogg_err1': [0.1],
            'koi_slogg_err2': [-0.1],
            'koi_srad': [1.0],
            'koi_srad_err1': [0.1],
            'koi_srad_err2': [-0.1],
            'kepoi_name': ['KOI-TEST.01'],
            'kepler_name': ['Test Planet b']
        })
        
        # Test the preprocessing pipeline
        # Set up global variables as the app would
        import app
        app.model = model_data['model']
        app.scaler = model_data['scaler']
        app.feature_names = model_data['feature_names']
        
        X_processed = app.preprocess_input_data(sample_data)
        prediction = model_data['model'].predict(X_processed)
        probability = model_data['model'].predict_proba(X_processed)[:, 1]
        
        print(f"✅ Prediction successful!")
        print(f"   Prediction: {'Exoplanet' if prediction[0] == 1 else 'Not Exoplanet'}")
        print(f"   Probability: {probability[0]:.3f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in prediction: {str(e)}")
        return False

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
            'koi_steff': [5700, 6000],
            'koi_srad': [1.0, 1.2],
            'koi_smass': [1.0, 1.1]
        })
        
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
        
        return True
        
    except Exception as e:
        print(f"❌ Error in habitability analysis: {str(e)}")
        return False

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
    
    if model_data and prediction_success and habitability_success:
        print("\n🎉 All tests passed! Integration is ready.")
        return True
    else:
        print("\n⚠️ Some tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)