import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Constants & State ───────────────────────────────────────────────

const G_BASE = 40;
const SOFTENING = 2.0;          // softening epsilon squared
const MAX_ACCEL = 800;
const MAX_SPEED = 200;
const COLLISION_FACTOR = 0.5;   // conservative collision threshold
const GRID_SIZE = 100;
const GRID_SEGMENTS = 40;

let bodies = [];
let paused = false;
let nextId = 1;

// Settings
const settings = {
    gravityMul: 1.0,
    speedMul: 1.0,
    trailLen: 120,
    showCurvature: true,
    showTrails: true,
    showVectors: false,
    showGlow: true,
};

// ─── Three.js Setup ──────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000011, 0.003);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 60, 80);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 5;
controls.maxDistance = 500;

// Lights
scene.add(new THREE.AmbientLight(0x222244, 0.5));
const pointLight = new THREE.PointLight(0xffeedd, 2, 300);
scene.add(pointLight);

// Starfield
const starGeo = new THREE.BufferGeometry();
const starVerts = new Float32Array(3000 * 3);
for (let i = 0; i < starVerts.length; i++) starVerts[i] = (Math.random() - 0.5) * 800;
starGeo.setAttribute('position', new THREE.BufferAttribute(starVerts, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true });
scene.add(new THREE.Points(starGeo, starMat));

// ─── Curvature Grid ─────────────────────────────────────────────────

const gridGeo = new THREE.PlaneGeometry(GRID_SIZE * 2, GRID_SIZE * 2, GRID_SEGMENTS, GRID_SEGMENTS);
gridGeo.rotateX(-Math.PI / 2);
const gridBaseY = new Float32Array(gridGeo.attributes.position.count);
for (let i = 0; i < gridBaseY.length; i++) gridBaseY[i] = gridGeo.attributes.position.getY(i);

const gridMat = new THREE.MeshBasicMaterial({
    color: 0x2244aa,
    wireframe: true,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
});
const gridMesh = new THREE.Mesh(gridGeo, gridMat);
gridMesh.position.y = -10;
scene.add(gridMesh);

function updateCurvatureGrid() {
    if (!settings.showCurvature) { gridMesh.visible = false; return; }
    gridMesh.visible = true;
    const pos = gridGeo.attributes.position;
    const G = G_BASE * settings.gravityMul;
    for (let i = 0; i < pos.count; i++) {
        const gx = pos.getX(i);
        const gz = pos.getZ(i);
        let dip = 0;
        for (const b of bodies) {
            const dx = gx - b.pos.x;
            const dz = gz - b.pos.z;
            const r2 = dx * dx + dz * dz + SOFTENING;
            dip -= (G * b.mass) / (r2 * 0.5 + 10);
        }
        pos.setY(i, gridBaseY[i] + dip * 0.15);
    }
    pos.needsUpdate = true;
}

// ─── Raycaster for hover ────────────────────────────────────────────

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-999, -999);
let hoveredBody = null;

renderer.domElement.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

function updateHover() {
    raycaster.setFromCamera(mouse, camera);
    const meshes = bodies.map(b => b.mesh);
    const hits = raycaster.intersectObjects(meshes);
    hoveredBody = null;
    if (hits.length > 0) {
        const mesh = hits[0].object;
        const b = bodies.find(b => b.mesh === mesh);
        if (b) {
            hoveredBody = b;
            document.getElementById('info-text').textContent =
                `${b.name}  ·  mass: ${b.mass.toFixed(1)}  ·  v: ${b.vel.length().toFixed(1)}  ·  redshift: ${b.redshift?.toFixed(3) || '0'}`;
        }
    } else {
        document.getElementById('info-text').textContent = 'Hover a body for info · Scroll to zoom · Drag to orbit · Shift+drag to pan';
    }
}

// ─── Body Management ─────────────────────────────────────────────────

function radiusFromMass(mass) {
    return Math.max(0.4, Math.pow(mass, 1 / 3) * 0.7);
}

