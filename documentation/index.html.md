# index.html - Home Page Template for CelestiAI

## Overview
This is the main landing page template for the CelestiAI exoplanet detection application. It provides a user-friendly interface for uploading telescope data (CSV files) and initiates the machine learning analysis pipeline. The page features a space-themed design with 3D solar system visualization and interactive file upload functionality.

## Detailed Code Breakdown

### 1. Template Inheritance and Meta Information
```html
{% extends 'base.html' %}

{% block head %}
<title>Home Page - CelestiAI</title>
<link rel="stylesheet" href="{{url_for('static', filename='css/style.css')}}">
{% endblock %}
```

**Purpose**: Extend base template and define page-specific head content

**Template Inheritance**:
- **`{% extends 'base.html' %}`**: Inherits the base template structure
- **Benefits**: Gets 3D canvas background, CSS reset, and responsive foundation
- **Clean inheritance**: Only adds page-specific content without duplicating base code

**Page Title**:
- **SEO-friendly**: Clear, descriptive title for search engines and browser tabs
- **Branding**: Includes "CelestiAI" name for brand recognition
- **Context**: "Home Page" indicates this is the main entry point

**Stylesheet Integration**:
- **Flask URL generation**: `url_for('static', filename='css/style.css')`
- **Dynamic URLs**: Flask generates correct URLs regardless of deployment configuration
- **Cache-busting support**: Flask can add version parameters if configured

### 2. Main Upload Interface Structure
```html
{% block body %}
<div id="upload" style="margin-top: 40px;">
    <h1>Welcome to CelestiAI</h1>
    <h2>Please enter your telescope data below</h2>
    <div id="file-drop">
        <p>Drag & drop your CSV file here</p>
        <p><strong>or</strong></p>
        <button id="file-select-btn" type="button">Choose File</button>
        <input type="file" id="file-input" accept=".csv" style="display: none;">
    </div>
    <div id="file-info" style="display: none;"></div>
</div>
```

**Purpose**: Create the primary file upload interface with dual input methods

**Welcome Section**:
- **Brand Introduction**: "Welcome to CelestiAI" establishes application identity
- **Clear Instructions**: Tells users exactly what they need to do
- **Scientific Context**: "telescope data" immediately conveys the application's purpose

**Dual Upload Interface**:
1. **Drag & Drop Zone**: `#file-drop` div provides visual drop target
   - **User-friendly**: Modern interface pattern users expect
   - **Visual feedback**: CSS styling makes drop zone obvious
   - **Accessibility**: Includes text instructions for screen readers

2. **Traditional File Browser**: Hidden file input with button trigger
   - **`accept=".csv"`**: Restricts file picker to CSV files only
   - **Hidden input**: `style="display: none;"` keeps actual input invisible
   - **Custom button**: `#file-select-btn` provides styled interface

**Information Display**:
- **`#file-info`**: Initially hidden div for displaying file details
- **Dynamic visibility**: JavaScript will show/hide based on file selection
- **User feedback**: Confirms successful file selection

### 3. Loading State Interface
```html
<div id="loading" style="display: none;">
    <div class="spinner"></div>
    <h2>Processing your data...</h2>
    <p>Please wait while we analyze your telescope data</p>
</div>
```

**Purpose**: Provide visual feedback during data processing

**Loading Animation**:
- **Spinner element**: CSS-animated loading indicator
- **Visual feedback**: Reassures users that processing is happening
- **Professional appearance**: Maintains user confidence during wait times

**Informative Text**:
- **Clear status**: "Processing your data..." explains what's happening
- **Context-specific**: "telescope data" reminds users of the application domain
- **Patience guidance**: "Please wait" sets expectations for processing time

**Initially Hidden**:
- **`display: none`**: Hidden until JavaScript activates loading state
- **State management**: Only visible during actual processing

### 4. Success State Interface
```html
<div id="upload-success" style="display: none;">
    <!-- <h2>Data Preview</h2> -->
    <div id="file-details"></div>
    <button id="process-btn">Process Data</button>
    <button id="remove-btn">Remove Data</button>
</div>
```

**Purpose**: Show successful upload and provide next-step options

**File Details Display**:
- **`#file-details`**: Container for dynamic file information
- **JavaScript population**: Will be filled with file name, size, row count, etc.
- **User confirmation**: Shows users exactly what was uploaded

**Action Buttons**:
1. **Process Button**: `#process-btn` starts ML analysis
   - **Primary action**: Most likely user choice after upload
   - **Clear labeling**: "Process Data" explains what happens next

2. **Remove Button**: `#remove-btn` allows starting over
   - **Secondary action**: Safety option if wrong file uploaded
   - **User control**: Lets users correct mistakes easily

**Commented Preview**:
- **Future enhancement**: Commented "Data Preview" header suggests possible expansion
- **Scalability**: Could add CSV preview functionality later

### 5. Error State Interface
```html
<div id="upload-error" style="display: none;">
    <h2>❌ Upload Failed</h2>
    <div id="error-message"></div>
    <button id="retry-btn">Try Again</button>
</div>
```

**Purpose**: Handle upload failures gracefully with clear error communication

