# Mallflow Pygame Simulation

The interactive React preview is in the project root. This standalone Pygame version runs the same mall scenario and centralized fleet-control concept.

## Run

```bash
python -m pip install -r pygame_sim/requirements.txt
python pygame_sim/main.py
```

## Controls

- Space: pause or resume
- R: reset the scenario
- S: cycle simulation speed
- 1: toggle static-risk overlay
- 2: toggle moving-device risk overlay
- 3: toggle predicted human trajectories
- 4: toggle fleet routes
- Plus / minus: increase or decrease pedestrian density
- Click a robot in the fleet list to focus its route
- Drag the density and risk-aversion sliders

## Paper Boundary

Huang's IHF article 268 describes Gaussian-process human-motion prediction, dynamic risk mapping, global RRT* planning, and local DWA control. The publication does not specify a reproducible GP kernel, complete collision-risk equation, planning coefficients, or multi-robot shared-state protocol. Both implementations make those choices explicit as demo defaults and should not be treated as an exact or independently validated reproduction.