#!/usr/bin/env python3
import os
import pandas as pd
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
# from model import showresult

app = Flask(__name__)
# app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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

    # 1. Read file from request
    # 2. Validate file type and format
    # 3. Save file to server
    # 4. Return success or error response

    # At some point, we will also trigger ML model processing here

    try:
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'status': 'error', 'message': 'Only CSV files are allowed'}), 400
        
        if file:
            # Save file to directory
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Validate CSV format
            try:
                df = pd.read_csv(filepath)
                row_count = len(df)
                col_count = len(df.columns)
                
                print(f"CSV uploaded successfully: {filename}")
                print(f"Rows: {row_count}, Columns: {col_count}")
                print(f"Columns: {list(df.columns)}")
                
                return jsonify({
                    'status': 'success', 
                    'message': 'File uploaded successfully',
                    "redirect": "/results"
                    # 'filename': filename,
                    # 'rows': row_count,
                    # 'columns': col_count,
                    # 'column_names': list(df.columns)
                })
                
            except Exception as e:
                os.remove(filepath)  # Clean up invalid file
                return jsonify({'status': 'error', 'message': f'Invalid CSV format: {str(e)}'}), 400
                
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Upload failed: {str(e)}'}), 500

@app.route('/api/get_results', methods=['GET'])
def get_results(): # get processed data from ML model
    return {'results': []}


if __name__ == '__main__':
    model_path = '../Models/best_exoplanet_model (3).pkl'
    data_path = '../data/cumulative_exoplanets.csv'
    # showresult(model_path, data_path)
    app.run(host='0.0.0.0', port=8080, debug=True)