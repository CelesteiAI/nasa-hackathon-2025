# style.css - Main Application Stylesheet

## Overview
This stylesheet provides the visual design and user interface styling for the main CelestiAI application, particularly the home page upload interface. It implements a space-themed design with glassmorphism effects, smooth animations, and responsive layouts that work seamlessly over the 3D background canvas.

## Detailed Code Breakdown

### 1. Content Wrapper Base Styling
```css
#content-wrapper {
    color: white;
    padding: 40px;
}
```

**Purpose**: Establish base styling for all content that appears over the 3D background

**Design Decisions**:
- **White text**: Ensures readability over dark space background
- **Generous padding**: 40px provides comfortable spacing on all sides
- **Color inheritance**: Child elements inherit white text by default

### 2. Typography Hierarchy
```css
h1 {
    font-size: 3em;
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
    margin-bottom: 20px;
}

h2, h3 {
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
    margin: 15px 0;
}
```

**Purpose**: Create clear visual hierarchy with enhanced readability

**Heading Design**:
- **Large H1**: 3em creates commanding presence for main title
- **Text shadows**: Heavy shadows ensure readability over complex 3D backgrounds
- **Graduated shadows**: H1 has stronger shadow (8px) than H2/H3 (6px)
- **Consistent spacing**: Predictable margins for visual rhythm

**Accessibility Benefits**:
- **High contrast**: Text shadows provide definition against any background
- **Clear hierarchy**: Size differences help screen readers understand structure
- **Readable sizes**: Large enough for various visual abilities

### 3. File Drop Zone Styling
```css
#file-drop {
    background: rgba(0, 0, 0, 0.6);
    border: 3px dashed rgba(255, 255, 255, 0.5);
    border-radius: 15px;
    padding: 40px;
    margin: 20px auto;
    max-width: 600px;
    text-align: center;
    transition: all 0.3s;
    backdrop-filter: blur(10px);
    cursor: pointer;
}
```

**Purpose**: Create an attractive, functional drag-and-drop interface

**Glassmorphism Design**:
- **Semi-transparent background**: `rgba(0, 0, 0, 0.6)` creates depth
- **Backdrop blur**: `backdrop-filter: blur(10px)` blurs background content
- **Dashed border**: Visual indication of drop zone functionality
- **Rounded corners**: Modern, friendly appearance

**User Experience Features**:
- **Centered layout**: `margin: 20px auto` centers the drop zone
- **Maximum width**: 600px prevents excessive stretching on large screens
- **Smooth transitions**: 0.3s transition for all property changes
- **Pointer cursor**: Indicates interactive element

### 4. Interactive States for File Drop
```css
#file-drop:hover {
    background: rgba(0, 0, 0, 0.7);
    border-color: rgba(255, 255, 255, 0.8);
}

#file-drop.dragover {
    background: rgba(74, 144, 226, 0.3);
    border-color: #4a90e2;
    transform: scale(1.02);
}
```

**Purpose**: Provide clear visual feedback for user interactions

**Hover State**:
- **Darker background**: Indicates interactivity
- **Brighter border**: Enhanced visibility on hover
- **Subtle feedback**: Encourages user interaction

**Drag-over State**:
- **Blue highlight**: `#4a90e2` brand color indicates active drop zone
- **Scale transform**: 1.02 scale creates "lifting" effect
- **Color change**: Blue background clearly shows drop readiness

### 5. Button Styling System
```css
#file-select-btn {
    background: #4a90e2;
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 8px;
    font-size: 1.1em;
    cursor: pointer;
    transition: all 0.3s;
    margin-top: 15px;
}

#file-select-btn:hover {
    background: #357abd;
    transform: translateY(-2px);
}
```

**Purpose**: Create consistent, attractive button interface

**Primary Button Design**:
- **Brand color**: `#4a90e2` establishes visual identity
- **Generous padding**: 12px vertical, 30px horizontal for touch-friendly targets
- **Rounded corners**: Modern appearance with 8px radius
- **Readable text**: 1.1em size ensures clarity

**Hover Interactions**:
- **Color darkening**: `#357abd` darker blue on hover
- **Lift effect**: `translateY(-2px)` creates engaging interaction
- **Smooth animation**: 0.3s transition for polished feel