function createBodyVisual(body) {
    const color = new THREE.Color(body.colorHex);

    // Main sphere
    const geo = new THREE.SphereGeometry(body.radius, 24, 18);
    const mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: body.mass > 50 ? 1.5 : 0.3,
        roughness: 0.4,
        metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(body.pos);
    scene.add(mesh);
    body.mesh = mesh;

    // Glow sprite
    const spriteMat = new THREE.SpriteMaterial({
        map: generateGlowTexture(color),
        transparent: true,
        opacity: body.mass > 50 ? 0.8 : 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(spriteMat);
    const glowScale = body.radius * (body.mass > 50 ? 6 : 3.5);
    sprite.scale.set(glowScale, glowScale, 1);
    mesh.add(sprite);
    body.glowSprite = sprite;

    // Trail
    const maxPoints = 600;
    const trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(maxPoints * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setDrawRange(0, 0);
    const trailMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
    });
    const trail = new THREE.Line(trailGeo, trailMat);
    scene.add(trail);
    body.trail = trail;
    body.trailPoints = [];
    body.trailMaxPoints = maxPoints;

    // Velocity arrow
    const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), body.pos, 3, 0xffff00, 0.5, 0.3
    );
    arrow.visible = settings.showVectors;
    scene.add(arrow);
    body.arrow = arrow;
}

function generateGlowTexture(color) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    const r = color.r * 255 | 0, g = color.g * 255 | 0, b = color.b * 255 | 0;
    gradient.addColorStop(0, `rgba(${r},${g},${b},1)`);
    gradient.addColorStop(0.3, `rgba(${r},${g},${b},0.4)`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

function addBody(opts) {
    const body = {
        id: nextId++,
        name: opts.name || `Body ${nextId}`,
        mass: opts.mass || 5,
        radius: opts.radius || radiusFromMass(opts.mass || 5),
        pos: new THREE.Vector3(opts.x || 0, opts.y || 0, opts.z || 0),
        vel: new THREE.Vector3(opts.vx || 0, opts.vy || 0, opts.vz || 0),
        acc: new THREE.Vector3(),
        colorHex: opts.color || '#4fc3f7',
        redshift: 0,
    };
    createBodyVisual(body);
    bodies.push(body);
    updateBodyList();
    return body;
}

function removeBody(id) {
    const idx = bodies.findIndex(b => b.id === id);
    if (idx < 0) return;
    const b = bodies[idx];
    scene.remove(b.mesh);
    scene.remove(b.trail);
    scene.remove(b.arrow);
    if (b.mesh.geometry) b.mesh.geometry.dispose();
    if (b.mesh.material) b.mesh.material.dispose();
    if (b.trail.geometry) b.trail.geometry.dispose();
    if (b.trail.material) b.trail.material.dispose();
    bodies.splice(idx, 1);
    updateBodyList();
}

function clearAllBodies() {
    while (bodies.length) removeBody(bodies[0].id);
}

// ─── Physics ─────────────────────────────────────────────────────────

function computeAccelerations() {
    const G = G_BASE * settings.gravityMul;
    for (const b of bodies) b.acc.set(0, 0, 0);

    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i], b = bodies[j];
            const dx = b.pos.x - a.pos.x;
            const dy = b.pos.y - a.pos.y;
            const dz = b.pos.z - a.pos.z;
            const r2 = dx * dx + dy * dy + dz * dz + SOFTENING;
            const r = Math.sqrt(r2);
            const F = G / r2;
            const fx = F * dx / r;
            const fy = F * dy / r;
            const fz = F * dz / r;
            a.acc.x += fx * b.mass;
            a.acc.y += fy * b.mass;
            a.acc.z += fz * b.mass;
            b.acc.x -= fx * a.mass;
            b.acc.y -= fy * a.mass;
            b.acc.z -= fz * a.mass;
        }
    }

    // Clamp acceleration
    for (const b of bodies) {
        const aMag = b.acc.length();
        if (aMag > MAX_ACCEL) b.acc.multiplyScalar(MAX_ACCEL / aMag);
    }
}

