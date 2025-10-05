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

// ============ LIGHTING ============
// Central star light
const centralLight = new THREE.PointLight(0xffffff, 2, 1000);
centralLight.position.set(0, 0, 0);
scene.add(centralLight);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

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
createStars();

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

// ============ EXOPLANET DATA & MANAGEMENT ============
const exoplanets = [];
const orbitLines = [];
let selectedPlanet = null;
let showOrbits = true;
let cameraLocked = false; // Camera tracking state

// Mock exoplanet data (replace with API call later)
const mockExoplanetData = [
    { name: 'Kepler-22b', size: 2.4, distance: 40, color: 0x4a90e2, probability: 0.95, mass: '2.5 Earth', temperature: '295K' },
    { name: 'Proxima b', size: 1.3, distance: 30, color: 0xe27b58, probability: 0.89, mass: '1.3 Earth', temperature: '234K' },
    { name: 'TRAPPIST-1e', size: 1.0, distance: 50, color: 0x66bb6a, probability: 0.92, mass: '0.8 Earth', temperature: '246K' },
    { name: 'HD 209458 b', size: 3.2, distance: 60, color: 0xffc649, probability: 0.87, mass: '0.7 Jupiter', temperature: '1449K' },
    { name: 'Gliese 667 Cc', size: 1.8, distance: 35, color: 0x9c27b0, probability: 0.94, mass: '3.8 Earth', temperature: '277K' },
    { name: 'K2-18b', size: 2.7, distance: 70, color: 0x00bcd4, probability: 0.91, mass: '8.6 Earth', temperature: '265K' },
    { name: 'LHS 1140 b', size: 1.4, distance: 45, color: 0xff5722, probability: 0.88, mass: '6.6 Earth', temperature: '230K' },
    { name: 'Wolf 1061c', size: 1.6, distance: 55, color: 0x3f51b5, probability: 0.85, mass: '4.3 Earth', temperature: '251K' },
];

// ============ CREATE EXOPLANET ============
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

    // Store planet data
    const planetData = {
        mesh: planet,
        vegetationParticles: vegetationParticles,
        distance: data.distance,
        orbitSpeed: 0.005 + (Math.random() * 0.01),
        rotationSpeed: 0.01 + (Math.random() * 0.01),
        angle: (index / (data.total_count || 20)) * Math.PI * 2, // Distribute evenly
        name: data.name,
        planet_id: data.planet_id,
        kepler_name: data.kepler_name,
        size: planetSize,
        color: planetColor,
        probability: data.probability,
        classification_probability: data.classification_probability,
        habitability_score: data.habitability_score,
        habitability_class: data.habitability_class,
        is_highly_habitable: data.is_highly_habitable,
        features: data.features,
        summary: data.summary,
        mass: data.features.radius_earth_radii.toFixed(2) + ' R⊕',
        temperature: data.features.temperature_k.toFixed(0) + 'K'
    };

    scene.add(planet);
    exoplanets.push(planetData);
    return planetData;
}

// ============ CAMERA ANIMATION ============
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

// ============ ZOOM TO SOLAR SYSTEM ============
function zoomToSolarSystem() {
    // Calculate center of exoplanet system
    const centerPos = new THREE.Vector3(0, 0, 0);
    const viewPos = new THREE.Vector3(0, 80, 120);
    
    animateCameraTo(viewPos, centerPos, 3.0);
}

// ============ SELECT PLANET ============
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

// ============ UPDATE CAMERA TRACKING ============
function updateCameraTracking() {
    if (cameraLocked && selectedPlanet) {
        // Keep camera focused on the selected planet
        const planetPos = selectedPlanet.mesh.position.clone();
        controls.target.copy(planetPos);
        controls.update();
    }
}

// ============ UI FUNCTIONS ============
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

