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
const retryBtn = document.getElementById('retry-btn');

// File upload handling
function handleFile(file) {
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showError('Please select a CSV file.');
        return;
    }
    
    // Validate file size (16MB limit)
    if (file.size > 16 * 1024 * 1024) {
        showError('File size must be less than 16MB.');
        return;
    }
    
    uploadFile(file);
}

// Upload file to server
function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    showLoading();
    
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccess(data);
        } else {
            showError(data.message || 'Upload failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Network error. Please try again.');
    });
}

// UI state management
function showLoading() {
    hideAllSections();
    loadingSection.style.display = 'block';
}

function showSuccess(data) {
    hideAllSections();
    successSection.style.display = 'block';
    
    fileDetails.innerHTML = `
        <div class="file-stats">
            <h3>📄 ${data.filename}</h3>
            <p><strong>Rows:</strong> ${data.rows.toLocaleString()}</p>
            <p><strong>Columns:</strong> ${data.columns}</p>
            <div class="column-list">
                <p><strong>Column Names:</strong></p>
                <ul>
                    ${data.column_names.map(col => `<li>${col}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
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

// Process button (placeholder for ML processing)
processBtn.addEventListener('click', () => {
    alert('ML processing would start here!');
    // TODO: Implement ML model processing
    // window.location.href = '/results';
});

// Retry button
retryBtn.addEventListener('click', () => {
    showUploadForm();
    fileInput.value = ''; // Clear file input
});

// Initialize
showUploadForm();