function integrate(dt) {
    // Leapfrog / Velocity Verlet
    // Half-step velocity
    for (const b of bodies) {
        b.vel.x += b.acc.x * dt * 0.5;
        b.vel.y += b.acc.y * dt * 0.5;
        b.vel.z += b.acc.z * dt * 0.5;
    }
    // Full-step position
    for (const b of bodies) {
        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;
        b.pos.z += b.vel.z * dt;
    }
    // Recompute accelerations
    computeAccelerations();
    // Half-step velocity again
    for (const b of bodies) {
        b.vel.x += b.acc.x * dt * 0.5;
        b.vel.y += b.acc.y * dt * 0.5;
        b.vel.z += b.acc.z * dt * 0.5;
        // Clamp speed
        const spd = b.vel.length();
        if (spd > MAX_SPEED) b.vel.multiplyScalar(MAX_SPEED / spd);
    }
}

function handleCollisions() {
    const toRemove = new Set();
    for (let i = 0; i < bodies.length; i++) {
        if (toRemove.has(i)) continue;
        for (let j = i + 1; j < bodies.length; j++) {
            if (toRemove.has(j)) continue;
            const a = bodies[i], b = bodies[j];
            const dist = a.pos.distanceTo(b.pos);
            const threshold = (a.radius + b.radius) * COLLISION_FACTOR;
            if (dist < threshold) {
                // Merge into heavier body
                const [big, small, bigIdx, smallIdx] = a.mass >= b.mass ? [a, b, i, j] : [b, a, j, i];
                const totalMass = big.mass + small.mass;
                // Conservation of momentum
                big.vel.x = (big.vel.x * big.mass + small.vel.x * small.mass) / totalMass;
                big.vel.y = (big.vel.y * big.mass + small.vel.y * small.mass) / totalMass;
                big.vel.z = (big.vel.z * big.mass + small.vel.z * small.mass) / totalMass;
                big.mass = totalMass;
                big.radius = radiusFromMass(totalMass);
                // Update mesh scale
                const s = big.radius / Math.pow(big.mass - small.mass, 1/3) * Math.pow(big.mass, 1/3);
                big.mesh.geometry.dispose();
                big.mesh.geometry = new THREE.SphereGeometry(big.radius, 24, 18);
                big.mesh.material.emissiveIntensity = big.mass > 50 ? 1.5 : 0.3;
                const glowScale = big.radius * (big.mass > 50 ? 6 : 3.5);
                big.glowSprite.scale.set(glowScale, glowScale, 1);
                toRemove.add(smallIdx);
            }
        }
    }
    if (toRemove.size > 0) {
        // Remove in reverse order
        const indices = [...toRemove].sort((a, b) => b - a);
        for (const idx of indices) {
            const b = bodies[idx];
            scene.remove(b.mesh);
            scene.remove(b.trail);
            scene.remove(b.arrow);
            b.mesh.geometry.dispose();
            b.mesh.material.dispose();
            b.trail.geometry.dispose();
            b.trail.material.dispose();
            bodies.splice(idx, 1);
        }
        updateBodyList();
    }
}

// ─── Relativity-Inspired Effect: Gravitational Redshift ─────────────
// Bodies deep in gravitational wells shift toward red; those far shift blue.
// z = GM / (rc²) approximated visually. We map this to hue shift on the body.

function updateRedshift() {
    const G = G_BASE * settings.gravityMul;
    const c2 = 10000; // fictional c² for visual scaling
    for (const body of bodies) {
        let potential = 0;
        for (const other of bodies) {
            if (other === body) continue;
            const r = body.pos.distanceTo(other.pos) + 1;
            potential += G * other.mass / r;
        }
        body.redshift = potential / c2;
        // Shift emissive color: base → red with increasing redshift
        const base = new THREE.Color(body.colorHex);
        const shifted = base.clone();
        const rs = Math.min(body.redshift, 1.0);
        // Lerp toward red/orange
        shifted.lerp(new THREE.Color(1.0, 0.2, 0.0), rs * 0.7);
        body.mesh.material.emissive.copy(shifted);
        body.mesh.material.emissiveIntensity = 0.3 + rs * 2.0;
    }
}

