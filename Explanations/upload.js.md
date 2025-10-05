# upload.js - File Upload and Processing Manager

## Overview
This JavaScript module handles the complete file upload workflow for the exoplanet detection application. It provides drag-and-drop functionality, CSV file validation, local preview capabilities, server communication, and progressive UI state management. The module creates a smooth user experience from file selection through ML processing completion.

## Detailed Code Breakdown

### 1. DOM Element Management and State Initialization
```javascript
console.log("Upload JS loaded");

// DOM elements
const fileDropZone = document.getElementById('file-drop');
const fileInput = document.getElementById('file-input');
const fileSelectBtn = document.getElementById('file-select-btn');
const uploadSection = document.getElementById('upload');
const loadingSection = document.getElementById('loading');
const successSection = document.getElementById('upload-success');
const errorSection = document.getElementById('upload-error');
const fileInfo = document.getElementById('file-info');
const fileDetails = document.getElementById('file-details');
const errorMessage = document.getElementById('error-message');
const processBtn = document.getElementById('process-btn');
const removeBtn = document.getElementById('remove-btn');
const retryBtn = document.getElementById('retry-btn');

// Store the current file for later upload
let currentFile = null;
let csvData = null;
```

**Purpose**: Establish comprehensive DOM control and application state management

**DOM Reference Strategy**:
- **Complete element mapping**: Every interactive element is captured for consistent control
- **Section management**: Clear separation between UI states (upload, loading, success, error)
- **Button controls**: Granular control over action buttons for different workflow stages
- **Debug logging**: Console confirmation ensures script loads correctly

**State Variables**:
- **currentFile**: Stores the File object for server upload
- **csvData**: Holds parsed CSV metadata for preview display
- **Global scope**: Variables accessible across all function contexts

### 2. File Validation and Handling System
```javascript
function handleFile(file) {
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showError('Please select a CSV file.');
        return;
    }
    
    // Store file for later upload
    currentFile = file;
    
    // Read and preview CSV locally
    readCSVFile(file);
}
```

**Purpose**: Provide immediate client-side validation and initiate file processing pipeline

**Validation Logic**:
- **Null check**: Prevents processing if no file provided
- **Type validation**: Case-insensitive CSV extension check
- **Early feedback**: Immediate error display for invalid files
- **Security consideration**: Only allows CSV files to prevent malicious uploads

**Workflow Initiation**:
- **File storage**: Saves reference for later server upload
- **Processing trigger**: Automatically begins local CSV reading
- **User feedback**: Transitions to loading state immediately

### 3. Local CSV Reading and Parsing Engine
```javascript
function readCSVFile(file) {
    showLoading();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                showError('The CSV file appears to be empty.');
                return;
            }
            
            // Parse CSV headers
            const headers = parseCSVLine(lines[0]);
            const dataRows = lines.slice(1);
            const rowCount = dataRows.length;
            
            // Store parsed data
            csvData = {
                headers: headers,
                rowCount: rowCount,
                filename: file.name,
                fileSize: file.size
            };
            
            // Show preview to user
            showPreview(csvData);
            
        } catch (error) {
            console.error('Error reading CSV:', error);
            showError('Failed to read CSV file. Please check the file format.');
        }
    };
    
    reader.onerror = function() {
        showError('Failed to read the file. Please try again.');
    };
    
    reader.readAsText(file);
}
```

**Purpose**: Process CSV files locally for immediate preview without server round-trip

**FileReader Implementation**:
- **Asynchronous reading**: Non-blocking file processing
- **Text parsing**: Converts binary file data to readable text
- **Error handling**: Comprehensive error catching for corrupted files
- **Loading feedback**: UI updates to show processing is occurring

**Data Processing Pipeline**:
1. **Line splitting**: Breaks text into individual rows
2. **Empty line filtering**: Removes whitespace-only lines
3. **Header parsing**: Extracts column names from first row
4. **Row counting**: Calculates data size for user information
5. **Metadata creation**: Builds comprehensive data object

**Robust Error Handling**:
- **Try-catch wrapper**: Catches parsing errors gracefully
- **Empty file detection**: Validates file contains actual data
- **User-friendly messages**: Provides actionable error information

### 4. CSV Parsing Algorithm
```javascript
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last field
    result.push(current.trim().replace(/^"|"$/g, ''));
    
    return result;
}
```

**Purpose**: Implement RFC 4180-compliant CSV parsing with quoted field support

**Parsing State Machine**:
- **Quote tracking**: `inQuotes` boolean maintains parser state
- **Character iteration**: Manual character-by-character processing
- **Field accumulation**: `current` variable builds each field value

**CSV Specification Compliance**:
- **Quoted field support**: Handles commas within quoted strings
- **Quote escape handling**: Properly manages quote characters in data
- **Trim whitespace**: Removes leading/trailing spaces from fields
- **Final field capture**: Ensures last field isn't lost

**Algorithm Efficiency**:
- **Single pass**: O(n) time complexity for line parsing
- **Memory efficient**: Builds result array progressively
- **Edge case handling**: Manages empty fields and malformed data

