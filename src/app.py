#!/usr/bin/env python3
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home(): # Home page (file upload option)
    return render_template('index.html')

@app.route('/results')
def results(): # Page to display results
    return render_template('results.html')

@app.route('/api/upload', methods=['POST'])
def upload(): # Endpoint for file upload
    return {'status': 'success'}

@app.route('/api/get_results', methods=['GET'])
def get_results(): # get processed data from ML model
    return {'results': []}


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)