// ─── Visual Updates ──────────────────────────────────────────────────

function updateVisuals() {
    for (const b of bodies) {
        b.mesh.position.copy(b.pos);

        // Glow visibility
        if (b.glowSprite) b.glowSprite.visible = settings.showGlow;

        // Trail
        if (settings.showTrails) {
            b.trail.visible = true;
            b.trailPoints.push(b.pos.clone());
            if (b.trailPoints.length > settings.trailLen) {
                b.trailPoints.splice(0, b.trailPoints.length - settings.trailLen);
            }
            const positions = b.trail.geometry.attributes.position.array;
            for (let i = 0; i < b.trailPoints.length; i++) {
                positions[i * 3] = b.trailPoints[i].x;
                positions[i * 3 + 1] = b.trailPoints[i].y;
                positions[i * 3 + 2] = b.trailPoints[i].z;
            }
            b.trail.geometry.attributes.position.needsUpdate = true;
            b.trail.geometry.setDrawRange(0, b.trailPoints.length);
        } else {
            b.trail.visible = false;
        }

        // Velocity arrow
        if (settings.showVectors && b.vel.length() > 0.1) {
            b.arrow.visible = true;
            b.arrow.position.copy(b.pos);
            const dir = b.vel.clone().normalize();
            b.arrow.setDirection(dir);
            b.arrow.setLength(Math.min(b.vel.length() * 0.3, 15), 0.5, 0.3);
        } else {
            b.arrow.visible = false;
        }
    }

    // Place point light at heaviest body (star)
    if (bodies.length > 0) {
        const heaviest = bodies.reduce((a, b) => a.mass > b.mass ? a : b);
        pointLight.position.copy(heaviest.pos);
    }
}

// ─── UI ──────────────────────────────────────────────────────────────

function updateBodyList() {
    const list = document.getElementById('body-list');
    document.getElementById('body-count').textContent = `(${bodies.length})`;
    list.innerHTML = '';
    for (const b of bodies) {
        const div = document.createElement('div');
        div.className = 'body-item';
        div.innerHTML = `
            <span class="body-color" style="background:${b.colorHex}"></span>
            <span class="body-name">${b.name}</span>
            <span class="body-mass">m=${b.mass.toFixed(0)}</span>
            <button data-id="${b.id}" title="Remove">✕</button>
        `;
        div.querySelector('button').addEventListener('click', () => removeBody(b.id));
        list.appendChild(div);
    }
}

// Sliders
document.getElementById('slider-gravity').addEventListener('input', (e) => {
    settings.gravityMul = parseFloat(e.target.value);
    document.getElementById('val-gravity').textContent = settings.gravityMul.toFixed(2);
});
document.getElementById('slider-speed').addEventListener('input', (e) => {
    settings.speedMul = parseFloat(e.target.value);
    document.getElementById('val-speed').textContent = settings.speedMul.toFixed(1);
});
document.getElementById('slider-trail').addEventListener('input', (e) => {
    settings.trailLen = parseInt(e.target.value);
    document.getElementById('val-trail').textContent = settings.trailLen;
});

// Toggles
document.getElementById('toggle-curvature').addEventListener('change', (e) => settings.showCurvature = e.target.checked);
document.getElementById('toggle-trails').addEventListener('change', (e) => settings.showTrails = e.target.checked);
document.getElementById('toggle-vectors').addEventListener('change', (e) => settings.showVectors = e.target.checked);
document.getElementById('toggle-glow').addEventListener('change', (e) => settings.showGlow = e.target.checked);

// Buttons
document.getElementById('btn-pause').addEventListener('click', () => {
    paused = !paused;
    document.getElementById('btn-pause').textContent = paused ? '▶️' : '⏸️';
});

