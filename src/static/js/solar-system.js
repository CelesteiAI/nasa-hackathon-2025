import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Hide loading screen after initialization
setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}, 1000);

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
camera.position.set(0, 50, 100);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Add stars
function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        transparent: true
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}
createStars();

// Sun (light source)
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xfdb813,
    emissive: 0xfdb813,
    emissiveIntensity: 1
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Sun light
const sunLight = new THREE.PointLight(0xffffff, 3, 500);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Ambient light
const ambientLight = new THREE.AmbientLight(0x888888);
scene.add(ambientLight);

// Planet data: [name, size, color, distance from sun, orbital speed, rotation speed]
const planetsData = [
    { name: 'Mercury', size: 0.8, color: 0x8c7853, distance: 15, orbitSpeed: 0.04, rotationSpeed: 0.01 },
    { name: 'Venus', size: 1.2, color: 0xffc649, distance: 22, orbitSpeed: 0.03, rotationSpeed: 0.008 },
    { name: 'Earth', size: 1.3, color: 0x4a90e2, distance: 30, orbitSpeed: 0.02, rotationSpeed: 0.01 },
    { name: 'Mars', size: 1.0, color: 0xe27b58, distance: 38, orbitSpeed: 0.018, rotationSpeed: 0.009 },
    { name: 'Jupiter', size: 3.5, color: 0xc88b3a, distance: 55, orbitSpeed: 0.013, rotationSpeed: 0.02 },
    { name: 'Saturn', size: 3.0, color: 0xfad5a5, distance: 70, orbitSpeed: 0.009, rotationSpeed: 0.018 },
    { name: 'Uranus', size: 2.0, color: 0x4fd0e7, distance: 85, orbitSpeed: 0.006, rotationSpeed: 0.012 },
    { name: 'Neptune', size: 1.9, color: 0x4166f5, distance: 100, orbitSpeed: 0.005, rotationSpeed: 0.011 }
];

// Create planets
const planets = [];
planetsData.forEach(data => {
    // Planet mesh
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.5,
        metalness: 0.2,
        emissive: data.color,
        emissiveIntensity: 0.2
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.castShadow = true;
    planet.receiveShadow = true;

    // Orbit line
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        orbitPoints.push(
            Math.cos(angle) * data.distance,
            0,
            Math.sin(angle) * data.distance
        );
    }
    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.7
    });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);

    // Store planet data
    planets.push({
        mesh: planet,
        distance: data.distance,
        orbitSpeed: data.orbitSpeed,
        rotationSpeed: data.rotationSpeed,
        angle: Math.random() * Math.PI * 2,
        name: data.name
    });

    scene.add(planet);
});

// Add Saturn's rings
const saturnPlanet = planets.find(p => p.name === 'Saturn');
if (saturnPlanet) {
    const ringGeometry = new THREE.RingGeometry(3.5, 5.5, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xc9a55a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    saturnPlanet.mesh.add(ring);
}

// Add Moon for Earth
const earthPlanet = planets.find(p => p.name === 'Earth');
const moon = {
    mesh: null,
    distance: 3,
    orbitSpeed: 0.05,
    angle: 0,
    parent: earthPlanet
};

if (earthPlanet) {
    const moonGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const moonMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    moon.mesh = new THREE.Mesh(moonGeometry, moonMaterial);
    scene.add(moon.mesh);
}

// Info panel
const infoDiv = document.createElement('div');
infoDiv.style.position = 'absolute';
infoDiv.style.top = '10px';
infoDiv.style.left = '10px';
infoDiv.style.color = 'white';
infoDiv.style.background = 'rgba(0, 0, 0, 0.7)';
infoDiv.style.padding = '15px';
infoDiv.style.borderRadius = '10px';
infoDiv.style.fontFamily = 'Arial, sans-serif';
infoDiv.style.fontSize = '14px';

document.body.appendChild(infoDiv);

// Animation
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    // Rotate sun
    sun.rotation.y += 0.001;

    // Update planets
    planets.forEach(planet => {
        // Orbit around sun
        planet.angle += planet.orbitSpeed * 0.01;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;

        // Self rotation
        planet.mesh.rotation.y += planet.rotationSpeed * 0.01;
    });

    // Update moon orbit around Earth
    if (moon.mesh && earthPlanet) {
        moon.angle += moon.orbitSpeed * 0.01;
        moon.mesh.position.x = earthPlanet.mesh.position.x + Math.cos(moon.angle) * moon.distance;
        moon.mesh.position.z = earthPlanet.mesh.position.z + Math.sin(moon.angle) * moon.distance;
    }

    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Raycaster for planet selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

    const planetInfo = document.getElementById('planet-info');
    if (intersects.length > 0) {
        const selectedPlanet = planets.find(p => p.mesh === intersects[0].object);
        if (selectedPlanet) {
            planetInfo.innerHTML = `
                <strong>Selected: ${selectedPlanet.name}</strong><br>
                Distance from Sun: ${selectedPlanet.distance} AU<br>
                Orbital Speed: ${(selectedPlanet.orbitSpeed * 100).toFixed(2)}
            `;
        }
    }
});

animate();

