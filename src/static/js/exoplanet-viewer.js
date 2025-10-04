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
const starGeometry = new THREE.SphereGeometry(6, 32, 32);
const starMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    emissive: 0xffd700,
    emissiveIntensity: 1
});
const centralStar = new THREE.Mesh(starGeometry, starMaterial);
scene.add(centralStar);

// Star glow effect
const glowGeometry = new THREE.SphereGeometry(8, 32, 32);
const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.3
});
const glow = new THREE.Mesh(glowGeometry, glowMaterial);
scene.add(glow);

// ============ EXOPLANET DATA & MANAGEMENT ============
const exoplanets = [];
const orbitLines = [];
let selectedPlanet = null;
let showOrbits = true;

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
        planetColor = 0x00ff00; // Green for highly habitable
    } else if (data.habitability_class === 'potentially_habitable') {
        planetColor = 0x66bb6a; // Light green for potentially habitable
    } else if (data.temperature > 1000) {
        planetColor = 0xff4444; // Red for hot planets
    } else if (data.temperature < 200) {
        planetColor = 0x4488ff; // Blue for cold planets
    } else {
        planetColor = 0xffaa44; // Orange for temperate planets
    }
    
    // Planet mesh
    const geometry = new THREE.SphereGeometry(planetSize, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: planetColor,
        roughness: 0.7,
        metalness: 0.3,
        emissive: planetColor,
        emissiveIntensity: data.is_highly_habitable ? 0.4 : 0.2
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.castShadow = true;
    planet.receiveShadow = true;

    // Add special glow effect for highly habitable planets
    let glowMesh = null;
    if (data.is_highly_habitable) {
        const glowGeometry = new THREE.SphereGeometry(planetSize * 1.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3
        });
        glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        scene.add(glowMesh);
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
        glowMesh: glowMesh,
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
    
    // Update UI
    updateInfoPanel(planet);
    updatePlanetCards();
    
    // Animate camera to planet
    const planetWorldPos = planet.mesh.position.clone();
    const offset = new THREE.Vector3(
        Math.cos(planet.angle) * planet.distance * 0.3,
        planet.size * 3,
        Math.sin(planet.angle) * planet.distance * 0.3
    );
    const cameraPos = planetWorldPos.clone().add(offset);
    
    animateCameraTo(cameraPos, planetWorldPos, 1.5);
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
        if (p.glowMesh) scene.remove(p.glowMesh);
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

// ============ ANIMATION LOOP ============
let lastTime = Date.now();

function animate() {
    requestAnimationFrame(animate);
    
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Update camera animation
    updateCameraAnimation(deltaTime);
    
    // Rotate central star
    centralStar.rotation.y += 0.001;
    glow.rotation.y -= 0.0005;
    
    // Update exoplanets
    exoplanets.forEach(planet => {
        // Orbit around star
        planet.angle += planet.orbitSpeed * 0.01;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
        
        // Update glow mesh position if it exists
        if (planet.glowMesh) {
            planet.glowMesh.position.copy(planet.mesh.position);
            // Animate glow opacity
            const glowIntensity = 0.3 + 0.2 * Math.sin(currentTime * 0.003);
            planet.glowMesh.material.opacity = glowIntensity;
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