function createPlanetCards() {
    const container = document.getElementById('planet-container');
    container.innerHTML = '';
    
    exoplanets.forEach((planet, index) => {
        const card = document.createElement('div');
        card.className = 'planet-card';
        if (planet.is_highly_habitable) {
            card.classList.add('highly-habitable');
        }
        card.dataset.index = index;
        
        const colorHex = '#' + planet.color.toString(16).padStart(6, '0');
        
        const habitabilityIcon = planet.is_highly_habitable ? '🌟' : 
                               planet.habitability_class === 'potentially_habitable' ? '🌱' : 
                               planet.habitability_class === 'marginally_habitable' ? '📊' : '🌑';
        
        card.innerHTML = `
            <div class="planet-icon" style="background: ${colorHex}; box-shadow: 0 0 15px ${colorHex};">
            </div>
            <div class="planet-name">${planet.kepler_name || planet.name}</div>
            <div class="planet-info">
                ${habitabilityIcon} ${(planet.classification_probability * 100).toFixed(0)}% confidence
            </div>
            <div class="habitability-info">
                Habitability: ${planet.habitability_score.toFixed(2)}
            </div>
        `;
        
        card.addEventListener('click', () => {
            selectPlanet(planet);
        });
        
        container.appendChild(card);
    });
}

function updatePlanetCards() {
    const cards = document.querySelectorAll('.planet-card');
    cards.forEach((card, index) => {
        if (selectedPlanet && exoplanets[index] === selectedPlanet) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

// ============ INITIALIZATION ============
async function initialize() {
    try {
        // Try to load data from API first
        const response = await fetch('/api/get_results');
        
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success' && data.results.length > 0) {
                console.log(`Loading ${data.results.length} exoplanets from API`);
                loadExoplanetData(data.results);
            } else {
                console.log('No API data available, using mock data');
                loadMockData();
            }
        } else {
            console.log('API not available, using mock data');
            loadMockData();
        }
        
    } catch (error) {
        console.log('Error loading API data, using mock data:', error);
        loadMockData();
    }
    
    // Show UI elements
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('planet-wheel').classList.add('visible');
    }, 2000);
    
    // Zoom in animation
    setTimeout(() => {
        zoomToSolarSystem();
    }, 2500);
}

function loadMockData() {
    // Convert mock data to new format for compatibility with realistic confidence scores
    const mockData = [
        { 
            planet_id: 'KOI-22.01', kepler_name: 'Kepler-22b', 
            classification_probability: 0.94, habitability_score: 0.87, habitability_class: 'highly_habitable',
            is_highly_habitable: true, size: 2.4, distance: 40, color: 0x4a90e2,
            features: { radius_earth_radii: 2.4, temperature_k: 295, insolation_earth_flux: 1.1, orbital_period_days: 289.9, stellar_temp_k: 5700, stellar_radius_solar: 0.97, stellar_mass_solar: 0.98 },
            summary: 'Earth-like size and favorable temperature range, making it a promising candidate for habitability.'
        },
        { 
            planet_id: 'KOI-30.01', kepler_name: 'Proxima b', 
            classification_probability: 0.87, habitability_score: 0.72, habitability_class: 'potentially_habitable',
            is_highly_habitable: true, size: 1.3, distance: 30, color: 0xe27b58,
            features: { radius_earth_radii: 1.3, temperature_k: 234, insolation_earth_flux: 0.65, orbital_period_days: 11.2, stellar_temp_k: 3050, stellar_radius_solar: 0.14, stellar_mass_solar: 0.12 },
            summary: 'Close to Earth size with appropriate stellar energy, orbiting in the habitable zone.'
        },
        { 
            planet_id: 'KOI-85.01', kepler_name: 'TRAPPIST-1e', 
            classification_probability: 0.91, habitability_score: 0.78, habitability_class: 'highly_habitable',
            is_highly_habitable: true, size: 1.0, distance: 50, color: 0x66bb6a,
            features: { radius_earth_radii: 1.0, temperature_k: 246, insolation_earth_flux: 0.91, orbital_period_days: 6.1, stellar_temp_k: 2550, stellar_radius_solar: 0.12, stellar_mass_solar: 0.09 },
            summary: 'Near-Earth size with temperate conditions in a multi-planet system.'
        },
        { 
            planet_id: 'KOI-123.01', kepler_name: 'HD 209458 b', 
            classification_probability: 0.83, habitability_score: 0.23, habitability_class: 'not_habitable',
            is_highly_habitable: false, size: 3.2, distance: 60, color: 0xffc649,
            features: { radius_earth_radii: 3.2, temperature_k: 1449, insolation_earth_flux: 8.7, orbital_period_days: 3.5, stellar_temp_k: 6100, stellar_radius_solar: 1.1, stellar_mass_solar: 1.05 },
            summary: 'Gas giant experiencing extreme stellar heating.'
        }
    ];
    
    loadExoplanetData(mockData);
}

