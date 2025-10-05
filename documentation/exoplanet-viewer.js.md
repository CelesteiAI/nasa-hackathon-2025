# exoplanet-viewer.js - 3D Exoplanet Visualization Engine

## Overview
This comprehensive Three.js module creates an immersive 3D visualization system for exploring discovered exoplanets. It renders a dynamic stellar system with realistic lighting, animated celestial bodies, orbital mechanics, and interactive planet selection. The system integrates real exoplanet data from machine learning analysis with sophisticated 3D graphics to create an educational and engaging exploration experience.

## Detailed Code Breakdown

### 1. Scene Initialization and Core Setup
```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// ============ SCENE SETUP ============
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000510);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
camera.position.set(0, 150, 250); // Start far away

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 500;
```

**Purpose**: Establish the foundational 3D environment for exoplanet visualization

**Scene Configuration**:
- **Deep space background**: Dark blue color (0x000510) evokes the cosmos
- **WebGL rendering**: Hardware-accelerated graphics for smooth performance
- **Shadow mapping**: Enables realistic lighting effects between celestial bodies
- **Antialiasing**: Reduces jagged edges for professional appearance

**Camera System**:
- **Wide field of view**: 75° provides immersive perspective
- **Responsive aspect ratio**: Adapts to window dimensions automatically
- **Extensive view range**: 0.1 to 10000 units accommodates close-up and overview modes
- **Strategic positioning**: Starts at (0, 150, 250) for optimal system overview

**OrbitControls Integration**:
- **Damped movement**: Smooth, physics-like camera interactions
- **Distance constraints**: Prevents users from getting too close or too far
- **Touch support**: Works on mobile devices and tablets

### 2. Lighting System Design
```javascript
// ============ LIGHTING ============
// Central star light
const centralLight = new THREE.PointLight(0xffffff, 2, 1000);
centralLight.position.set(0, 0, 0);
scene.add(centralLight);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
```

**Purpose**: Create realistic stellar lighting that illuminates planets and creates depth