document.getElementById('btn-reset').addEventListener('click', () => {
    clearAllBodies();
    loadSolarPreset();
});

document.getElementById('btn-preset').addEventListener('click', () => {
    clearAllBodies();
    loadSolarPreset();
});

// Modal
document.getElementById('btn-add').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.remove('hidden');
});

document.getElementById('btn-modal-cancel').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.add('hidden');
});

document.getElementById('btn-modal-add').addEventListener('click', () => {
    addBody({
        name: document.getElementById('inp-name').value,
        mass: parseFloat(document.getElementById('inp-mass').value),
        radius: parseFloat(document.getElementById('inp-radius').value),
        color: document.getElementById('inp-color').value,
        x: parseFloat(document.getElementById('inp-x').value),
        y: parseFloat(document.getElementById('inp-y').value),
        z: parseFloat(document.getElementById('inp-z').value),
        vx: parseFloat(document.getElementById('inp-vx').value),
        vy: parseFloat(document.getElementById('inp-vy').value),
        vz: parseFloat(document.getElementById('inp-vz').value),
    });
    document.getElementById('modal-overlay').classList.add('hidden');
});

// ─── Solar System Preset ─────────────────────────────────────────────

function loadSolarPreset() {
    const centralMass = 300;
    const G = G_BASE * settings.gravityMul;

    // Sun
    addBody({ name: 'Sun', mass: centralMass, radius: 4, color: '#ffcc00', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 });

    // Planets: compute correct orbital velocity v = sqrt(G * M / r)
    const planets = [
        { name: 'Mercury', mass: 2,  dist: 12, color: '#b0b0b0', inclY: 0 },
        { name: 'Venus',   mass: 5,  dist: 18, color: '#e8a735', inclY: 1 },
        { name: 'Earth',   mass: 6,  dist: 25, color: '#4488ff', inclY: -0.5 },
        { name: 'Mars',    mass: 3,  dist: 32, color: '#cc4422', inclY: 0.8 },
        { name: 'Jupiter', mass: 40, dist: 45, color: '#d4a574', inclY: -1 },
        { name: 'Saturn',  mass: 30, dist: 58, color: '#e8d088', inclY: 1.5 },
        { name: 'Uranus',  mass: 15, dist: 72, color: '#88ccdd', inclY: -0.3 },
        { name: 'Neptune', mass: 15, dist: 88, color: '#4466cc', inclY: 0.5 },
    ];

    for (const p of planets) {
        const v = Math.sqrt(G * centralMass / p.dist);
        // Random angle for initial position in XZ plane
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * p.dist;
        const z = Math.sin(angle) * p.dist;
        // Velocity perpendicular to radius in XZ plane
        const vx = -Math.sin(angle) * v;
        const vz = Math.cos(angle) * v;

        addBody({
            name: p.name,
            mass: p.mass,
            color: p.color,
            x: x,
            y: p.inclY,
            z: z,
            vx: vx,
            vy: 0,
            vz: vz,
        });
    }
}

// ─── Resize ──────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Animation Loop ──────────────────────────────────────────────────

const clock = new THREE.Clock();
let accumulator = 0;
const FIXED_DT = 1 / 120;

function animate() {
    requestAnimationFrame(animate);

    const frameDt = Math.min(clock.getDelta(), 0.05); // cap frame delta

    if (!paused) {
        accumulator += frameDt * settings.speedMul;
        let steps = 0;
        while (accumulator >= FIXED_DT && steps < 8) {
            computeAccelerations();
            integrate(FIXED_DT);
            handleCollisions();
            accumulator -= FIXED_DT;
            steps++;
        }
        if (steps >= 8) accumulator = 0; // prevent spiral of death

        updateRedshift();
        updateCurvatureGrid();
    }

    updateVisuals();
    updateHover();
    controls.update();
    renderer.render(scene, camera);
}

// ─── Init ────────────────────────────────────────────────────────────

computeAccelerations(); // init before first frame
loadSolarPreset();
animate();