**Error Indication**:
- **Visual symbol**: ❌ emoji provides immediate visual error recognition
- **Clear message**: "Upload Failed" explains what happened
- **Professional tone**: Maintains user confidence while reporting problems

**Error Details**:
- **`#error-message`**: Container for specific error information
- **JavaScript population**: Will contain detailed error messages from server
- **Debugging aid**: Helps users understand what went wrong

**Recovery Action**:
- **Retry button**: `#retry-btn` allows users to attempt upload again
- **User empowerment**: Gives users control to fix issues
- **Optimistic design**: Assumes problems can be resolved

### 6. Three.js Module Import Configuration
```html
<script type="importmap">
{
    "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
        "three/examples/jsm/controls/OrbitControls": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js"
    }
}
</script>
```

**Purpose**: Configure ES6 module imports for Three.js 3D graphics library

**Import Map Standard**:
- **Modern browser feature**: Allows clean module imports without bundlers
- **CDN integration**: Loads Three.js directly from jsdelivr CDN
- **Version pinning**: Specific version (0.160.0) ensures consistency

**Three.js Core**:
- **Main library**: Core Three.js functionality for 3D rendering
- **ES6 modules**: Modern JavaScript module system
- **Performance**: Only loads needed functionality

**Orbit Controls**:
- **Camera control**: Allows users to navigate 3D space with mouse/touch
- **User interaction**: Essential for exploring 3D solar system visualization
- **Standard component**: Official Three.js extension for camera controls

### 7. JavaScript Integration
```html
<script type="module" src="{{ url_for('static', filename='js/solar-system.js') }}"></script>
<script src="{{ url_for('static', filename='js/upload.js') }}"></script>
```

**Purpose**: Load page functionality through separate JavaScript modules

**Solar System Visualization**:
- **ES6 module**: `type="module"` enables import/export syntax
- **3D background**: Creates animated solar system behind UI
- **Flask URL generation**: Dynamic path resolution for deployment flexibility

**Upload Functionality**:
- **Traditional script**: Standard JavaScript loading for upload logic
- **File handling**: Manages drag/drop, file validation, and AJAX communication
- **UI state management**: Controls visibility of different interface states

## User Experience Flow

### 1. Initial Landing
1. **Visual Impact**: User sees 3D solar system animation background
2. **Clear Purpose**: Welcome message and instructions immediately explain the app
3. **Action Options**: Two upload methods accommodate different user preferences

### 2. File Upload Process
1. **File Selection**: User drags file or clicks to browse
2. **Validation**: JavaScript validates file type and size
3. **Feedback**: Success state shows file details and next steps

### 3. Data Processing
1. **Loading State**: Spinner and message indicate processing
2. **Server Communication**: AJAX sends file to Flask backend
3. **ML Pipeline**: Server runs exoplanet detection and habitability analysis

### 4. Result Navigation
1. **Success Response**: Server returns analysis results
2. **Page Redirect**: User redirected to results visualization page
3. **Error Handling**: Any failures show clear error messages

## Accessibility Features

### 1. Semantic HTML
- **Proper headings**: H1 and H2 structure content hierarchy
- **Descriptive text**: Clear instructions for all interface elements
- **Button semantics**: Proper button elements for interactive components

### 2. Keyboard Navigation
- **Tab order**: Logical navigation through upload interface
- **Button access**: All interactive elements accessible via keyboard
- **Focus management**: Visual focus indicators for keyboard users

### 3. Screen Reader Support
- **Text alternatives**: All functionality described in text
- **State announcements**: Dynamic content changes announced to screen readers
- **Clear labels**: All form elements have descriptive labels

## Progressive Enhancement

### 1. Core Functionality
- **Basic upload**: File input works without JavaScript
- **Form submission**: Server can handle traditional form posts
- **Graceful degradation**: Essential features work in any browser

### 2. Enhanced Experience
- **Drag & drop**: Modern browsers get enhanced upload interface
- **3D visualization**: WebGL-capable browsers show solar system animation
- **AJAX communication**: JavaScript handles seamless data exchange

### 3. Mobile Optimization
- **Responsive design**: Interface adapts to mobile screen sizes
- **Touch-friendly**: Upload targets sized appropriately for touch interaction
- **Performance**: 3D animation optimized for mobile devices

## Integration with Backend

### 1. Flask Route Communication
- **Upload endpoint**: `/api/upload` receives and processes files
- **Response handling**: JavaScript processes JSON responses
- **Error management**: Server errors displayed in user-friendly format

### 2. File Processing Pipeline
1. **Upload validation**: Server validates file format and content
2. **ML processing**: Data passed through exoplanet detection model
3. **Habitability analysis**: Results processed for scientific classification
4. **Result formatting**: Data prepared for visualization interface

### 3. Session Management
- **Result storage**: Processed data stored for results page access
- **User journey**: Seamless transition from upload to results viewing
- **Error recovery**: Failed uploads don't disrupt user session

This home page template provides an intuitive, accessible, and scientifically-themed entry point to the CelestiAI exoplanet detection system, successfully bridging user-friendly design with sophisticated astronomical data analysis capabilities.