function loadExoplanetData(apiData) {
    // Clear existing planets
    exoplanets.forEach(p => {
        scene.remove(p.mesh);
        if (p.vegetationParticles) {
            scene.remove(p.vegetationParticles);
            if (p.vegetationParticles.atmosphere) {
                scene.remove(p.vegetationParticles.atmosphere);
            }
        }
    });
    orbitLines.forEach(l => scene.remove(l));
    exoplanets.length = 0;
    orbitLines.length = 0;
    
    // Process API data and create planets
    apiData.forEach((planetData, index) => {
        // Calculate distance for visualization (spread planets in interesting orbits)
        const baseDistance = 25 + (index * 8) + (Math.random() * 10);
        
        const processedData = {
            ...planetData,
            name: planetData.kepler_name || planetData.planet_id,
            size: Math.max(0.8, Math.min(4.0, planetData.features.radius_earth_radii)),
            distance: baseDistance,
            probability: planetData.classification_probability,
            temperature: planetData.features.temperature_k
        };
        
        createExoplanet(processedData, index);
    });
    
    // Update UI
    createPlanetCards();
    document.getElementById('exoplanet-count').textContent = `${exoplanets.length} most promising exoplanets shown`;
    
    const highlyHabitable = exoplanets.filter(p => p.is_highly_habitable).length;
    if (highlyHabitable > 0) {
        document.getElementById('exoplanet-count').textContent += ` (${highlyHabitable} highly habitable)`;
    }
}

// ============ CONTROLS ============
document.getElementById('reset-view').addEventListener('click', () => {
    selectedPlanet = null;
    cameraLocked = false; // Unlock camera
    document.getElementById('unlock-camera').style.display = 'none';
    updatePlanetCards();
    document.getElementById('info-panel').classList.remove('visible');
    zoomToSolarSystem();
});

document.getElementById('toggle-orbits').addEventListener('click', () => {
    showOrbits = !showOrbits;
    orbitLines.forEach(line => {
        line.visible = showOrbits;
    });
});

document.getElementById('unlock-camera').addEventListener('click', () => {
    cameraLocked = false;
    document.getElementById('unlock-camera').style.display = 'none';
});

// ============ ANIMATION LOOP ============
let lastTime = Date.now();

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

// ============ WINDOW RESIZE ============
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============ PLANET CLICK SELECTION ============
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    // Ignore clicks on UI elements
    if (event.target.closest('#planet-wheel') || 
        event.target.closest('#controls') || 
        event.target.closest('#info-panel')) {
        return;
    }
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(exoplanets.map(p => p.mesh));
    
    if (intersects.length > 0) {
        const clickedPlanet = exoplanets.find(p => p.mesh === intersects[0].object);
        if (clickedPlanet) {
            selectPlanet(clickedPlanet);
        }
    }
});

// ============ START APPLICATION ============
initialize();
animate();

// ============ EXPORT FOR API INTEGRATION ============
window.ExoplanetViewer = {
    loadExoplanetData: loadExoplanetData,
    refreshData: function() {
        initialize();
    }
};

