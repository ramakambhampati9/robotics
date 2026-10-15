import { useEffect, useRef } from "react";
import {
  MALL_LAYOUT,
  MallSimulation,
  METERS_PER_WORLD_UNIT,
  WORLD,
  type Obstacle,
  type Pedestrian,
  type Robot,
  type SimulationSettings,
  type SimulationTelemetry,
} from "./simulation";

export type MapLayers = {
  staticRisk: boolean;
  dynamicRisk: boolean;
  forecast: boolean;
  routes: boolean;
};

type SimulationCanvasProps = {
  running: boolean;
  settings: SimulationSettings;
  layers: MapLayers;
  selectedRobot: string | null;
  resetSignal: number;
  speedScale: number;
  onTelemetry: (telemetry: SimulationTelemetry) => void;
};

type MapTransform = { scale: number; offsetX: number; offsetY: number };

const roundRect = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
};

function setFont(context: CanvasRenderingContext2D, size: number, weight = 500) {
  context.font = `${weight} ${size}px Inter, ui-sans-serif, system-ui, sans-serif`;
}

function getMapTransform(width: number, height: number): MapTransform {
  const padding = 24;
  const scale = Math.min((width - padding * 2) / WORLD.width, (height - padding * 2) / WORLD.height);
  return {
    scale,
    offsetX: (width - WORLD.width * scale) / 2,
    offsetY: (height - WORLD.height * scale) / 2,
  };
}

function drawFloor(context: CanvasRenderingContext2D, fontScale: number) {
  context.fillStyle = "#eeece5";
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  context.fillStyle = "#f5f2eb";
  context.fillRect(14, 122, WORLD.width - 28, 376);

  context.strokeStyle = "rgba(87, 99, 90, 0.075)";
  context.lineWidth = 1;
  for (let x = 24; x <= 980; x += 40) {
    context.beginPath();
    context.moveTo(x, 126);
    context.lineTo(x, 494);
    context.stroke();
  }
  for (let y = 136; y <= 486; y += 40) {
    context.beginPath();
    context.moveTo(16, y);
    context.lineTo(984, y);
    context.stroke();
  }

  context.strokeStyle = "rgba(97, 109, 101, 0.17)";
  context.setLineDash([3, 7]);
  context.lineWidth = 1.3;
  context.beginPath();
  context.moveTo(35, 151);
  context.lineTo(965, 151);
  context.moveTo(35, 479);
  context.lineTo(965, 479);
  context.stroke();
  context.setLineDash([]);

  setFont(context, 9 / fontScale, 700);
  context.fillStyle = "rgba(85, 99, 91, 0.58)";
  context.textAlign = "left";
  context.fillText("NORTH WALK", 34, 144);
  context.fillText("SOUTH WALK", 34, 472);
  context.textAlign = "right";
  context.fillText("LEVEL 01   /   ATRIUM EAST", 967, 144);
  context.fillText("LEVEL 01   /   ATRIUM WEST", 967, 472);
  context.textAlign = "left";

  context.strokeStyle = "rgba(43, 65, 56, 0.26)";
  context.lineWidth = 1.4;
  roundRect(context, 11, 12, WORLD.width - 22, WORLD.height - 24, 6);
  context.stroke();
}

