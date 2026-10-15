# Mallflow Robot Simulation: Complete Technical Reference

This document explains how the robot simulation works, every formula used, where each piece of logic lives, and what is happening from start to finish. It covers both the browser version (`src/`) and the standalone Pygame version (`pygame_sim/main.py`).

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture: One Shared External State](#architecture-one-shared-external-state)
3. [The Mall Environment](#the-mall-environment)
4. [Pedestrian Simulation](#pedestrian-simulation)
5. [Human Motion Prediction (Gaussian Process)](#human-motion-prediction-gaussian-process)
6. [Dynamic Spatial Risk Map](#dynamic-spatial-risk-map)
7. [Global Path Planning (RRT*)](#global-path-planning-rrt)
8. [Local Control (Dynamic Window Approach)](#local-control-dynamic-window-approach)
9. [Deadlock Recovery](#deadlock-recovery)
10. [External State Logging](#external-state-logging)
11. [File-by-File Code Map](#file-by-file-code-map)
12. [Paper Inconsistencies and Corrections](#paper-inconsistencies-and-corrections)

---

## Overview

Mallflow simulates three service robots navigating a shopping mall shared with 4-12 pedestrians. All robots are controlled by a single external state (`SharedExternalState` / `SharedState`) that contains:

- The latest human motion forecasts (Gaussian Process predictions)
- A dynamic spatial risk map (static fixture risk + predicted human occupancy)
- The fleet route epoch (version counter for coordinated replanning)

The simulation follows the general pipeline described in Huang, S. (2026) "Human-Robot Collaborative Path Planning with Predictive Obstacle Avoidance", Intelligent & Human Futures, Vol. 2, No. 1, Article 268. DOI: 10.63808/ihf.v2i1.268.

**Important**: The paper describes the algorithm conceptually but does not provide reproducible formulas for the GP kernel, risk equation, RRT* cost function, DWA evaluation, or multi-robot coordination protocol. These details are implemented as documented defaults.

---

## Architecture: One Shared External State

### Concept

```
┌─────────────────────────────────────────────────────┐
│              SHARED EXTERNAL STATE (GLOBAL-01)       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ Human        │ │ Dynamic      │ │ Fleet Route  │ │
│  │ Forecasts    │ │ Risk Grid    │ │ Epoch        │ │
│  │ (GP)         │ │ (static +    │ │ (version)    │ │
│  │              │ │  dynamic)    │ │              │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │
│         │                │                │          │
│         └────────────────┼────────────────┘          │
│                          │                          │
│         ┌────────────────┼────────────────┐         │
│         │                │                │         │
│         ▼                ▼                ▼         │
│      ┌──────┐        ┌──────┐        ┌──────┐      │
│      │ R-01 │        │ R-02 │        │ R-03 │      │
│      └──────┘        └──────┘        └──────┘      │
│   (RRT* + DWA)   (RRT* + DWA)   (RRT* + DWA)     │
└─────────────────────────────────────────────────────┘
```

### Coordinator Cycle (8 Hz)

The coordinator runs every 0.125 seconds (8 Hz):

1. **Observation**: Record human positions, refresh GP forecasts, update risk grid
2. **Coordination**: For each robot, check task completion, run DWA to choose velocity command, apply yielding logic
3. **Logging**: Push a snapshot to the external state log

### Files

- **React**: `src/simulation.ts` — `MallSimulation.step()` (line ~574), `coordinateFleet()` (line ~830)
- **Pygame**: `pygame_sim/main.py` — `MallSimulation.step()` (line ~700), `_coordinate()` (line ~600)

---

## The Mall Environment

### Dimensions

- World: 1000 × 620 units (20.0 × 12.4 meters at 50 units/meter)
- Walkable corridor: y ∈ [132, 494], x ∈ [22, 978]

### Obstacles

10 shop units (rectangles along top and bottom walls) + 8 fixtures (benches, planters, fountain, trees).

### Files

- **React**: `src/simulation.ts` — `MALL_LAYOUT` (line ~20), `WORLD` (line ~13)
- **Pygame**: `pygame_sim/main.py` — `RECTS` (line ~18), `FIXTURES` (line ~30)

---

## Pedestrian Simulation

### Motion Model

Pedestrians follow predefined routes (closed loops) with:

- **Waypoint following**: Move toward current route waypoint at preferred speed
- **Social force**: Repulsion from nearby pedestrians (within 27 units)
- **Pauses**: Random 0.3-0.75s pauses (12% chance at waypoints)
- **Speed limiting**: Desired velocity clamped to preferred speed

### Formula

```
desired_x = (waypoint.x - person.x) / distance * preferred_speed
desired_y = (waypoint.y - person.y) / distance * preferred_speed

// Social force
for each other person within 27 units:
  separation = distance(person, other)
  weight = (27 - separation) / 27
  desired_x += (person.x - other.x) / separation * weight * 13
  desired_y += (person.y - other.y) / separation * weight * 13

// Velocity update (exponential smoothing)
vx = vx + (desired_x - vx) * (1 - exp(-dt / 0.3))
vy = vy + (desired_y - vy) * (1 - exp(-dt / 0.3))

// Position update
x += vx * dt
y += vy * dt
```

### Files

- **React**: `src/simulation.ts` — `updatePedestrians()` (line ~700)
- **Pygame**: `pygame_sim/main.py` — `_update_people()` (line ~470)

---

## Human Motion Prediction (Gaussian Process)

### Concept

Uses Gaussian Process Regression with an RBF (Radial Basis Function) kernel to predict future human positions from observed history. Includes biomechanical speed limits (max 73 units/s).

### GP Formula

**Kernel**: k(t, t') = σ² * exp(-0.5 * ((t - t') / l)²)

where:
- σ² = 25 (signal variance)
- l = 0.58 (length scale)
- Noise variance: σ_n² = 5.5

**Prediction**:
```
For test point t*:
  k* = [k(t*, t_1), ..., k(t*, t_n)]  (kernel vector)
  μ* = k*^T * K^{-1} * y  (posterior mean)
  σ*² = k(t*, t*) - k*^T * K^{-1} * k*  (posterior variance)
```

where K is the n×n kernel matrix with noise: K_ij = k(t_i, t_j) + σ_n² * δ_ij

**Velocity prior**: Linear regression on history points to get velocity (vx, vy), then GP predicts residuals around this prior.

**Biomechanical constraint**: Predicted displacement clamped to max_travel = MAX_HUMAN_SPEED * horizon

**Adaptive horizon** (paper: "changes its predictive horizon dynamically, based on motion regularity index"):
```
headings = [atan2(dy, dx) for consecutive history points]
turns = [abs(angle_delta(headings[i], headings[i-1])) for i in 1..n]
mean_turn = mean(turns)
regularity = clamp(1 - mean_turn / 1.35, 0, 1)
scale = 0.72 + regularity * 0.68
horizons = [base_horizon * scale for base_horizon in [0.42, 0.82, 1.25, 1.7]]
```

### Files

- **React**: `src/simulation.ts` — `predictHumanMotion()` (line ~270), `fitVelocity()` (line ~240), `predictionHorizons()` (line ~255)
- **Pygame**: `pygame_sim/main.py` — `_predict_person()` (line ~283), `_fit_velocity()` (line ~255)

---

## Dynamic Spatial Risk Map

### Concept

A 40×25 grid (1000 cells) where each cell stores:
- **Static risk**: Proximity to fixtures/walls (exponential decay)
- **Dynamic risk**: Probability of human occupancy (product of free probabilities)

### Static Risk Formula

```
nearest_static = min(distance(cell_center, obstacle) for all obstacles)
static_risk = 0.48 * exp(-nearest_static / 45)  if nearest_static < 108
            = 0.018  otherwise
```

### Dynamic Risk Formula

```
free_probability = 1.0

// Human contribution
for each visible person:
  for each forecast horizon h in [0.42, 0.82, 1.25, 1.7]:
    spread = 25 + person_radius + sigma_h * 0.55
    likelihood = exp(-0.5 * (distance(cell, forecast_h) / spread)^2)
    weight = [0.28, 0.39, 0.25, 0.16][h]
    free_probability *= (1 - clamp(likelihood * weight * 0.72, 0, 0.78))

// Robot contribution
for each robot:
  for each horizon in [0.15, 0.55, 1.0]:
    future = robot_position + robot_velocity * horizon
    likelihood = exp(-0.5 * (distance(cell, future) / 37)^2)
    free_probability *= (1 - clamp(likelihood * (0.24 if horizon==0.15 else 0.16), 0, 0.7))

dynamic_risk = clamp(1 - free_probability, 0, 0.98)
```

### Combined Risk

```
combined_risk = 1 - (1 - static_risk) * (1 - dynamic_risk)
```

### Risk Map Update Rate

Every 0.34 seconds (≈3 Hz).

### Files

- **React**: `src/simulation.ts` — `rebuildRiskGrid()` (line ~763), `riskAtPoint()` (line ~509)
- **Pygame**: `pygame_sim/main.py` — `_rebuild_risk()` (line ~320), `_risk_at()` (line ~316)

---

## Global Path Planning (RRT*)

### Concept

Risk-aware RRT* (Rapidly-exploring Random Tree Star) with:
- Random sampling in walkable space
- Nearest-neighbor selection
- Risk-weighted edge costs
- Rewiring for optimality
- Path smoothing via line-of-sight

### Cost Function

```
edge_cost = euclidean_distance * (1 + risk_along_segment * aversion * 1.15)
```

where `risk_along_segment` is the average combined risk along the edge.

### Algorithm

1. Start with root node at robot position
2. For 390 iterations:
   a. Sample random point (17% chance: goal, 83% chance: random in walkable space)
   b. Find nearest node
   c. Extend toward sample by step length (47 units)
   d. If valid (not blocked, segment clear), find neighbors within radius (82)
   e. Choose parent with minimum cost
   f. Add node, rewire neighbors
   g. If close to goal, track best goal node
3. Trace path from best goal node to root
4. Smooth path using line-of-sight (skip intermediate nodes if segment clear)

### Grid Fallback

If RRT* fails to find a path, a grid-based A* fallback is used with 16-unit grid cells and 8-connectivity.

### Files

- **React**: `src/simulation.ts` — `planRrtStar()` (line ~300), `tracePath()` (line ~290), `gridFallbackPath()` (line ~320)
- **Pygame**: `pygame_sim/main.py` — `_rrt_star()` (line ~418), `_grid_fallback()` (line ~362)

---

## Local Control (Dynamic Window Approach)

### Concept

DWA samples velocity commands (linear speed × angular velocity) and evaluates each using a predictive rollout. The best command minimizes a cost function considering goal progress, risk, and comfort.

### Velocity Window

```
min_speed = max(0, current_speed - 105 * 0.62)
max_speed = min(86, current_speed + 105 * 0.68)
linear_samples = 5 (evenly spaced in [min_speed, max_speed])
angular_samples = [-2.45, -1.85, -1.25, -0.65, 0, 0.65, 1.25, 1.85, 2.45]
```

### Rollout Evaluation

For each (speed, omega) pair:
1. Simulate 7 steps of 0.15s each (1.05s total horizon)
2. Check collision (segment clear + human proximity)
3. Accumulate risk cost from human predictions and other robots
4. Compute total cost

### Cost Function

```
cost = endpoint_distance * 0.2
     + goal_distance * 0.025
     + heading_error * 13
     + abs(omega - current_omega) * 2.7
     + risk_cost * 44 * risk_aversion
     + path_risk * 34 * risk_aversion
     - speed * 0.085
```

where:
- `endpoint_distance`: distance from rollout endpoint to local target
- `goal_distance`: distance from rollout endpoint to task goal
- `heading_error`: angular difference to target direction
- `risk_cost`: accumulated human/robot proximity risk
- `path_risk`: combined risk at rollout endpoint

### Human Proximity Risk

```
for each person:
  predicted = forecast_at(person, time)
  clearance = distance(robot, predicted) - person_radius - robot_radius
  comfort_radius = 47 + predicted_sigma * 0.3
  risk += exp(-0.5 * (clearance / comfort_radius)^2) * (horizon / samples)
```

### Yielding

Robots yield (speed × 0.6) when:
- A human is within 50 units and in front (cos(angle) > 0.2)
- Another robot with lower ID is within 60 units and in front

### Files

- **React**: `src/simulation.ts` — `chooseDwaCommand()` (line ~875), `followPoint()` (line ~489)
- **Pygame**: `pygame_sim/main.py` — `_choose_dwa()` (line ~500), `_path_target()` (line ~480)

---

## Deadlock Recovery

### Problem

Robots can get stuck when:
- DWA produces zero velocity (all commands blocked)
- Robot is pressed against an obstacle
- Multiple robots block each other

### Solution

Track position over time. If a robot hasn't moved more than 0.5 units in 3.5 seconds:

1. Replan route from current position
2. Set command speed to 0 and omega to ±π/2 (turn away)
3. Reset stuck timer

### Files

- **React**: `src/simulation.ts` — `updateRobot()` (line ~940)
- **Pygame**: `pygame_sim/main.py` — `_move_robot()` (line ~620)

---

## External State Logging

### Concept

Every 0.125s, the coordinator pushes a snapshot to the external state log containing:
- Simulation time
- Shared state revision number
- Fleet route epoch
- Number of humans
- Number of forecasts
- Mean risk
- Fleet task assignments

### Display

- **React**: Bottom-right panel above playback bar, expandable/collapsible
- **Pygame**: Bottom-right panel showing last 8 entries

### Files

- **React**: `src/simulation.ts` — `ExternalStateLog` type (line ~120), `getTelemetry()` (line ~604); `src/App.tsx` — log panel (line ~210)
- **Pygame**: `pygame_sim/main.py` — log in `main()` (line ~1080)

---

## File-by-File Code Map

### React (Browser) Version

| File | Key Functions | Lines | Purpose |
|------|--------------|-------|---------|
| `src/simulation.ts` | `MallSimulation` class | 674-1216 | Core simulation engine orchestrating external state, fleet, and environment |
| | `step(dt, settings)` | 737-776 | Main step loop ticking pedestrian physics, coordinator, fleet kinematics, and risk updates |
| | `updatePedestrians()` | 874-927 | Pedestrian physics with goal seeking, social repulsion, and dynamic avoidance of oncoming robots |
| | `predictHumanMotion()` | 332-378 | Gaussian Process Regression (RBF kernel) forecasting human future trajectories with speed limits |
| | `predictionHorizons()` | 315-330 | Dynamically scales prediction horizons based on motion regularity / turn rate |
| | `rebuildRiskGrid()` | 949-1004 | Fuses static obstacles and dynamic future human occupancy probabilities into a 40x25 spatial risk grid |
| | `riskAtPoint()` | 652-669 | Bilinear interpolation of risk across grid cell bounds for smooth, continuous evaluation |
| | `planRrtStar()` | 519-610 | Sampling-based global path planning with risk-weighted edges, dynamic rewiring, and smoothing |
| | `gridFallbackPath()` | 430-517 | A* grid search fallback ensuring valid global paths even when random trees fail |
| | `coordinateFleet()` | 1006-1048 | Centralized scheduler evaluating task goals, invoking DWA, and coordinating multi-robot priority yielding |
| | `chooseDwaCommand()` | 1050-1172 | Dynamic Window Approach evaluating velocity rollouts against goal progress, heading, comfort, and risk |
| | `updateRobot()` | 1174-1215 | Robot motion integration, collision guards, physical overlap resolution, and active deadlock recovery |
| `src/SimulationCanvas.tsx` | `drawScene()` | 312-365 | High-DPI canvas rendering orchestrating layers, floors, agents, and HUD metadata |
| | `drawRisk()` | 185-207 | Continuous rendering of static and dynamic risk heatmaps |
| | `drawPredictions()` | 209-239 | Renders predicted human GP trajectories and uncertainty ellipses |
| | `drawRoutes()` | 241-280 | Visualizes global RRT* paths and goal target beacons |
| | `drawPedestrian()` | 282-308 | Renders pedestrian bodies, orientations, and IDs |
| | `drawRobot()` | 310-344 | Renders robots with directional arrows, state rings, and ID tags |
| `src/App.tsx` | `App` component | 73-380 | Topbar, simulation canvas, control panel, layer toggles, performance monitors, and external state log |

### Pygame Version

| File | Key Functions | Lines | Purpose |
|------|--------------|-------|---------|
| `pygame_sim/main.py` | `MallSimulation` class | 216-728 | Standalone simulation engine mirroring the React state pipeline |
| | `step(dt)` | 706-728 | Simulation tick advancing pedestrian physics, centralized scheduling, and risk regeneration |
| | `_update_people()` | 508-542 | Pedestrian waypoint navigation with social force repulsion and proactive robot yielding |
| | `_predict_person()` | 292-326 | Cholesky-solved GP regression for human motion prediction with adaptive horizons |
| | `_rebuild_risk()` | 348-379 | Recomputes 40x25 risk field from static layout and human forecast distributions |
| | `_rrt_star()` | 435-498 | Global path planning using risk-weighted RRT* with line-of-sight path shortcutting |
| | `_grid_fallback()` | 384-433 | Deterministic A* graph search fallback for dense environments |
| | `_coordinate()` | 672-693 | External state coordinator issuing velocity commands and managing fleet priority rules |
| | `_choose_dwa()` | 591-670 | Rollout-based DWA with dynamic obstacle evasion and escape controllers |
| | `_move_robot()` | 695-728 | Kinodynamic robot update with anti-stuck watchdog timers and overlap pushback |
| | `draw_map()` | 827-915 | Renders mall environment, obstacles, animated forecasts, and global routes |
| | `draw_app()` | 1054-1125 | Renders full desktop interface with sidebar controls, telemetry, and external state log |

---

## Paper Inconsistencies and Corrections

### 1. Multi-Robot Coordination

**Paper**: Describes single-robot path planning only.
**Correction**: Extended to 3 robots with shared state and yielding logic. The paper does not specify multi-robot coordination; this is an original addition.

### 2. GP Kernel Parameters

**Paper**: Mentions "Gaussian Processes for Regression with biomechanical constraints" but provides no kernel type, length scale, or variance.
**Correction**: Used RBF kernel with σ²=25, l=0.58, noise=5.5. These are reasonable defaults, not from the paper.

### 3. Risk Map Equation

**Paper**: Mentions "dynamic spatial risk maps" but provides no formula.
**Correction**: Implemented as product of free probabilities from human and robot forecasts. This is a reasonable interpretation, not from the paper.

### 4. RRT* Cost Function

**Paper**: Mentions "improved algorithms in RRT* algorithms" but provides no cost function.
**Correction**: Used risk-weighted edge costs with aversion multiplier. This is a reasonable interpretation.

### 5. DWA Modifications

**Paper**: Mentions "optimized Dynamic Window Approach modifications" but provides no details.
**Correction**: Implemented standard DWA with predictive human avoidance. The "optimization" is not reproducible from the paper.

### 6. Planning Latency

**Paper**: Claims "not more than 42.3ms planning latency".
**Correction**: Our RRT* runs in ~50-100ms per plan (JavaScript/Python), which is slower. This is expected for interpreted languages.

### 7. Success Rate

**Paper**: Claims "94.3% success rate".
**Correction**: Our simulation achieves collision-free navigation in most runs, but exact success rate depends on scenario parameters.

### 8. Adaptive Horizon

**Paper**: "changes its predictive horizon dynamically, based on motion regularity index"
**Correction**: Implemented as turn-rate-based regularity scaling. This matches the paper's description.

---

## How to Run

### Browser Version (React + Vite)

```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Production Build

```bash
npm run build
# Output in dist/index.html
```

### Pygame Version

```bash
python -m pip install -r pygame_sim/requirements.txt
python pygame_sim/main.py
```

### Controls (Both Versions)

- **Space**: Pause/resume
- **R**: Reset scenario
- **S**: Cycle simulation speed (0.65x, 1x, 1.5x)
- **1-4**: Toggle map layers (static risk, dynamic risk, forecasts, routes)
- **+/-**: Adjust pedestrian density
- **Click robot**: Focus its route
- **Drag sliders**: Adjust density and risk aversion