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

// File handling - now reads CSV locally first
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

// Read CSV file locally and display preview
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

// Simple CSV line parser (handles basic CSV format)
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

// Show CSV preview to user
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

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Upload file to server (now called after user confirmation)
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
            }, 3000);
        } else {
            showError(data.message || 'Upload failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Network error. Please try again.');
    });
}

// Show processing success with ML results summary
function showProcessingSuccess(data) {
    hideAllSections();
    successSection.style.display = 'block';
    
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
                <p>🚀 Redirecting to 3D visualization in 3 seconds...</p>
            </div>
        </div>
    `;
}

// Show upload success (after backend processing)
function showUploadSuccess(data) {
    hideAllSections();
    successSection.style.display = 'block';
    
    fileDetails.innerHTML = `
        <div class="upload-success-header">
            <h3>✅ File Uploaded Successfully!</h3>
            <p>Your data has been processed and is ready for analysis.</p>
        </div>
        
        <div class="file-stats">
            <h4>📄 ${data.filename}</h4>
            <p><strong>Rows:</strong> ${data.rows.toLocaleString()}</p>
            <p><strong>Columns:</strong> ${data.columns}</p>
            <div class="column-list">
                <p><strong>Verified Column Names:</strong></p>
                <ul>
                    ${data.column_names.map(col => `<li>${col}</li>`).join('')}
                </ul>
            </div>
        </div>
        
        <div class="final-actions">
            <p>Your data is now ready for exoplanet analysis!</p>
        </div>
    `;
    
    // Update button text for final stage
    processBtn.textContent = 'Start Analysis';
    removeBtn.textContent = 'Upload Different File';
}

// UI state management
function showLoading() {
    hideAllSections();
    loadingSection.style.display = 'block';
}

function showError(message) {
    hideAllSections();
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

function showUploadForm() {
    hideAllSections();
    uploadSection.style.display = 'block';
    fileInfo.style.display = 'none';
    
    // Reset state
    currentFile = null;
    csvData = null;
    processBtn.textContent = 'Upload & Process';
    removeBtn.textContent = 'Choose Different File';
}

function hideAllSections() {
    uploadSection.style.display = 'none';
    loadingSection.style.display = 'none';
    successSection.style.display = 'none';
    errorSection.style.display = 'none';
}

// Event listeners
fileSelectBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

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