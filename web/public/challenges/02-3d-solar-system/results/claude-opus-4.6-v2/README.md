# 🌌 3D Relativistic Gravity Sandbox

An interactive browser-based 3D n-body gravity simulation with relativity-inspired visual effects.

## Running

```bash
cd results/claude-opus-4.6-v2
python3 -m http.server 8080
# Open http://localhost:8080
```

ES modules require an HTTP server — `file://` won't work.

## Physics Approximations & Stability

| Technique | Details |
|-----------|---------|
| **N-body gravity** | Newtonian pairwise O(n²). `F = G·m₁·m₂ / (r² + ε)` with softening ε=2 to prevent singularities at close approach. |
| **Integration** | Velocity Verlet (leapfrog). Symplectic → conserves energy much better than Euler over long runs. |
| **Fixed timestep** | 1/120s physics step, accumulator-based with max 8 substeps per frame to prevent spiral-of-death. |
| **Clamping** | Max acceleration (800) and max speed (200) prevent numerical blowup from close encounters. |
| **Collision** | Conservative threshold at 0.5× sum of radii to avoid false merges. Merges conserve momentum; mass and radius update. |
| **G_BASE=40** | Tuned for visual appeal at the scale of the scene, not SI units. |

### What's Accurate vs Simplified

- ✅ Gravitational attraction scales correctly with mass and inverse-square distance
- ✅ Orbital velocities computed as `v = √(G·M/r)` for stable circular orbits
- ✅ Momentum conservation on collision
- ⚠️ Softening prevents true point-mass behavior (intentional for stability)
- ⚠️ Redshift effect is qualitative — `z ≈ GM/(rc²)` with fictional c², purely visual
- ❌ No relativistic frame dragging, precession, or actual spacetime curvature

## Rendering & Curvature Visualization

- **Three.js** with `OrbitControls` for camera orbit/pan/zoom
- **Bodies**: `MeshStandardMaterial` spheres with emissive glow + additive-blended sprites
- **Curvature grid**: A wireframe plane below the system. Each vertex is displaced downward proportional to `ΣG·m/(r² + offset)` from all bodies — creating the classic "rubber sheet" depression visualization
- **Gravitational redshift**: Each body's emissive color shifts toward red based on the gravitational potential at its location from all other bodies. Deep in a well → red. Far away → original color.
- **Trails**: Per-body line geometry storing last N positions
- **Starfield**: Random point cloud for atmosphere

## Adding Bodies & Tweaking Parameters

### Via UI
Click **➕ Add Body** → fill in mass, position, velocity, color → Add.

### Via Code
```js
addBody({
    name: 'Comet',
    mass: 1,
    color: '#00ffaa',
    x: 40, y: 5, z: 0,
    vx: -10, vy: 0, vz: 15
});
```

### Key Parameters
- **G_BASE** (line 5): Base gravitational constant. Higher = stronger pull.
- **SOFTENING** (line 6): Prevents division-by-zero. Higher = gentler close encounters.
- **MAX_ACCEL / MAX_SPEED**: Safety clamps.
- **COLLISION_FACTOR** (line 9): 0.5 = bodies must overlap 50% of combined radii to merge.
- **Gravity slider**: Runtime multiplier on G_BASE.
- **Speed slider**: Scales simulation time.
- **Trail slider**: Number of trail points retained.

## Controls
- **Orbit**: Left-click drag
- **Pan**: Shift + drag (or middle-click)
- **Zoom**: Scroll wheel
- **Pause/Resume**: ⏸️ button
- **Reset**: 🔄 loads default solar system