### 6. Loading Interface Styling
```css
#loading {
    display: none;
    text-align: center;
    padding: 40px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 15px;
    margin: 20px auto;
    max-width: 400px;
    backdrop-filter: blur(10px);
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(255, 255, 255, 0.3);
    border-top: 5px solid #4a90e2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

**Purpose**: Provide engaging loading feedback during file processing

**Loading Container**:
- **Initially hidden**: `display: none` until activated by JavaScript
- **Glassmorphism**: Semi-transparent background with backdrop blur
- **Centered layout**: Auto margins and text-align center
- **Appropriate sizing**: Max-width prevents excessive stretching

**Spinner Animation**:
- **CSS-only animation**: No JavaScript required for smooth rotation
- **Brand colors**: Blue accent on white base
- **Smooth rotation**: 1 second linear infinite rotation
- **Perfect circle**: 50% border-radius creates circular spinner

### 7. State-Based Interface Styling
```css
#upload-success, #upload-error {
    display: none;
    text-align: center;
    padding: 40px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 15px;
    margin: 20px auto;
    max-width: 600px;
    backdrop-filter: blur(10px);
}

#upload-success {
    border: 2px solid #28a745;
}

#upload-error {
    border: 2px solid #dc3545;
}
```

**Purpose**: Provide clear visual feedback for different application states

**Shared Base Styling**:
- **Consistent layout**: Same dimensions and positioning across states
- **Glassmorphism**: Maintains visual consistency with rest of interface
- **Initially hidden**: JavaScript controls visibility based on state

**Color-Coded Borders**:
- **Success green**: `#28a745` indicates successful operations
- **Error red**: `#dc3545` clearly indicates problems
- **Visual communication**: Instant understanding without reading text

### 8. File Information Display
```css
.file-stats {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
    text-align: left;
}

.file-stats h3, .file-stats h4 {
    text-align: center;
    margin-bottom: 15px;
    color: #4a90e2;
}

.file-info {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9em;
    margin: 0;
}
```

**Purpose**: Display uploaded file information in organized, readable format

**Information Container**:
- **Subtle background**: Light white overlay distinguishes content area
- **Rounded corners**: Consistent with overall design language
- **Left-aligned text**: Easier reading for detailed information

**Information Hierarchy**:
- **Colored headers**: Blue headers draw attention to sections
- **Subdued text**: Slightly transparent white for secondary information
- **Appropriate sizing**: Smaller text for detailed information

### 9. Column Display System
```css
.column-list ul {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 5px;
    list-style: none;
    padding: 0;
    margin: 10px 0;
}

.column-list li {
    background: rgba(255, 255, 255, 0.1);
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 0.9em;
}
```

**Purpose**: Display CSV column names in organized, responsive grid

**CSS Grid Layout**:
- **Responsive columns**: `auto-fit` adapts to available space
- **Minimum width**: 200px prevents columns from becoming too narrow
- **Flexible sizing**: `1fr` allows columns to grow equally
- **Clean spacing**: 5px gap between items

**Visual Design**:
- **Subtle backgrounds**: Light overlays distinguish individual columns
- **Consistent styling**: Matches file-stats container design
- **Readable text**: Appropriate sizing for scanning column names

### 10. Enhanced Column Tag System
```css
.column-tag {
    display: inline-block;
    background: rgba(74, 144, 226, 0.2);
    color: #4a90e2;
    padding: 4px 8px;
    margin: 2px;
    border-radius: 12px;
    font-size: 12px;
    border: 1px solid rgba(74, 144, 226, 0.3);
}

.column-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}
```

**Purpose**: Create modern tag-style display for CSV columns

**Tag Design**:
- **Pill shape**: 12px border-radius creates modern tag appearance
- **Brand colors**: Blue theme maintains consistency
- **Subtle borders**: Defines tag boundaries without heaviness
- **Compact sizing**: Small text and padding for efficient space use

**Flexible Layout**:
- **Flexbox wrapping**: Tags wrap to new lines as needed
- **Consistent spacing**: 6px gap between all tags
- **Responsive design**: Adapts to different container widths

### 11. Machine Learning Pipeline Information
```css
.ml-pipeline-info {
    background: rgba(74, 144, 226, 0.1);
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
    border: 1px solid rgba(74, 144, 226, 0.2);
}

.ml-pipeline-info h4 {
    color: #4a90e2;
    margin-bottom: 8px;
    font-size: 14px;
}

.ml-pipeline-info li {
    margin: 4px 0;
    color: #ffffff;
    font-size: 13px;
}
```

