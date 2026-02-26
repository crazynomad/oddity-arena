# Challenge 02: 3D 太阳系沙盒

生成一个网页上的 3D 沙盒，以动画形式模拟太阳系的天体运动，能够调节质量、位置、速度等参数，并能添加新的天体。

## Prompt

You are building an interactive 3D educational sandbox in the browser that *visually* evokes special/general relativity, but uses a simplified n-body gravity approximation. Favor stability, clarity, and smooth interactivity over physical completeness.

### Outcome

A real-time 3D simulation where users can add/remove multiple bodies and see:
1. Bodies moving in 3D under mutual attraction
2. A visible "spacetime/curvature" visualization affected by mass
3. Trajectories/trails
4. Collisions and mergers

### Hard constraints

- Frontend only (no backend).
- No build step / no package manager. CDN libraries allowed.
- Must be true 3D: camera orbit/pan/zoom shows parallax and depth; bodies exist in 3D space.
- Smooth for ~10-20 bodies on a typical laptop.

### Minimum feature checklist (must ship)

1. 3D scene + camera controls (orbit/pan/zoom).
2. Bodies: Create/delete at runtime. Each body has: mass, position (x,y,z), velocity (vx,vy,vz).
3. Dynamics: N-body gravitational acceleration in 3D (Newtonian), with numerical-stability measures. Add ONE "relativity-inspired" visual effect.
4. Collisions: Detect when bodies overlap (radius-based). Merge with conservation of momentum.
5. Interactivity: Pause/resume, reset. Toggle overlays. Sliders for gravity strength, simulation speed, trail length.
6. Curvature visualization: Represent "curvature" visibly, responding to mass.

### Deliverables

- index.html, styles.css, script.js
- README explaining physics approximations and rendering approach.

## 评测重点

- 3D 效果和视觉质量
- 交互流畅度
- 操控面板设计
- 引力网格线 / 曲率可视化