function drawObstacle(context: CanvasRenderingContext2D, obstacle: Obstacle, fontScale: number) {
  if (obstacle.kind === "rect") {
    if (obstacle.type === "shop") {
      context.fillStyle = "#e2ded5";
      context.strokeStyle = "#c8c3b8";
      context.lineWidth = 1.2;
      roundRect(context, obstacle.x, obstacle.y, obstacle.w, obstacle.h, 3);
      context.fill();
      context.stroke();

      context.fillStyle = obstacle.accent ?? "#7f9586";
      context.fillRect(obstacle.x + 1, obstacle.y + 1, obstacle.w - 2, 4);
      context.fillStyle = "rgba(114, 118, 106, 0.24)";
      context.fillRect(obstacle.x + 13, obstacle.y + 22, 18, 18);
      context.fillRect(obstacle.x + obstacle.w - 33, obstacle.y + 22, 18, 18);
      context.strokeStyle = "rgba(87, 99, 90, 0.35)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(obstacle.x + 11, obstacle.y + 62);
      context.lineTo(obstacle.x + obstacle.w - 11, obstacle.y + 62);
      context.stroke();
      setFont(context, 10 / fontScale, 700);
      context.fillStyle = "#53635b";
      context.textAlign = "center";
      context.fillText(obstacle.label, obstacle.x + obstacle.w / 2, obstacle.y + 57, obstacle.w - 28);
    } else {
      context.fillStyle = obstacle.label === "PLANTER" ? "#e0e6d8" : "#e7e4dc";
      context.strokeStyle = obstacle.label === "PLANTER" ? "#b9c5b4" : "#cbc8bf";
      context.lineWidth = 1.1;
      roundRect(context, obstacle.x, obstacle.y, obstacle.w, obstacle.h, 7);
      context.fill();
      context.stroke();

      if (obstacle.label === "BENCH") {
        context.strokeStyle = "rgba(128, 116, 96, 0.35)";
        context.lineWidth = 2;
        for (let offset = 8; offset < obstacle.w - 4; offset += 11) {
          context.beginPath();
          context.moveTo(obstacle.x + offset, obstacle.y + 5);
          context.lineTo(obstacle.x + offset, obstacle.y + obstacle.h - 5);
          context.stroke();
        }
      } else if (obstacle.label === "LOUNGE") {
        context.fillStyle = "#a9b4a8";
        roundRect(context, obstacle.x + 8, obstacle.y + 10, 30, 18, 5);
        context.fill();
        roundRect(context, obstacle.x + 55, obstacle.y + 10, 30, 18, 5);
        context.fill();
        context.strokeStyle = "rgba(104, 118, 106, 0.45)";
        context.beginPath();
        context.moveTo(obstacle.x + 49, obstacle.y + 8);
        context.lineTo(obstacle.x + 49, obstacle.y + 46);
        context.stroke();
      } else {
        context.fillStyle = "#a9bba4";
        roundRect(context, obstacle.x + 9, obstacle.y + 11, obstacle.w - 18, obstacle.h - 22, 6);
        context.fill();
        context.fillStyle = "#819b7f";
        for (let leaf = 0; leaf < 4; leaf += 1) {
          context.beginPath();
          context.arc(obstacle.x + 25 + leaf * 19, obstacle.y + obstacle.h / 2, 4 + (leaf % 2), 0, Math.PI * 2);
          context.fill();
        }
      }
      context.textAlign = "center";
      setFont(context, 7.5 / fontScale, 700);
      context.fillStyle = "rgba(80, 99, 88, 0.8)";
      context.fillText(obstacle.label, obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h + 10);
    }
    return;
  }

  if (obstacle.label === "FOUNTAIN") {
    context.fillStyle = "#d9e4df";
    context.strokeStyle = "#aebdb4";
    context.lineWidth = 1.2;
    context.beginPath();
    context.arc(obstacle.x, obstacle.y, obstacle.r + 5, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = "#b8cbc2";
    context.beginPath();
    context.arc(obstacle.x, obstacle.y, obstacle.r - 3, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255, 255, 255, 0.7)";
    context.beginPath();
    context.arc(obstacle.x, obstacle.y, obstacle.r - 13, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#8faea2";
    context.beginPath();
    context.arc(obstacle.x, obstacle.y, 5, 0, Math.PI * 2);
    context.fill();
    setFont(context, 7 / fontScale, 700);
    context.fillStyle = "#658174";
    context.textAlign = "center";
    context.fillText("FOUNTAIN", obstacle.x, obstacle.y + obstacle.r + 18);
  } else {
    context.fillStyle = obstacle.label === "TREE" ? "#dfe8dc" : "#dce4d9";
    context.strokeStyle = "#bdc9b8";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(obstacle.x, obstacle.y, obstacle.r, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = "#8eaa89";
    context.beginPath();
    context.arc(obstacle.x, obstacle.y, obstacle.r * 0.52, 0, Math.PI * 2);
    context.fill();
  }
}

function drawRisk(context: CanvasRenderingContext2D, simulation: MallSimulation, layers: MapLayers) {
  if (!layers.staticRisk && !layers.dynamicRisk) return;
  const cellWidth = WORLD.width / simulation.shared.riskColumns;
  const cellHeight = WORLD.height / simulation.shared.riskRows;
  for (let row = 0; row < simulation.shared.riskRows; row += 1) {
    for (let column = 0; column < simulation.shared.riskColumns; column += 1) {
      const cell = simulation.shared.riskGrid[row * simulation.shared.riskColumns + column];
      if (!cell) continue;
      if (layers.staticRisk && cell.staticRisk > 0.045) {
        context.fillStyle = `rgba(206, 151, 77, ${Math.min(0.27, cell.staticRisk * 0.42)})`;
        context.fillRect(column * cellWidth, row * cellHeight, cellWidth + 0.5, cellHeight + 0.5);
      }
      if (layers.dynamicRisk && cell.dynamicRisk > 0.04) {
        const alpha = Math.min(0.47, 0.055 + cell.dynamicRisk * 0.38);
        context.fillStyle = cell.dynamicRisk > 0.66
          ? `rgba(191, 81, 63, ${alpha})`
          : `rgba(222, 127, 77, ${alpha})`;
        context.fillRect(column * cellWidth, row * cellHeight, cellWidth + 0.5, cellHeight + 0.5);
      }
    }
  }
}

function drawPredictions(context: CanvasRenderingContext2D, time: number, people: Pedestrian[], fontScale: number) {
  context.save();
  context.lineWidth = 1.5;
  context.setLineDash([4, 6]);
  context.lineDashOffset = -(time * 8) % 10;

  for (const person of people) {
    if (person.forecast.length === 0) continue;
    context.strokeStyle = `${person.color}99`;
    context.beginPath();
    context.moveTo(person.x, person.y);
    for (const future of person.forecast) context.lineTo(future.x, future.y);
    context.stroke();
    context.setLineDash([]);

    for (let index = 0; index < person.forecast.length; index += 1) {
      const future = person.forecast[index];
      const opacity = 0.15 + index * 0.035;
      context.fillStyle = `${person.color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
      context.beginPath();
      context.ellipse(future.x, future.y, future.sigma + 10, (future.sigma + 10) * 0.72, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = person.color;
      context.beginPath();
      context.arc(future.x, future.y, index === person.forecast.length - 1 ? 3 : 2.2, 0, Math.PI * 2);
      context.fill();
    }
    context.setLineDash([4, 6]);
  }

  context.setLineDash([]);
  context.restore();
  setFont(context, 7.5 / fontScale, 650);
  context.fillStyle = "rgba(72, 84, 78, 0.72)";
  context.textAlign = "left";
}

function drawRoutes(context: CanvasRenderingContext2D, robots: Robot[], time: number, selectedRobot: string | null, fontScale: number) {
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const robot of robots) {
    if (robot.route.length < 2) continue;
    const focused = !selectedRobot || selectedRobot === robot.id;
    context.globalAlpha = focused ? 0.76 : 0.17;
    context.strokeStyle = robot.color;
    context.lineWidth = focused ? 3.3 : 2.2;
    context.setLineDash([7, 7]);
    context.lineDashOffset = -(time * 13) % 14;
    context.beginPath();
    context.moveTo(robot.x, robot.y);
    const first = Math.min(Math.max(1, robot.routeIndex), robot.route.length - 1);
    for (let index = first; index < robot.route.length; index += 1) {
      context.lineTo(robot.route[index].x, robot.route[index].y);
    }
    context.stroke();
    context.setLineDash([]);

    const goal = robot.taskPoint;
    context.globalAlpha = focused ? 0.92 : 0.25;
    context.strokeStyle = robot.color;
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(goal.x, goal.y, 10, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(goal.x - 14, goal.y);
    context.lineTo(goal.x + 14, goal.y);
    context.moveTo(goal.x, goal.y - 14);
    context.lineTo(goal.x, goal.y + 14);
    context.stroke();
    context.fillStyle = robot.color;
    context.beginPath();
    context.arc(goal.x, goal.y, 2.5, 0, Math.PI * 2);
    context.fill();
    setFont(context, 7.5 / fontScale, 750);
    context.textAlign = "left";
    context.fillStyle = robot.color;
    context.fillText(robot.taskLabel, goal.x + 13, goal.y - 11);
  }
  context.globalAlpha = 1;
  context.restore();
}

function drawPedestrian(context: CanvasRenderingContext2D, person: Pedestrian, time: number, fontScale: number) {
  const shadow = context.createRadialGradient(person.x, person.y + 6, 1, person.x, person.y + 6, 15);
  shadow.addColorStop(0, "rgba(38, 48, 43, 0.2)");
  shadow.addColorStop(1, "rgba(38, 48, 43, 0)");
  context.fillStyle = shadow;
  context.beginPath();
  context.ellipse(person.x, person.y + 7, 15, 9, 0, 0, Math.PI * 2);
  context.fill();

  const heading = Math.atan2(person.vy, person.vx);
  context.save();
  context.translate(person.x, person.y);
  context.rotate(heading);
  context.fillStyle = "#f5f1e8";
  context.strokeStyle = "rgba(37, 54, 45, 0.38)";
  context.lineWidth = 1;
  context.beginPath();
  context.ellipse(-1, 2, 6.2, 8.3, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = person.color;
  context.beginPath();
  context.ellipse(-1, 3, 4.6, 6.2, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#c69c78";
  context.beginPath();
  context.arc(0, -5.4, 3.2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255, 255, 255, 0.58)";
  context.fillRect(-2.7, -0.5, 1, 5);
  context.restore();

  setFont(context, 7 / fontScale, 650);
  context.textAlign = "center";
  context.fillStyle = "rgba(51, 69, 59, 0.65)";
  context.fillText(person.id, person.x, person.y + 18 + Math.sin(time * 1.8 + person.x) * 0.35);
}

function drawRobot(context: CanvasRenderingContext2D, robot: Robot, time: number, selected: boolean, fontScale: number) {
  const pulse = selected ? 20 + Math.sin(time * 2.3) * 2 : 17;
  context.save();
  context.globalAlpha = selected ? 0.34 : 0.2;
  context.strokeStyle = robot.color;
  context.lineWidth = 1.2;
  context.beginPath();
  context.arc(robot.x, robot.y, pulse, 0, Math.PI * 2);
  context.stroke();
  context.restore();

  const shadow = context.createRadialGradient(robot.x, robot.y + 9, 2, robot.x, robot.y + 9, 23);
  shadow.addColorStop(0, "rgba(27, 41, 34, 0.23)");
  shadow.addColorStop(1, "rgba(27, 41, 34, 0)");
  context.fillStyle = shadow;
  context.beginPath();
  context.ellipse(robot.x, robot.y + 9, 21, 12, 0, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(robot.x, robot.y);
  context.rotate(robot.heading);
  context.fillStyle = "#293a34";
  roundRect(context, -12, -12, 24, 24, 6);
  context.fill();
  context.fillStyle = robot.color;
  roundRect(context, -9, -9, 18, 18, 4);
  context.fill();
  context.fillStyle = "#fff7e9";
  context.beginPath();
  context.moveTo(10, 0);
  context.lineTo(4, -4);
  context.lineTo(4, 4);
  context.closePath();
  context.fill();
  context.fillStyle = "#405148";
  context.fillRect(-8, -13.5, 6, 2.3);
  context.fillRect(2, -13.5, 6, 2.3);
  context.fillRect(-8, 11.2, 6, 2.3);
  context.fillRect(2, 11.2, 6, 2.3);
  context.fillStyle = "rgba(255, 255, 255, 0.7)";
  context.beginPath();
  context.arc(-3, -3, 1.2, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.textAlign = "center";
  setFont(context, 8.5 / fontScale, 800);
  context.fillStyle = "#2d4138";
  context.fillText(robot.id, robot.x, robot.y + 25);
  if (selected) {
    setFont(context, 7 / fontScale, 700);
    context.fillStyle = robot.color;
    context.fillText(robot.state === "YIELDING" ? "YIELD" : "SHARED CONTROL", robot.x, robot.y + 36);
  }
}

function drawScaleBar(context: CanvasRenderingContext2D, fontScale: number) {
  const x = 43;
  const y = 565;
  context.strokeStyle = "rgba(53, 72, 62, 0.7)";
  context.fillStyle = "rgba(53, 72, 62, 0.74)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + 100, y);
  context.moveTo(x, y - 4);
  context.lineTo(x, y + 4);
  context.moveTo(x + 100, y - 4);
  context.lineTo(x + 100, y + 4);
  context.stroke();
  setFont(context, 7.5 / fontScale, 650);
  context.textAlign = "left";
  context.fillText("2 m", x + 40, y - 7);

  context.textAlign = "right";
  context.fillText("X 1000", 963, y - 4);
  context.save();
  context.translate(978, 196);
  context.fillStyle = "rgba(58, 76, 66, 0.77)";
  context.beginPath();
  context.moveTo(0, -12);
  context.lineTo(-5, 3);
  context.lineTo(0, 0);
  context.lineTo(5, 3);
  context.closePath();
  context.fill();
  setFont(context, 8 / fontScale, 800);
  context.textAlign = "center";
  context.fillText("N", 0, -18);
  context.restore();
  context.textAlign = "left";
}

function drawScene(
  context: CanvasRenderingContext2D,
  simulation: MallSimulation,
  cssWidth: number,
  cssHeight: number,
  dpr: number,
  time: number,
  layers: MapLayers,
  selectedRobot: string | null,
  density: number,
) {
  const transform = getMapTransform(cssWidth, cssHeight);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);
  context.fillStyle = "#e5e2d9";
  context.fillRect(0, 0, cssWidth, cssHeight);

  context.save();
  context.setTransform(
    dpr * transform.scale,
    0,
    0,
    dpr * transform.scale,
    dpr * transform.offsetX,
    dpr * transform.offsetY,
  );
  const fontScale = transform.scale;
  drawFloor(context, fontScale);
  drawRisk(context, simulation, layers);

  for (const obstacle of MALL_LAYOUT) drawObstacle(context, obstacle, fontScale);
  if (layers.forecast) {
    drawPredictions(context, time, simulation.pedestrians.slice(0, density), fontScale);
  }
  if (layers.routes) drawRoutes(context, simulation.robots, time, selectedRobot, fontScale);

  for (const person of simulation.pedestrians.slice(0, density)) drawPedestrian(context, person, time, fontScale);
  for (const robot of simulation.robots) drawRobot(context, robot, time, robot.id === selectedRobot, fontScale);
  drawScaleBar(context, fontScale);
  context.restore();

  const { offsetX, offsetY, scale } = transform;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.fillStyle = "rgba(59, 73, 65, 0.7)";
  context.textAlign = "right";
  setFont(context, 9, 650);
  context.fillText(`FLOOR GRID  /  ${Math.round(50 * METERS_PER_WORLD_UNIT * 100)} CM`, cssWidth - 18, cssHeight - 12);
  context.textAlign = "left";
  context.fillStyle = "rgba(75, 91, 82, 0.52)";
  context.fillRect(offsetX, offsetY + WORLD.height * scale, WORLD.width * scale, 1);
}

export default function SimulationCanvas({
  running,
  settings,
  layers,
  selectedRobot,
  resetSignal,
  speedScale,
  onTelemetry,
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<MallSimulation | null>(null);
  const runningRef = useRef(running);
  const settingsRef = useRef(settings);
  const layersRef = useRef(layers);
  const selectedRobotRef = useRef(selectedRobot);
  const speedScaleRef = useRef(speedScale);
  const telemetryCallbackRef = useRef(onTelemetry);
  const resetSignalRef = useRef(resetSignal);

  runningRef.current = running;
  settingsRef.current = settings;
  layersRef.current = layers;
  selectedRobotRef.current = selectedRobot;
  speedScaleRef.current = speedScale;
  telemetryCallbackRef.current = onTelemetry;

  useEffect(() => {
    const simulation = new MallSimulation();
    simulationRef.current = simulation;
    let frameId = 0;
    let lastFrame = 0;
    let accumulator = 0;
    let lastTelemetryAt = 0;

    const render = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        frameId = window.requestAnimationFrame(render);
        return;
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      if (lastFrame === 0) lastFrame = timestamp;
      const elapsed = Math.min(0.06, (timestamp - lastFrame) / 1000);
      lastFrame = timestamp;
      if (runningRef.current) {
        accumulator += elapsed * speedScaleRef.current;
        while (accumulator >= 1 / 60) {
          simulation.step(1 / 60, settingsRef.current);
          accumulator -= 1 / 60;
        }
      }

      const context = canvas.getContext("2d");
      if (context && width > 0 && height > 0) {
        drawScene(context, simulation, width, height, dpr, simulation.time, layersRef.current, selectedRobotRef.current, settingsRef.current.density);
      }
      if (timestamp - lastTelemetryAt > 160) {
        telemetryCallbackRef.current(simulation.getTelemetry());
        lastTelemetryAt = timestamp;
      }
      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const simulation = simulationRef.current;
    if (simulation) simulation.setSettings(settings);
  }, [settings]);

  useEffect(() => {
    const simulation = simulationRef.current;
    if (simulation) simulation.setFocusRobot(selectedRobot);
  }, [selectedRobot]);

  useEffect(() => {
    if (resetSignalRef.current === resetSignal) return;
    resetSignalRef.current = resetSignal;
    const simulation = simulationRef.current;
    if (simulation) simulation.reset();
  }, [resetSignal]);

  return (
    <canvas
      ref={canvasRef}
      className="simulation-canvas"
      role="img"
      aria-label="Animated mall simulation showing robots, pedestrians, routes, and risk overlays"
    />
  );
}