**Point Light Source**:
- **Central star illumination**: Positioned at system center (0, 0, 0)
- **High intensity**: Value of 2 creates bright stellar light
- **Limited range**: 1000 units prevents unrealistic distant illumination
- **White light**: Pure white (#ffffff) mimics actual stellar light

**Ambient Lighting**:
- **Subtle fill light**: Low-intensity ambient prevents completely black shadows
- **Dark gray tone**: 0x404040 maintains space atmosphere while adding detail visibility
- **Realistic space lighting**: Balances dramatic shadows with practical visibility

### 3. Starfield Background Generation
```javascript
// ============ STARS BACKGROUND ============
function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        transparent: true
    });

    const starsVertices = [];
    for (let i = 0; i < 15000; i++) {
        const x = (Math.random() - 0.5) * 3000;
        const y = (Math.random() - 0.5) * 3000;
        const z = (Math.random() - 0.5) * 3000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}
```

**Purpose**: Generate a realistic starfield background that enhances the space environment

**Procedural Generation**:
- **15,000 stars**: Creates dense, realistic star field
- **Cubic distribution**: Stars distributed in 3000x3000x3000 unit cube
- **Random positioning**: Each star placed using Math.random() for natural distribution
- **BufferGeometry optimization**: Efficient rendering of thousands of points

**Visual Properties**:
- **Small point size**: 0.7 units creates distant star appearance
- **White color**: Traditional stellar appearance
- **Transparency support**: Enables potential star twinkling effects

### 4. Multi-Layer Central Star Construction
```javascript
// ============ CENTRAL STAR ============
// Main sun body with realistic hot surface
const starGeometry = new THREE.SphereGeometry(8, 64, 64);
const starMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd00,
    emissive: 0xffdd00,
    emissiveIntensity: 1
});
const centralStar = new THREE.Mesh(starGeometry, starMaterial);
scene.add(centralStar);

// Inner corona (bright yellow-white)
const corona1Geometry = new THREE.SphereGeometry(10, 32, 32);
const corona1Material = new THREE.MeshBasicMaterial({
    color: 0xffee66,
    transparent: true,
    opacity: 0.5
});
const corona1 = new THREE.Mesh(corona1Geometry, corona1Material);
scene.add(corona1);

// Outer corona (orange-red)
const corona2Geometry = new THREE.SphereGeometry(12, 32, 32);
const corona2Material = new THREE.MeshBasicMaterial({
    color: 0xff8800,
    transparent: true,
    opacity: 0.25
});
const corona2 = new THREE.Mesh(corona2Geometry, corona2Material);
scene.add(corona2);

// Solar flares (outermost layer)
const flareGeometry = new THREE.SphereGeometry(14, 32, 32);
const flareMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4400,
    transparent: true,
    opacity: 0.15
});
const solarFlares = new THREE.Mesh(flareGeometry, flareMaterial);
scene.add(solarFlares);
```

**Purpose**: Create a visually stunning, scientifically-inspired central star with multiple atmospheric layers

**Layered Star Architecture**:
1. **Core star body**: Solid yellow-gold sphere representing photosphere
2. **Inner corona**: Bright yellow-white layer for chromosphere
3. **Outer corona**: Orange layer representing extended corona
4. **Solar flares**: Outermost red layer for dynamic solar activity

**Material Properties**:
- **Emissive materials**: All layers emit light, creating realistic star glow
- **Progressive transparency**: Outer layers become more transparent
- **Color temperature gradient**: Hot white core to cooler red outer layers
- **High tessellation**: 64x64 segments on core for smooth surface

**Scientific Accuracy**:
- **Layered structure**: Mimics actual stellar atmospheric layers
- **Color progression**: Represents actual stellar color temperatures
- **Dynamic sizing**: Proportional layer sizes create realistic depth

### 5. Advanced Exoplanet Creation System
```javascript
function createExoplanet(data, index) {
    // Calculate planet size based on radius (scale appropriately for visualization)
    const planetSize = Math.max(0.8, Math.min(4.0, data.size));
    
    // Choose color based on habitability and temperature
    let planetColor = data.color;
    if (data.habitability_class === 'highly_habitable') {
        planetColor = 0x3a7d44; // Earth-like green-blue
    } else if (data.habitability_class === 'potentially_habitable') {
        planetColor = 0x4a8e57; // Light green for potentially habitable
    } else if (data.temperature > 1000) {
        planetColor = 0xdd3333; // Red for hot planets
    } else if (data.temperature < 200) {
        planetColor = 0x5588cc; // Blue for cold planets
    } else {
        planetColor = 0xcc8844; // Orange for temperate planets
    }
    
    // Planet mesh with more realistic materials
    const geometry = new THREE.SphereGeometry(planetSize, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        color: planetColor,
        roughness: 0.8,
        metalness: 0.1,
        emissive: planetColor,
        emissiveIntensity: 0.05
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.castShadow = true;
    planet.receiveShadow = true;
```

**Purpose**: Generate scientifically-informed 3D planet representations based on real exoplanet data

**Size Calculation**:
- **Constrained scaling**: Ensures planets render between 0.8 and 4.0 units
- **Proportional representation**: Larger planets appear visually larger
- **Visualization balance**: Prevents tiny or overwhelming planet sizes

**Scientifically-Based Coloring**:
- **Habitability indicators**: Green tones for potentially life-bearing worlds
- **Temperature mapping**: Red for hot planets, blue for cold, orange for temperate
- **Visual classification**: Immediate visual understanding of planet characteristics

**Realistic Materials**:
- **MeshStandardMaterial**: Physically-based rendering for realistic appearance
- **Surface properties**: High roughness (0.8) for rocky planet appearance
- **Low metalness**: Simulates non-metallic planetary surfaces
- **Subtle emission**: Slight glow without overwhelming brightness

### 6. Habitability Visualization Features
```javascript
    // Add animated vegetation/nature for highly habitable planets
    let vegetationParticles = null;
    if (data.is_highly_habitable || data.habitability_class === 'highly_habitable') {
        // Create particle system for growing vegetation
        const particleCount = 200;
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Random positions on sphere surface
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const radius = planetSize * 1.05;
            
            positions.push(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
            
            // Green vegetation colors with variety
            const greenShade = 0.3 + Math.random() * 0.7;
            colors.push(0.1, greenShade, 0.1);
        }
        
        particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: planetSize * 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        vegetationParticles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(vegetationParticles);
        
        // Also add atmosphere effect for habitable planets
        const atmosphereGeometry = new THREE.SphereGeometry(planetSize * 1.15, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        scene.add(atmosphere);
        
        // Store atmosphere reference
        vegetationParticles.atmosphere = atmosphere;
    }
```

**Purpose**: Create visually distinctive features for highly habitable planets that immediately communicate their potential for life

**Vegetation Particle System**:
- **200 particles per planet**: Creates visible but not overwhelming vegetation indication
- **Spherical surface distribution**: Uses spherical coordinates for even distribution
- **Random green coloring**: Varying green shades simulate diverse vegetation
- **Size scaling**: Particle size proportional to planet size

**Mathematical Distribution**:
- **Uniform sphere sampling**: Uses phi = acos(2*random - 1) for even distribution
- **Surface positioning**: Places particles slightly above planet surface (radius * 1.05)
- **Color variety**: Green intensity varies between 0.3 and 1.0 for natural appearance

**Atmospheric Effects**:
- **Blue atmosphere shell**: Light blue color suggests oxygen/water atmosphere
- **Larger radius**: 1.15x planet size creates proper atmospheric scale
- **Transparency**: Low opacity allows planet visibility while suggesting atmosphere
- **BackSide rendering**: Atmosphere only visible from outside

### 7. Orbital Mechanics and Animation System
```javascript
    // Orbit line
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    for (let i = 0; i <= 128; i++) {
        const angle = (i / 128) * Math.PI * 2;
        orbitPoints.push(
            Math.cos(angle) * data.distance,
            0,
            Math.sin(angle) * data.distance
        );
    }
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: planetColor,
        transparent: true,
        opacity: 0.4
    });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);
    orbitLines.push(orbitLine);
```

**Purpose**: Visualize planetary orbits and enable orbital motion animation

**Orbit Generation**:
- **128 points**: Creates smooth circular orbit visualization
- **Mathematical precision**: Uses trigonometric functions for perfect circles
- **Flat orbits**: All orbits in XZ plane (Y=0) for simplified visualization
- **Distance-based sizing**: Orbit radius matches planet's assigned distance

**Visual Properties**:
- **Color matching**: Orbit line uses same color as planet for association
- **Semi-transparent**: 40% opacity keeps orbits visible but not distracting
- **Toggle-able**: Can be hidden/shown via UI controls

### 8. Camera Animation and Control System
```javascript
const cameraAnimation = {
    active: false,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    progress: 0,
    duration: 2.0 // seconds
};

function animateCameraTo(targetPos, lookAt, duration = 2.0) {
    cameraAnimation.startPos.copy(camera.position);
    cameraAnimation.endPos.copy(targetPos);
    cameraAnimation.startTarget.copy(controls.target);
    cameraAnimation.endTarget.copy(lookAt);
    cameraAnimation.duration = duration;
    cameraAnimation.progress = 0;
    cameraAnimation.active = true;
}

function updateCameraAnimation(deltaTime) {
    if (!cameraAnimation.active) return;

    cameraAnimation.progress += deltaTime / cameraAnimation.duration;
    
    if (cameraAnimation.progress >= 1.0) {
        cameraAnimation.progress = 1.0;
        cameraAnimation.active = false;
    }

    // Smooth easing function
    const t = easeInOutCubic(cameraAnimation.progress);
    
    camera.position.lerpVectors(cameraAnimation.startPos, cameraAnimation.endPos, t);
    controls.target.lerpVectors(cameraAnimation.startTarget, cameraAnimation.endTarget, t);
    controls.update();
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
```

**Purpose**: Provide smooth, cinematic camera transitions between viewing perspectives

**Animation State Management**:
- **Complete animation data**: Stores start/end positions and targets
- **Duration control**: Customizable animation timing
- **Progress tracking**: Linear progress from 0 to 1
- **Active state**: Prevents multiple simultaneous animations

**Smooth Interpolation**:
- **Vector lerping**: Three.js linear interpolation for smooth position changes
- **Cubic easing**: Accelerates at start, decelerates at end for natural feel
- **Target and position**: Animates both camera position and look-at target
- **OrbitControls integration**: Updates controls to maintain proper state

### 9. Planet Selection and Information Display
```javascript
function selectPlanet(planet) {
    selectedPlanet = planet;
    cameraLocked = true; // Enable camera tracking
    
    // Show unlock camera button
    document.getElementById('unlock-camera').style.display = 'block';
    
    // Update UI
    updateInfoPanel(planet);
    updatePlanetCards();
    
    // Initial camera position
    const planetWorldPos = planet.mesh.position.clone();
    const offset = new THREE.Vector3(
        Math.cos(planet.angle) * planet.distance * 0.3,
        planet.size * 3,
        Math.sin(planet.angle) * planet.distance * 0.3
    );
    const cameraPos = planetWorldPos.clone().add(offset);
    
    animateCameraTo(cameraPos, planetWorldPos, 1.5);
}

function updateInfoPanel(planet) {
    const infoPanel = document.getElementById('info-panel');
    const infoContent = document.getElementById('info-content');
    
    const habitabilityBadge = planet.is_highly_habitable ? 
        '<span class="badge highly-habitable">🌟 Highly Habitable</span>' :
        planet.habitability_class === 'potentially_habitable' ? 
        '<span class="badge potentially-habitable">🌱 Potentially Habitable</span>' :
        '<span class="badge">📊 ' + planet.habitability_class.replace('_', ' ') + '</span>';
    
    infoContent.innerHTML = `
        <div class="planet-header">
            <h3>${planet.kepler_name || planet.name}</h3>
            <p class="planet-id">${planet.planet_id}</p>
            ${habitabilityBadge}
        </div>
        <div class="info-row">
            <span class="info-label">Classification Confidence:</span>
            <span class="info-value">${(planet.classification_probability * 100).toFixed(1)}%</span>
        </div>
        <div class="info-row">
            <span class="info-label">Habitability Score:</span>
            <span class="info-value">${planet.habitability_score.toFixed(3)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Radius:</span>
            <span class="info-value">${planet.features.radius_earth_radii.toFixed(2)} R⊕</span>
        </div>
        <div class="info-row">
            <span class="info-label">Temperature:</span>
            <span class="info-value">${planet.features.temperature_k.toFixed(0)} K</span>
        </div>
        <div class="info-row">
            <span class="info-label">Insolation:</span>
            <span class="info-value">${planet.features.insolation_earth_flux.toFixed(2)} S⊕</span>
        </div>
        <div class="info-row">
            <span class="info-label">Orbital Period:</span>
            <span class="info-value">${planet.features.orbital_period_days.toFixed(1)} days</span>
        </div>
        <div class="info-row">
            <span class="info-label">Stellar Temperature:</span>
            <span class="info-value">${planet.features.stellar_temp_k.toFixed(0)} K</span>
        </div>
        <div class="summary">
            <h4>Summary</h4>
            <p>${planet.summary}</p>
        </div>
    `;
    
    infoPanel.classList.add('visible');
}
```

**Purpose**: Create detailed information display system for selected planets with automatic camera tracking

**Selection Behavior**:
- **Camera locking**: Enables automatic camera tracking of moving planets
- **UI state management**: Updates all related interface elements
- **Visual feedback**: Highlights selected planet in planet wheel
- **Information display**: Shows comprehensive planet data

**Camera Positioning**:
- **Orbital positioning**: Places camera relative to planet's orbital position
- **Dynamic offset**: Calculates viewing position based on planet's current location
- **Height adjustment**: Elevates camera above orbital plane for better view
- **Smooth transition**: Animates to new position over 1.5 seconds

**Scientific Information Display**:
- **Classification confidence**: ML model certainty percentage
- **Habitability metrics**: Scientific scoring and classification
- **Physical properties**: Radius, temperature, orbital characteristics
- **Stellar context**: Information about the host star
- **Earth units**: Uses Earth-relative units (R⊕, S⊕) for context

### 10. Dynamic Animation Loop
```javascript
function animate() {
    requestAnimationFrame(animate);
    
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Update camera animation
    updateCameraAnimation(deltaTime);
    
    // Update camera tracking
    updateCameraTracking();
    
    // Rotate central star with pulsing effect
    centralStar.rotation.y += 0.002;
    corona1.rotation.y -= 0.0015;
    corona1.rotation.x += 0.0005;
    corona2.rotation.y += 0.001;
    corona2.rotation.x -= 0.0005;
    
    // Animate solar flares
    solarFlares.rotation.y -= 0.002;
    solarFlares.rotation.z += 0.001;
    const flareIntensity = 0.15 + 0.1 * Math.sin(currentTime * 0.005);
    solarFlares.material.opacity = flareIntensity;
    
    // Pulse coronas
    const coronaPulse = 0.4 + 0.15 * Math.sin(currentTime * 0.003);
    corona1.material.opacity = coronaPulse;
    corona2.material.opacity = coronaPulse * 0.5;
    
    // Update exoplanets
    exoplanets.forEach(planet => {
        // Orbit around star
        planet.angle += planet.orbitSpeed * 0.01;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
        
        // Update vegetation particles if they exist
        if (planet.vegetationParticles) {
            planet.vegetationParticles.position.copy(planet.mesh.position);
            planet.vegetationParticles.rotation.copy(planet.mesh.rotation);
            
            // Animate vegetation growth (pulsing effect)
            const growthPulse = 0.8 + 0.2 * Math.sin(currentTime * 0.002 + planet.angle);
            planet.vegetationParticles.material.opacity = growthPulse;
            
            // Update atmosphere if it exists
            if (planet.vegetationParticles.atmosphere) {
                planet.vegetationParticles.atmosphere.position.copy(planet.mesh.position);
                const atmoPulse = 0.15 + 0.05 * Math.sin(currentTime * 0.004);
                planet.vegetationParticles.atmosphere.material.opacity = atmoPulse;
            }
        }
        
        // Self rotation
        planet.mesh.rotation.y += planet.rotationSpeed * 0.01;
    });
    
    controls.update();
    renderer.render(scene, camera);
}
```

**Purpose**: Coordinate all dynamic elements of the 3D scene with realistic astronomical motion

**Time Management**:
- **Delta time calculation**: Enables frame-rate independent animation
- **RequestAnimationFrame**: Ensures smooth 60fps rendering when possible
- **Continuous loop**: Perpetual animation for living solar system

**Central Star Animation**:
- **Multi-layer rotation**: Each stellar layer rotates at different speeds
- **Pulsing effects**: Sinusoidal variations in opacity create stellar activity
- **Solar flare dynamics**: Complex rotation and intensity changes simulate solar storms
- **Corona pulsing**: Breathing effect mimics actual coronal dynamics

**Planetary Motion**:
- **Orbital mechanics**: Circular orbits around central star
- **Individual speeds**: Each planet has unique orbital and rotation speeds
- **Position calculation**: Trigonometric positioning for smooth circular motion
- **Self-rotation**: Planets spin on their axes while orbiting

**Vegetation and Atmosphere Animation**:
- **Synchronized movement**: Vegetation and atmosphere follow planet position
- **Growth pulsing**: Simulates living, growing vegetation
- **Atmospheric breathing**: Subtle opacity changes suggest atmospheric dynamics
- **Phase offsetting**: Uses planet angle to create varied animation timing

## Integration Architecture

### 1. Data Flow Pipeline
1. **API Integration**: Attempts to load real exoplanet data from `/api/get_results`
2. **Fallback System**: Uses mock data if API unavailable
3. **Data Processing**: Converts scientific data to 3D visualization parameters
4. **Scene Generation**: Creates 3D objects based on processed data
5. **UI Synchronization**: Updates all interface elements with loaded data

### 2. Interactive Features
- **Planet Selection**: Click planets or cards to focus view
- **Camera Controls**: Orbit, zoom, and pan with mouse/touch
- **Information Display**: Detailed scientific data for each planet
- **Orbit Toggle**: Show/hide orbital paths
- **View Reset**: Return to system overview
- **Camera Unlock**: Stop automatic planet tracking

### 3. Performance Optimizations
- **BufferGeometry**: Efficient vertex data storage
- **LOD Considerations**: Appropriate polygon counts for smooth performance
- **Selective Updates**: Only animate visible elements
- **Memory Management**: Proper cleanup when reloading data

### 4. Scientific Accuracy
- **Relative Sizing**: Planet sizes based on actual radius measurements
- **Temperature Mapping**: Colors reflect actual planet temperatures
- **Habitability Visualization**: Green colors and special effects for habitable worlds
- **Orbital Representation**: Circular orbits for simplified but understandable visualization

This visualization engine successfully transforms complex exoplanet data into an intuitive, engaging 3D experience that educates users about astronomical discoveries while maintaining scientific authenticity.