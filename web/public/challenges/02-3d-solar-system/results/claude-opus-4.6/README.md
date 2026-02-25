# N-Body Gravity Sandbox — Spacetime Curvature Visualization

A real-time 3D gravitational simulation with spacetime curvature visualization, built with Three.js. No build step required — just open `index.html`.

## How to Use

1. Open `index.html` in a modern browser (Chrome/Firefox/Safari)
2. The solar preset loads automatically with a central star and 5 orbiting bodies
3. **Camera**: Drag to orbit, scroll to zoom, right-drag to pan
4. **Add bodies**: Use the panel buttons — random bodies get tangential velocity for orbital motion
5. **Double-click** a body to delete it
6. Toggle overlays, adjust gravity/speed/trails with the controls

## Physics

### N-Body Gravity
Standard Newtonian pairwise gravitational acceleration: `a_i = Σ G·m_j·(r_j - r_i) / |r_j - r_i|³`

### Stability Measures
- **Softening parameter** (ε = 4): Prevents singularity at zero distance. Force denominator uses `r² + ε²`
- **Leapfrog integrator**: Symplectic, conserves energy better than Euler over long runs (kick-drift-kick variant)
- **Adaptive sub-stepping**: Large timesteps are divided into sub-steps of ≤8ms to maintain stability
- **Speed clamping**: Velocity magnitude capped at 80 units/s to prevent ejections

### Collisions
Radius-based overlap detection. On collision: masses add, momentum is conserved (`v_merged = (m₁v₁ + m₂v₂)/(m₁+m₂)`), radius scales as `m^(1/3)`.

### Relativity-Inspired Effect: Gravitational Redshift
Bodies near heavy masses experience a visual hue shift toward red, proportional to the local gravitational potential (`Σ m/r`). This mimics how light climbing out of a gravity well loses energy and shifts red. Emissive intensity also increases near deep potential wells — bodies glow hotter when close to massive objects.

## Rendering

- **Three.js** with ACES filmic tone mapping for cinematic look
- **Glow sprites**: Additive-blended radial gradient sprites on each body
- **Trails**: Line geometry with rolling buffer (configurable length)
- **Curvature grid**: A horizontal wireframe plane whose vertices are displaced downward proportional to `Σ mass/distance` — heavier/closer bodies create deeper wells
- **Starfield**: 3000 random background points for depth
- **Velocity arrows**: Optional ArrowHelper overlays showing direction and magnitude

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | Entry point, imports Three.js via CDN importmap |
| `styles.css` | UI panel styling, glassmorphic dark theme |
| `script.js` | All simulation logic, rendering, and UI binding |
| `README.md` | This file |