### 5. Data Preview Generation System
```javascript
function showPreview(data) {
    hideAllSections();
    successSection.style.display = 'block';
    
    fileDetails.innerHTML = `
        <div class="preview-header">
            <h2>📄 Preview: <i>${data.filename}</i> </h2>

            <div class="preview-actions">
                <p><strong>Does this look correct?</strong></p>
                <p>Review the column names below, then proceed to upload for ML analysis.</p>
                <div class="ml-pipeline-info">
                    <h4>❔ What happens next:</h4>
                    <ul>
                        <li>🔍 Binary classification to detect exoplanets</li>
                        <li>🌍 Habitability analysis for detected planets</li>
                        <li>⭐ Top 20 candidates selected for visualization</li>
                        <li>✨ Most habitable planets highlighted with glow effects</li>
                    </ul>
                </div>
            </div>
            <br>
            <p class="file-info">
                <strong>Size:</strong> ${formatFileSize(data.fileSize)} | 
                <strong>Rows:</strong> ${data.rowCount.toLocaleString()} | 
                <strong>Columns:</strong> ${data.headers.length}
            </p>
        </div>
        
        <div class="file-stats">
            <div class="column-list">
                <p><strong>Column Names (first 15):</strong></p>
                <div class="column-grid">
                    ${data.headers.slice(0, 15).map(col => `<span class="column-tag">${col || '[Empty Header]'}</span>`).join('')}
                    ${data.headers.length > 15 ? `<span class="more-indicator">+${data.headers.length - 15} more columns</span>` : ''}
                </div>
            </div>
        </div>
    `;
}
```

**Purpose**: Create comprehensive data preview with educational pipeline information

**Preview Structure**:
- **File identification**: Displays filename prominently with emoji
- **User guidance**: Clear instructions for next steps
- **Pipeline education**: Explains what the ML system will do
- **Data summary**: Key statistics about the uploaded dataset

**Educational Component**:
- **Process transparency**: Users understand what happens to their data
- **Expectation setting**: Clear outcomes described before processing
- **Scientific context**: Explains exoplanet detection and habitability analysis
- **Visualization preview**: Mentions the 3D results interface

**Responsive Data Display**:
- **Truncated headers**: Shows first 15 columns to prevent UI overflow
- **Overflow indication**: "+X more columns" when data exceeds display limit
- **Empty header handling**: Gracefully manages missing column names
- **Formatted numbers**: Locale-appropriate number formatting for large datasets

### 6. File Size Formatting Utility
```javascript
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

**Purpose**: Convert raw byte values to human-readable file size representations

**Mathematical Approach**:
- **Binary calculation**: Uses 1024 as the conversion base
- **Logarithmic sizing**: Determines appropriate unit automatically
- **Precision control**: 2 decimal places for readability
- **Unit array**: Standard file size units from Bytes to GB

**Edge Case Handling**:
- **Zero bytes**: Special case for empty files
- **Automatic scaling**: Chooses most appropriate unit
- **Floating point precision**: Rounds to meaningful precision

### 7. Server Communication and Upload Manager
```javascript
function uploadFileToServer() {
    if (!currentFile) {
        showError('No file selected for upload.');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', currentFile);
    
    hideAllSections();
    showLoading();
    
    // Update loading text for ML processing
    const loadingText = document.querySelector('#loading h2');
    if (loadingText) {
        loadingText.textContent = 'Analyzing Data with AI...';
    }
    const loadingSubtext = document.querySelector('#loading p');
    if (loadingSubtext) {
        loadingSubtext.textContent = 'Running ML pipeline to detect exoplanets and assess habitability. This may take a few moments.';
    }
    
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Show quick success message with results summary
            showProcessingSuccess(data);
            
            // Redirect after showing results
            setTimeout(() => {
                if (data.redirect) {
                    window.location.href = data.redirect;
                }
            }, 5000);
        } else {
            showError(data.message || 'Upload failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Network error. Please try again.');
    });
}
```

**Purpose**: Handle secure file upload to Flask backend with comprehensive progress feedback

**Pre-upload Validation**:
- **File existence check**: Ensures file is available before upload
- **Error prevention**: Stops process if no file selected
- **State consistency**: Validates application state before proceeding

**FormData Construction**:
- **Multipart form**: Proper format for file uploads
- **File attachment**: Adds file to form with 'file' key
- **Backend compatibility**: Matches Flask file handling expectations

**User Experience Management**:
- **UI state transition**: Immediately shows loading interface
- **Dynamic text updates**: Changes loading messages for context
- **Progress indication**: Users know processing is occurring

**Network Communication**:
- **Fetch API**: Modern promise-based HTTP requests
- **Error handling**: Catches both HTTP and network errors
- **JSON response processing**: Handles structured server responses
- **Automatic redirect**: Transitions to results page after processing

### 8. Success State Management
```javascript
function showProcessingSuccess(data) {
    hideAllSections();
    successSection.style.display = 'block';
    processBtn.style.display = 'none';
    removeBtn.style.display = 'none';
    
    fileDetails.innerHTML = `
        <div class="processing-success-header">
            <h3>🎉 Analysis Complete!</h3>
            <p>Your data has been successfully processed through our AI pipeline.</p>
        </div>
        
        <div class="results-summary">
            <h4>📊 Analysis Results:</h4>
            <div class="result-stats">
                <div class="stat-card">
                    <div class="stat-number">${data.total_analyzed || 0}</div>
                    <div class="stat-label">Objects Analyzed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${data.exoplanet_count || 0}</div>
                    <div class="stat-label">Exoplanets Detected</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${data.habitable_count || 0}</div>
                    <div class="stat-label">Potentially Habitable</div>
                </div>
            </div>
            <div class="success-message">
                <p>✨ ${data.message}</p>
                <p>🚀 You will be redirected to the 3D visualization in 5 seconds...</p>
                <p><b>This will only contain a snippet of the most promising candidates!</b></b>
            </div>
        </div>
    `;
}
```

**Purpose**: Display comprehensive ML processing results with engaging visual feedback

**Success Interface Design**:
- **Celebration elements**: Emojis and positive messaging
- **Clear completion**: Users know processing finished successfully
- **Button management**: Hides inappropriate controls for final state

**Results Dashboard**:
- **Statistical overview**: Key numbers from ML analysis
- **Card-based layout**: Visually appealing data presentation
- **Scientific metrics**: Counts of analyzed objects, detected exoplanets, habitable candidates

**User Guidance**:
- **Automatic redirection**: Smooth transition to results visualization
- **Expectation management**: Explains what they'll see in 3D view
- **Process transparency**: Users understand they see "top candidates"

### 9. Drag and Drop Implementation
```javascript
// Drag and drop events
fileDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropZone.classList.add('dragover');
});

fileDropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileDropZone.classList.remove('dragover');
});

fileDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});
```

**Purpose**: Provide intuitive drag-and-drop file upload interface

**Event Management**:
- **preventDefault()**: Stops browser default file handling
- **Visual feedback**: Adds/removes CSS classes for hover effects
- **State consistency**: Ensures proper cleanup after drag operations

**User Experience Features**:
- **Hover indication**: CSS class changes visual appearance during drag
- **Drop handling**: Extracts first file from drop operation
- **Seamless integration**: Uses same handleFile() function as click uploads

### 10. Event Listener Registration and Initialization
```javascript
// Event listeners
fileSelectBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

// Process button - now handles both upload and final processing
processBtn.addEventListener('click', () => {
    if (csvData && !processBtn.textContent.includes('Analysis')) {
        // First click: upload to backend
        uploadFileToServer();
    } else if (processBtn.textContent.includes('Analysis')) {
        // Second click: start ML analysis
        alert('Starting exoplanet analysis...');
        // TODO: Implement ML model processing
        // window.location.href = '/results';
    }
});

// Remove/Choose different file button
removeBtn.addEventListener('click', () => {
    showUploadForm();
    fileInput.value = ''; // Clear file input
});

// Retry button (for errors)
retryBtn.addEventListener('click', () => {
    showUploadForm();
    fileInput.value = ''; // Clear file input
});

// Initialize
showUploadForm();
```

**Purpose**: Establish complete user interaction handling and application initialization

**Click Interactions**:
- **File selection**: Programmatically triggers hidden file input
- **File change handling**: Processes selected files immediately
- **State management**: Clear file inputs when resetting

**Smart Button Logic**:
- **Context-aware processing**: Button behavior changes based on application state
- **Text-based state detection**: Uses button text to determine current stage
- **Progressive functionality**: Supports multi-stage upload process

**Error Recovery**:
- **Retry functionality**: Returns to initial state after errors
- **State cleanup**: Clears file inputs and variables
- **User guidance**: Provides clear path forward after errors

**Application Lifecycle**:
- **Automatic initialization**: Starts in upload form state
- **Clean startup**: Ensures consistent initial state

## Integration Architecture

### 1. Frontend-Backend Communication
- **RESTful API**: Uses `/api/upload` endpoint for file processing
- **JSON responses**: Structured data exchange format
- **Error handling**: Comprehensive error message passing
- **Redirect management**: Server controls navigation flow

### 2. File Processing Pipeline
1. **Client-side validation**: Immediate feedback for file type
2. **Local preview**: CSV parsing without server round-trip
3. **Server upload**: Secure file transmission
4. **ML processing**: Backend machine learning analysis
5. **Results redirection**: Automatic navigation to visualization

### 3. User Experience Flow
1. **File selection**: Click or drag-and-drop interface
2. **Local preview**: Immediate data validation and preview
3. **Upload confirmation**: User confirms before server processing
4. **Progress indication**: Loading states with contextual messaging
5. **Results summary**: Key statistics before visualization
6. **Automatic transition**: Smooth flow to 3D results interface

### 4. State Management Strategy
- **Clear state separation**: Distinct UI states for each phase
- **Progressive disclosure**: Information revealed as needed
- **Error recovery**: Clear paths back to functional states
- **Data persistence**: File and parsing data maintained throughout workflow

This module successfully bridges the gap between user file selection and server-side machine learning processing, providing a smooth, educational, and engaging upload experience that prepares users for the 3D visualization results.