**Purpose**: Display technical information about the ML processing pipeline

**Information Container**:
- **Branded background**: Light blue tint indicates technical content
- **Subtle border**: Defines area without overwhelming other content
- **Appropriate sizing**: Compact but readable formatting

**Typography Hierarchy**:
- **Colored headers**: Blue headers organize information sections
- **Readable lists**: White text on blue background ensures legibility
- **Compact sizing**: Smaller text appropriate for technical details

### 12. Results Statistics Display
```css
.result-stats {
    display: flex;
    gap: 16px;
    margin: 16px 0;
    justify-content: center;
}

.stat-card {
    background: linear-gradient(135deg, #4a90e2, #357abd);
    color: white;
    padding: 16px;
    border-radius: 8px;
    text-align: center;
    min-width: 120px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.stat-number {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 12px;
    opacity: 0.9;
}
```

**Purpose**: Display key statistics about analysis results in visually appealing cards

**Card Layout**:
- **Flexbox arrangement**: Even spacing and alignment
- **Centered display**: `justify-content: center` creates balanced layout
- **Consistent spacing**: 16px gap between cards

**Card Design**:
- **Gradient backgrounds**: Modern visual appeal with brand colors
- **Drop shadows**: Subtle depth effect
- **Minimum width**: Ensures consistent card sizes
- **Rounded corners**: Consistent with overall design language

**Information Hierarchy**:
- **Large numbers**: 24px bold text emphasizes key statistics
- **Descriptive labels**: Smaller text provides context
- **High contrast**: White text on blue gradient ensures readability

### 13. Success Message Styling
```css
.success-message {
    background: rgba(76, 175, 80, 0.1);
    padding: 16px;
    border-radius: 8px;
    margin-top: 16px;
    border: 1px solid rgba(76, 175, 80, 0.2);
    text-align: center;
}

.success-message p {
    margin: 8px 0;
    color: #2e7d32;
    font-weight: 500;
}
```

**Purpose**: Provide clear, positive feedback for successful operations

**Visual Design**:
- **Green color scheme**: Universally understood success indicator
- **Subtle background**: Light green tint without overwhelming content
- **Clear borders**: Define message area with appropriate color
- **Centered text**: Focuses attention on success message

**Typography**:
- **Medium font weight**: 500 weight provides emphasis without heaviness
- **Green text color**: Reinforces positive message
- **Appropriate spacing**: 8px margins prevent crowding

## Design Philosophy

### 1. Glassmorphism Aesthetic
- **Semi-transparent backgrounds**: Create depth and modern appearance
- **Backdrop blur effects**: Integrate smoothly with 3D background
- **Layered visual hierarchy**: Clear content organization over complex backgrounds

### 2. Space Theme Integration
- **Dark color palette**: Black and blue tones evoke space environment
- **White text**: High contrast for readability in space-themed interface
- **Smooth animations**: Fluid interactions enhance the futuristic feel

### 3. User Experience Focus
- **Clear visual feedback**: Every interaction provides immediate response
- **Consistent styling**: Predictable interface patterns throughout
- **Accessibility considerations**: High contrast and readable text sizes

### 4. Responsive Design Principles
- **Flexible layouts**: CSS Grid and Flexbox adapt to different screen sizes
- **Appropriate sizing**: Elements scale well from mobile to desktop
- **Touch-friendly targets**: Button sizes accommodate touch interaction

## Performance Considerations

### 1. CSS Efficiency
- **Hardware acceleration**: Transform and filter properties use GPU
- **Efficient selectors**: Avoid overly complex CSS selectors
- **Minimal reflows**: Properties that don't affect layout preferred

### 2. Animation Performance
- **CSS animations**: Prefer CSS over JavaScript for smooth performance
- **Transform properties**: Use transform instead of changing layout properties
- **Reasonable duration**: 0.3s transitions balance smoothness with responsiveness

### 3. Browser Compatibility
- **Modern CSS features**: Backdrop-filter and CSS Grid for enhanced browsers
- **Graceful degradation**: Interface works without advanced effects
- **Vendor prefixes**: Where needed for broader browser support

This stylesheet successfully creates a cohesive, modern interface that enhances the scientific application with engaging visual design while maintaining excellent usability and accessibility standards.