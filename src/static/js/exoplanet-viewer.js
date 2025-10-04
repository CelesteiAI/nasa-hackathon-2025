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
    // Planet mesh
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.7,
        metalness: 0.3,
        emissive: data.color,
        emissiveIntensity: 0.2
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.castShadow = true;
    planet.receiveShadow = true;

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
        color: data.color,
        transparent: true,
        opacity: 0.4
    });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);
    orbitLines.push(orbitLine);

    // Store planet data
    const planetData = {
        mesh: planet,
        distance: data.distance,
        orbitSpeed: 0.005 + (Math.random() * 0.01),
        rotationSpeed: 0.01 + (Math.random() * 0.01),
        angle: (index / mockExoplanetData.length) * Math.PI * 2, // Distribute evenly
        name: data.name,
        size: data.size,
        color: data.color,
        probability: data.probability,
        mass: data.mass,
        temperature: data.temperature
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
    
    infoContent.innerHTML = `
        <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${planet.name}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Classification:</span>
            <span class="info-value">${(planet.probability * 100).toFixed(1)}% Confidence</span>
        </div>
        <div class="info-row">
            <span class="info-label">Mass:</span>
            <span class="info-value">${planet.mass}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Temperature:</span>
            <span class="info-value">${planet.temperature}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Distance:</span>
            <span class="info-value">${planet.distance} AU</span>
        </div>
        <div class="info-row">
            <span class="info-label">Radius:</span>
            <span class="info-value">${planet.size.toFixed(1)} R⊕</span>
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
        card.dataset.index = index;
        
        const colorHex = '#' + planet.color.toString(16).padStart(6, '0');
        
        card.innerHTML = `
            <div class="planet-icon" style="background: ${colorHex}; box-shadow: 0 0 20px ${colorHex};"></div>
            <div class="planet-name">${planet.name}</div>
            <div class="planet-info">${(planet.probability * 100).toFixed(0)}% confidence</div>
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
    // Create exoplanets
    mockExoplanetData.forEach((data, index) => {
        createExoplanet(data, index);
    });
    
    // Update UI
    document.getElementById('exoplanet-count').textContent = `${exoplanets.length} confirmed exoplanets detected`;
    createPlanetCards();
    
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
    loadExoplanetData: function(data) {
        // Clear existing
        exoplanets.forEach(p => scene.remove(p.mesh));
        orbitLines.forEach(l => scene.remove(l));
        exoplanets.length = 0;
        orbitLines.length = 0;
        
        // Load new data
        data.forEach((planetData, index) => {
            createExoplanet(planetData, index);
        });
        
        createPlanetCards();
        document.getElementById('exoplanet-count').textContent = `${exoplanets.length} confirmed exoplanets detected`;
    }
};

