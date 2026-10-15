export type Point = { x: number; y: number };

export type RectObstacle = {
  kind: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  type: "shop" | "fixture";
  accent?: string;
};

export type CircleObstacle = {
  kind: "circle";
  x: number;
  y: number;
  r: number;
  label: string;
  type: "fixture";
};

export type Obstacle = RectObstacle | CircleObstacle;

export const WORLD = { width: 1000, height: 620 } as const;
export const METERS_PER_WORLD_UNIT = 1 / 50;
export const ROBOT_RADIUS = 13;

export const MALL_LAYOUT: Obstacle[] = [
  { kind: "rect", x: 20, y: 20, w: 190, h: 94, label: "NORTHLINE", type: "shop", accent: "#b98662" },
  { kind: "rect", x: 226, y: 20, w: 160, h: 94, label: "MORROW", type: "shop", accent: "#708c7d" },
  { kind: "rect", x: 402, y: 20, w: 188, h: 94, label: "GROVE MARKET", type: "shop", accent: "#b7a065" },
  { kind: "rect", x: 606, y: 20, w: 164, h: 94, label: "NEX / TECH", type: "shop", accent: "#6f8695" },
  { kind: "rect", x: 790, y: 20, w: 190, h: 94, label: "FOLIO", type: "shop", accent: "#a97878" },
  { kind: "rect", x: 20, y: 506, w: 174, h: 94, label: "MARKET HALL", type: "shop", accent: "#8b9b6b" },
  { kind: "rect", x: 210, y: 506, w: 168, h: 94, label: "ATELIER 06", type: "shop", accent: "#967ca1" },
  { kind: "rect", x: 394, y: 506, w: 190, h: 94, label: "SLOW / COFFEE", type: "shop", accent: "#bd8e62" },
  { kind: "rect", x: 600, y: 506, w: 174, h: 94, label: "GOOD FORM", type: "shop", accent: "#72928d" },
  { kind: "rect", x: 790, y: 506, w: 190, h: 94, label: "OBJECTS", type: "shop", accent: "#b28278" },
  { kind: "rect", x: 237, y: 250, w: 100, h: 55, label: "LOUNGE", type: "fixture" },
  { kind: "rect", x: 672, y: 260, w: 105, h: 58, label: "PLANTER", type: "fixture" },
  { kind: "rect", x: 330, y: 397, w: 90, h: 29, label: "BENCH", type: "fixture" },
  { kind: "rect", x: 615, y: 397, w: 85, h: 29, label: "BENCH", type: "fixture" },
  { kind: "circle", x: 500, y: 324, r: 40, label: "FOUNTAIN", type: "fixture" },
  { kind: "circle", x: 418, y: 224, r: 14, label: "TREE", type: "fixture" },
  { kind: "circle", x: 560, y: 440, r: 14, label: "TREE", type: "fixture" },
  { kind: "circle", x: 879, y: 373, r: 20, label: "PLANTER", type: "fixture" },
];

const HUMAN_ROUTES: Point[][] = [
  [{ x: 128, y: 177 }, { x: 855, y: 177 }, { x: 855, y: 204 }, { x: 128, y: 204 }],
  [{ x: 105, y: 455 }, { x: 897, y: 455 }, { x: 897, y: 438 }, { x: 105, y: 438 }],
  [{ x: 461, y: 176 }, { x: 461, y: 461 }, { x: 482, y: 461 }, { x: 482, y: 176 }],
  [{ x: 832, y: 228 }, { x: 832, y: 386 }, { x: 812, y: 386 }, { x: 812, y: 228 }],
  [{ x: 155, y: 392 }, { x: 207, y: 392 }, { x: 222, y: 366 }, { x: 207, y: 392 }, { x: 155, y: 392 }],
  [{ x: 724, y: 350 }, { x: 783, y: 350 }, { x: 803, y: 330 }, { x: 783, y: 350 }, { x: 724, y: 350 }],
  [{ x: 563, y: 179 }, { x: 563, y: 236 }, { x: 647, y: 236 }, { x: 563, y: 236 }],
  [{ x: 385, y: 454 }, { x: 385, y: 441 }, { x: 285, y: 441 }, { x: 385, y: 441 }],
  [{ x: 920, y: 238 }, { x: 920, y: 351 }, { x: 903, y: 370 }, { x: 920, y: 351 }],
  [{ x: 536, y: 454 }, { x: 536, y: 441 }, { x: 570, y: 441 }, { x: 536, y: 441 }],
  [{ x: 133, y: 229 }, { x: 133, y: 390 }, { x: 152, y: 410 }, { x: 133, y: 390 }],
  [{ x: 650, y: 452 }, { x: 650, y: 438 }, { x: 732, y: 438 }, { x: 650, y: 438 }],
];

const ROBOT_TASKS: { label: string; point: Point }[][] = [
  [
    { label: "RETURNS DESK", point: { x: 927, y: 333 } },
    { label: "SERVICE HUB", point: { x: 72, y: 333 } },
  ],
  [
    { label: "PICKUP POINT", point: { x: 76, y: 460 } },
    { label: "FOOD COURT", point: { x: 920, y: 460 } },
  ],
  [
    { label: "ATRIUM EAST", point: { x: 910, y: 191 } },
    { label: "ATRIUM WEST", point: { x: 90, y: 191 } },
  ],
];

type HistoryPoint = Point & { time: number };
export type ForecastPoint = Point & { horizon: number; sigma: number };

export type Pedestrian = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  preferredSpeed: number;
  route: Point[];
  waypointIndex: number;
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  color: string;
  pause: number;
};

export type Robot = {
  id: string;
  x: number;
  y: number;
  heading: number;
  speed: number;
  omega: number;
  radius: number;
  color: string;
  route: Point[];
  routeIndex: number;
  taskIndex: number;
  taskLabel: string;
  taskPoint: Point;
  commandSpeed: number;
  commandOmega: number;
  distanceTravelled: number;
  completed: number;
  state: "MOVING" | "YIELDING" | "ARRIVED";
};

export type RiskCell = { staticRisk: number; dynamicRisk: number };

export type SharedExternalState = {
  revision: number;
  clock: number;
  routeEpoch: number;
  coordinatorHz: number;
  fleetIds: string[];
  humanForecasts: Map<string, ForecastPoint[]>;
  riskGrid: RiskCell[];
  riskColumns: number;
  riskRows: number;
  focusRobot: string | null;
};

export type SimulationSettings = {
  riskAversion: number;
  density: number;
};

export type FleetTelemetry = {
  id: string;
  x: number;
  y: number;
  speed: number;
  goal: string;
  distance: number;
  completed: number;
  state: Robot["state"];
  routeLength: number;
};

export type ExternalStateLog = {
  time: number;
  revision: number;
  routeEpoch: number;
  humans: number;
  forecasts: number;
  risk: number;
  fleet: string[];
};

export type SimulationTelemetry = {
  clock: number;
  tick: number;
  revision: number;
  routeEpoch: number;
  humans: number;
  minClearance: number;
  averageRisk: number;
  fleet: FleetTelemetry[];
  logs: ExternalStateLog[];
};

const MAX_HUMAN_SPEED = 73;
const ROBOT_MAX_SPEED = 86;
const PREDICTION_HORIZONS = [0.42, 0.82, 1.25, 1.7];
const RISK_COLUMNS = 40;
const RISK_ROWS = 25;
const ROBOT_COLORS = ["#d97b55", "#3f8182", "#8673a7"];
const HUMAN_COLORS = ["#63756c", "#b87f67", "#7487a0", "#a08a55"];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pointBlocked(point: Point, clearance = 0) {
  if (point.x < 22 + clearance || point.x > WORLD.width - 22 - clearance) return true;
  if (point.y < 132 + clearance || point.y > WORLD.height - 132 - clearance) return true;

  for (const obstacle of MALL_LAYOUT) {
    if (obstacle.kind === "rect") {
      if (
        point.x > obstacle.x - clearance &&
        point.x < obstacle.x + obstacle.w + clearance &&
        point.y > obstacle.y - clearance &&
        point.y < obstacle.y + obstacle.h + clearance
      ) {
        return true;
      }
    } else if (distance(point, obstacle) < obstacle.r + clearance) {
      return true;
    }
  }
  return false;
}

function segmentClear(a: Point, b: Point, clearance = ROBOT_RADIUS + 4) {
  const length = distance(a, b);
  const samples = Math.max(2, Math.ceil(length / 10));
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    if (pointBlocked({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }, clearance)) return false;
  }
  return true;
}

function motionSegmentClear(a: Point, b: Point, clearance: number) {
  const length = distance(a, b);
  const samples = Math.max(2, Math.ceil(length / 8));
  for (let i = 1; i <= samples; i += 1) {
    const amount = i / samples;
    if (pointBlocked({ x: lerp(a.x, b.x, amount), y: lerp(a.y, b.y, amount) }, clearance)) return false;
  }
  return true;
}

function pointToRectDistance(point: Point, obstacle: RectObstacle) {
  const dx = Math.max(obstacle.x - point.x, 0, point.x - (obstacle.x + obstacle.w));
  const dy = Math.max(obstacle.y - point.y, 0, point.y - (obstacle.y + obstacle.h));
  return Math.hypot(dx, dy);
}

function pointToObstacleDistance(point: Point, obstacle: Obstacle) {
  if (obstacle.kind === "rect") return pointToRectDistance(point, obstacle);
  return Math.max(0, distance(point, obstacle) - obstacle.r);
}

function closestObstacleSurface(point: Point, obstacle: Obstacle): Point {
  if (obstacle.kind === "rect") {
    return {
      x: clamp(point.x, obstacle.x, obstacle.x + obstacle.w),
      y: clamp(point.y, obstacle.y, obstacle.y + obstacle.h),
    };
  }
  const dx = point.x - obstacle.x;
  const dy = point.y - obstacle.y;
  const magnitude = Math.max(1e-6, Math.hypot(dx, dy));
  return { x: obstacle.x + (dx / magnitude) * obstacle.r, y: obstacle.y + (dy / magnitude) * obstacle.r };
}

function solveCholesky(matrix: number[][], values: number[]) {
  const count = values.length;
  const lower = Array.from({ length: count }, () => new Array<number>(count).fill(0));

  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let sum = matrix[row][column];
      for (let k = 0; k < column; k += 1) sum -= lower[row][k] * lower[column][k];
      lower[row][column] = row === column ? Math.sqrt(Math.max(sum, 1e-6)) : sum / lower[column][column];
    }
  }

  const forward = new Array<number>(count).fill(0);
  for (let row = 0; row < count; row += 1) {
    let value = values[row];
    for (let column = 0; column < row; column += 1) value -= lower[row][column] * forward[column];
    forward[row] = value / lower[row][row];
  }

  const result = new Array<number>(count).fill(0);
  for (let row = count - 1; row >= 0; row -= 1) {
    let value = forward[row];
    for (let column = row + 1; column < count; column += 1) value -= lower[column][row] * result[column];
    result[row] = value / lower[row][row];
  }
  return result;
}

function fitVelocity(history: HistoryPoint[]) {
  if (history.length < 2) return { x: 0, y: 0 };
  const originTime = history[history.length - 1].time;
  const meanTime = history.reduce((sum, item) => sum + item.time - originTime, 0) / history.length;
  const meanX = history.reduce((sum, item) => sum + item.x, 0) / history.length;
  const meanY = history.reduce((sum, item) => sum + item.y, 0) / history.length;
  let covarianceX = 0;
  let covarianceY = 0;
  let variance = 0;

  for (const item of history) {
    const deltaTime = item.time - originTime - meanTime;
    covarianceX += deltaTime * (item.x - meanX);
    covarianceY += deltaTime * (item.y - meanY);
    variance += deltaTime * deltaTime;
  }
  if (variance < 1e-5) return { x: 0, y: 0 };

  const vx = covarianceX / variance;
  const vy = covarianceY / variance;
  const magnitude = Math.hypot(vx, vy);
  if (magnitude > MAX_HUMAN_SPEED) return { x: (vx / magnitude) * MAX_HUMAN_SPEED, y: (vy / magnitude) * MAX_HUMAN_SPEED };
  return { x: vx, y: vy };
}

function predictionHorizons(history: HistoryPoint[]) {
  const headings: number[] = [];
  for (let index = 1; index < history.length; index += 1) {
    const before = history[index - 1];
    const after = history[index];
    if (Math.hypot(after.x - before.x, after.y - before.y) < 2) continue;
    headings.push(Math.atan2(after.y - before.y, after.x - before.x));
  }
  let meanTurn = 0;
  for (let index = 1; index < headings.length; index += 1) {
    meanTurn += Math.abs(normalizeAngle(headings[index] - headings[index - 1]));
  }
  meanTurn /= Math.max(1, headings.length - 1);
  const regularity = headings.length < 2 ? 0 : clamp(1 - meanTurn / 1.35, 0, 1);
  const scale = 0.72 + regularity * 0.68;
  return PREDICTION_HORIZONS.map((horizon) => horizon * scale);
}

// A compact online RBF GP predicts residual motion around a constrained velocity prior.
function predictHumanMotion(person: Pedestrian, now: number): ForecastPoint[] {
  const history = person.history.slice(-9);
  const velocity = fitVelocity(history);
  const horizons = predictionHorizons(history);
  if (history.length < 4) {
    return horizons.map((horizon) => ({
      x: person.x + velocity.x * horizon,
      y: person.y + velocity.y * horizon,
      horizon,
      sigma: 6 + horizon * 8,
    }));
  }

  const lengthScale = 0.58;
  const signalVariance = 25;
  const noiseVariance = 5.5;
  const relativeTimes = history.map((item) => item.time - now);
  const matrix = relativeTimes.map((time, row) =>
    relativeTimes.map((otherTime, column) => {
      const delta = (time - otherTime) / lengthScale;
      return signalVariance * Math.exp(-0.5 * delta * delta) + (row === column ? noiseVariance : 0);
    }),
  );
  const residualX = history.map((item, index) => item.x - (person.x + velocity.x * relativeTimes[index]));
  const residualY = history.map((item, index) => item.y - (person.y + velocity.y * relativeTimes[index]));
  const alphaX = solveCholesky(matrix, residualX);
  const alphaY = solveCholesky(matrix, residualY);

  return horizons.map((horizon) => {
    const covariance = relativeTimes.map((time) => {
      const delta = (horizon - time) / lengthScale;
      return signalVariance * Math.exp(-0.5 * delta * delta);
    });
    let residualMeanX = 0;
    let residualMeanY = 0;
    for (let i = 0; i < covariance.length; i += 1) {
      residualMeanX += covariance[i] * alphaX[i];
      residualMeanY += covariance[i] * alphaY[i];
    }

    let x = person.x + velocity.x * horizon + residualMeanX;
    let y = person.y + velocity.y * horizon + residualMeanY;
    const displacementX = x - person.x;
    const displacementY = y - person.y;
    const maximumTravel = MAX_HUMAN_SPEED * horizon;
    const predictedDistance = Math.hypot(displacementX, displacementY);
    if (predictedDistance > maximumTravel && predictedDistance > 0) {
      const scale = maximumTravel / predictedDistance;
      x = person.x + displacementX * scale;
      y = person.y + displacementY * scale;
    }

    const varianceReduction = covariance.reduce((sum, value, index) => sum + value * covariance[index], 0);
    const sigma = Math.sqrt(Math.max(4, signalVariance - varianceReduction / (signalVariance + noiseVariance)));
    return { x, y, horizon, sigma: sigma + horizon * 3.5 };
  });
}

type TreeNode = { point: Point; parent: number; cost: number };

function tracePath(nodes: TreeNode[], endIndex: number, goal: Point) {
  const path = [goal];
  let current = endIndex;
  while (current >= 0) {
    path.push(nodes[current].point);
    current = nodes[current].parent;
  }
  path.reverse();

  const smooth: Point[] = [path[0]];
  let anchor = 0;
  while (anchor < path.length - 1) {
    let candidate = path.length - 1;
    while (candidate > anchor + 1 && !segmentClear(path[anchor], path[candidate])) candidate -= 1;
    smooth.push(path[candidate]);
    anchor = candidate;
  }
  return smooth;
}

function gridFallbackPath(start: Point, goal: Point, shared: SharedExternalState, aversion: number) {
  const step = 16;
  const columns = Math.ceil(WORLD.width / step) + 1;
  const rows = Math.ceil(WORLD.height / step) + 1;
  const count = columns * rows;
  const startColumn = clamp(Math.round(start.x / step), 0, columns - 1);
  const startRow = clamp(Math.round(start.y / step), 0, rows - 1);
  const startIndex = startRow * columns + startColumn;
  const costs = new Float64Array(count);
  costs.fill(Number.POSITIVE_INFINITY);
  const parents = new Int32Array(count);
  parents.fill(-1);
  const heap: { index: number; score: number }[] = [];

  const push = (index: number, score: number) => {
    heap.push({ index, score });
    let child = heap.length - 1;
    while (child > 0) {
      const parent = Math.floor((child - 1) / 2);
      if (heap[parent].score <= heap[child].score) break;
      [heap[parent], heap[child]] = [heap[child], heap[parent]];
      child = parent;
    }
  };
  const pop = () => {
    const first = heap[0];
    const last = heap.pop();
    if (heap.length && last) {
      heap[0] = last;
      let parent = 0;
      while (true) {
        const left = parent * 2 + 1;
        const right = left + 1;
        let smallest = parent;
        if (left < heap.length && heap[left].score < heap[smallest].score) smallest = left;
        if (right < heap.length && heap[right].score < heap[smallest].score) smallest = right;
        if (smallest === parent) break;
        [heap[parent], heap[smallest]] = [heap[smallest], heap[parent]];
        parent = smallest;
      }
    }
    return first;
  };
  const coordinate = (index: number): Point => ({ x: (index % columns) * step, y: Math.floor(index / columns) * step });
  const heuristic = (point: Point) => distance(point, goal);
  costs[startIndex] = 0;
  push(startIndex, heuristic(start));
  let endIndex = -1;

  while (heap.length) {
    const item = pop();
    if (!item || item.score > costs[item.index] + heuristic(coordinate(item.index)) + 1e-6) continue;
    const current = coordinate(item.index);
    if (segmentClear(current, goal)) {
      endIndex = item.index;
      break;
    }
    const column = item.index % columns;
    const row = Math.floor(item.index / columns);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nextColumn = column + dx;
        const nextRow = row + dy;
        if (nextColumn < 0 || nextColumn >= columns || nextRow < 0 || nextRow >= rows) continue;
        const nextIndex = nextRow * columns + nextColumn;
        const next = coordinate(nextIndex);
        if (pointBlocked(next, ROBOT_RADIUS + 4) || !segmentClear(current, next)) continue;
        const edge = distance(current, next);
        const candidateCost = costs[item.index] + edge * (1 + riskAlongSegment(current, next, shared) * aversion);
        if (candidateCost >= costs[nextIndex]) continue;
        costs[nextIndex] = candidateCost;
        parents[nextIndex] = item.index;
        push(nextIndex, candidateCost + heuristic(next));
      }
    }
  }

  if (endIndex < 0) return [start, goal];
  const reversed: Point[] = [];
  let cursor = endIndex;
  while (cursor >= 0) {
    reversed.push(coordinate(cursor));
    cursor = parents[cursor];
  }
  const path = [start, ...reversed.reverse(), goal];
  const smooth: Point[] = [path[0]];
  let anchor = 0;
  while (anchor < path.length - 1) {
    let candidate = path.length - 1;
    while (candidate > anchor + 1 && !segmentClear(path[anchor], path[candidate])) candidate -= 1;
    smooth.push(path[candidate]);
    anchor = candidate;
  }
  return smooth;
}

function riskAlongSegment(a: Point, b: Point, shared: SharedExternalState) {
  const samples = Math.max(2, Math.ceil(distance(a, b) / 34));
  let total = 0;
  for (let index = 0; index <= samples; index += 1) {
    const amount = index / samples;
    total += riskAtPoint({ x: lerp(a.x, b.x, amount), y: lerp(a.y, b.y, amount) }, shared);
  }
  return total / (samples + 1);
}

function planRrtStar(start: Point, goal: Point, seed: number, shared: SharedExternalState, aversion: number) {
  if (segmentClear(start, goal)) return [start, goal];

  const random = seededRandom(seed);
  const nodes: TreeNode[] = [{ point: start, parent: -1, cost: 0 }];
  let bestGoalNode = -1;
  let bestGoalCost = Number.POSITIVE_INFINITY;
  const iterations = 390;
  const stepLength = 47;
  const neighborhood = 82;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const sample = random() < 0.17
      ? goal
      : { x: 28 + random() * 944, y: 138 + random() * 344 };
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < nodes.length; i += 1) {
      const nextDistance = distance(nodes[i].point, sample);
      if (nextDistance < nearestDistance) {
        nearestDistance = nextDistance;
        nearestIndex = i;
      }
    }

    const nearest = nodes[nearestIndex].point;
    const scale = Math.min(1, stepLength / Math.max(1e-6, nearestDistance));
    const candidate = {
      x: nearest.x + (sample.x - nearest.x) * scale,
      y: nearest.y + (sample.y - nearest.y) * scale,
    };
    if (pointBlocked(candidate, ROBOT_RADIUS + 6) || !segmentClear(nearest, candidate)) continue;

    const neighborIndices: number[] = [];
    for (let i = 0; i < nodes.length; i += 1) {
      if (distance(nodes[i].point, candidate) < neighborhood) neighborIndices.push(i);
    }
    if (!neighborIndices.includes(nearestIndex)) neighborIndices.push(nearestIndex);

    let parentIndex = nearestIndex;
    let parentCost = Number.POSITIVE_INFINITY;
    for (const index of neighborIndices) {
      if (!segmentClear(nodes[index].point, candidate)) continue;
      const edgeLength = distance(nodes[index].point, candidate);
      const cost = nodes[index].cost + edgeLength * (1 + riskAlongSegment(nodes[index].point, candidate, shared) * aversion * 1.15);
      if (cost < parentCost) {
        parentCost = cost;
        parentIndex = index;
      }
    }

    const newIndex = nodes.length;
    nodes.push({ point: candidate, parent: parentIndex, cost: parentCost });

    for (const neighborIndex of neighborIndices) {
      if (neighborIndex === parentIndex) continue;
      const edgeLength = distance(candidate, nodes[neighborIndex].point);
      const rewiredCost = parentCost + edgeLength * (1 + riskAlongSegment(candidate, nodes[neighborIndex].point, shared) * aversion * 1.15);
      if (rewiredCost < nodes[neighborIndex].cost && segmentClear(candidate, nodes[neighborIndex].point)) {
        nodes[neighborIndex].parent = newIndex;
        nodes[neighborIndex].cost = rewiredCost;
      }
    }

    const goalDistance = distance(candidate, goal);
    if (goalDistance < stepLength + 18 && segmentClear(candidate, goal)) {
      const goalCost = parentCost + goalDistance * (1 + riskAlongSegment(candidate, goal, shared) * aversion * 1.15);
      if (goalCost < bestGoalCost) {
        bestGoalCost = goalCost;
        bestGoalNode = newIndex;
      }
    }
  }

  if (bestGoalNode >= 0) return tracePath(nodes, bestGoalNode, goal);

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < nodes.length; i += 1) {
    const nextDistance = distance(nodes[i].point, goal);
    if (nextDistance < nearestDistance && segmentClear(nodes[i].point, goal)) {
      nearestIndex = i;
      nearestDistance = nextDistance;
    }
  }
  if (nearestDistance < Number.POSITIVE_INFINITY) return tracePath(nodes, nearestIndex, goal);
  return gridFallbackPath(start, goal, shared, aversion);
}

function forecastAt(forecast: ForecastPoint[], seconds: number, current: Point, velocity: Point) {
  if (forecast.length === 0) return { x: current.x + velocity.x * seconds, y: current.y + velocity.y * seconds, sigma: 8 };
  if (seconds <= forecast[0].horizon) {
    const amount = seconds / forecast[0].horizon;
    return {
      x: lerp(current.x, forecast[0].x, amount),
      y: lerp(current.y, forecast[0].y, amount),
      sigma: forecast[0].sigma,
    };
  }
  for (let i = 1; i < forecast.length; i += 1) {
    if (seconds <= forecast[i].horizon) {
      const before = forecast[i - 1];
      const after = forecast[i];
      const amount = (seconds - before.horizon) / (after.horizon - before.horizon);
      return {
        x: lerp(before.x, after.x, amount),
        y: lerp(before.y, after.y, amount),
        sigma: lerp(before.sigma, after.sigma, amount),
      };
    }
  }
  const last = forecast[forecast.length - 1];
  return { x: last.x + velocity.x * (seconds - last.horizon), y: last.y + velocity.y * (seconds - last.horizon), sigma: last.sigma + 5 };
}

function followPoint(path: Point[], current: Point, startIndex: number, lookAhead = 93) {
  let index = Math.max(1, startIndex);
  while (index < path.length - 1 && distance(current, path[index]) < 36) index += 1;
  let remaining = lookAhead;
  let previous = current;
  for (; index < path.length; index += 1) {
    const segmentLength = distance(previous, path[index]);
    if (segmentLength >= remaining) {
      const amount = remaining / Math.max(1e-6, segmentLength);
      return {
        point: { x: lerp(previous.x, path[index].x, amount), y: lerp(previous.y, path[index].y, amount) },
        routeIndex: index,
      };
    }
    remaining -= segmentLength;
    previous = path[index];
  }
  return { point: path[path.length - 1] ?? current, routeIndex: path.length - 1 };
}

export function riskAtPoint(point: Point, shared: SharedExternalState) {
  const cellWidth = WORLD.width / shared.riskColumns;
  const cellHeight = WORLD.height / shared.riskRows;
  const gridX = clamp(point.x / cellWidth - 0.5, 0, shared.riskColumns - 1);
  const gridY = clamp(point.y / cellHeight - 0.5, 0, shared.riskRows - 1);
  const left = Math.floor(gridX);
  const right = Math.min(shared.riskColumns - 1, left + 1);
  const top = Math.floor(gridY);
  const bottom = Math.min(shared.riskRows - 1, top + 1);
  const xBlend = gridX - left;
  const yBlend = gridY - top;
  const combinedAt = (column: number, row: number) => {
    const cell = shared.riskGrid[row * shared.riskColumns + column];
    return cell ? 1 - (1 - cell.staticRisk) * (1 - cell.dynamicRisk) : 0;
  };
  const upper = lerp(combinedAt(left, top), combinedAt(right, top), xBlend);
  const lower = lerp(combinedAt(left, bottom), combinedAt(right, bottom), xBlend);
  return lerp(upper, lower, yBlend);
}

export class MallSimulation {
  time = 0;
  tick = 0;
  pedestrians: Pedestrian[] = [];
  robots: Robot[] = [];
  shared: SharedExternalState;
  private riskClock = 0;
  private coordinatorClock = 0;
  private observationClock = 0;
  private stuckTimers = new Map<string, number>();
  private lastPositions = new Map<string, { x: number; y: number }>();
  private externalStateLogs: ExternalStateLog[] = [];
  private settings: SimulationSettings = { riskAversion: 1.25, density: 9 };
  private humanRoutes = HUMAN_ROUTES;
  private rng = seededRandom(268);

  constructor() {
    this.shared = {
      revision: 0,
      clock: 0,
      routeEpoch: 1,
      coordinatorHz: 8,
      fleetIds: ["R-01", "R-02", "R-03"],
      humanForecasts: new Map(),
      riskGrid: Array.from({ length: RISK_COLUMNS * RISK_ROWS }, () => ({ staticRisk: 0, dynamicRisk: 0 })),
      riskColumns: RISK_COLUMNS,
      riskRows: RISK_ROWS,
      focusRobot: null,
    };
    this.reset();
  }

  reset() {
    this.time = 0;
    this.tick = 0;
    this.riskClock = 0;
    this.coordinatorClock = 0;
    this.observationClock = 0;
    this.rng = seededRandom(268);
    this.pedestrians = this.createPedestrians();
    this.robots = this.createRobots();
    this.shared.revision = 0;
    this.shared.clock = 0;
    this.shared.routeEpoch = 1;
    this.shared.humanForecasts.clear();
    this.refreshForecasts();
    this.rebuildRiskGrid();
    this.planAllRoutes();
  }

  setSettings(settings: SimulationSettings) {
    const densityChanged = settings.density !== this.settings.density;
    this.settings = settings;
    if (densityChanged) {
      this.refreshForecasts();
      this.rebuildRiskGrid();
      this.shared.revision += 1;
    }
  }

  setFocusRobot(id: string | null) {
    this.shared.focusRobot = id;
  }

  step(dt: number, settings: SimulationSettings) {
    this.settings = settings;
    this.time += dt;
    this.tick += 1;
    this.updatePedestrians(dt);
    this.observationClock += dt;
    this.coordinatorClock += dt;
    this.riskClock += dt;

    if (this.observationClock >= 0.125) {
      this.observationClock %= 0.125;
      this.recordHumanObservations();
      this.refreshForecasts();
      this.shared.clock = this.time;
      this.shared.revision += 1;
      this.externalStateLogs.push({
        time: this.time,
        revision: this.shared.revision,
        routeEpoch: this.shared.routeEpoch,
        humans: this.settings.density,
        forecasts: this.shared.humanForecasts.size,
        risk: this.shared.riskGrid.reduce((sum, cell) => sum + (1 - (1 - cell.staticRisk) * (1 - cell.dynamicRisk)), 0) / Math.max(1, this.shared.riskGrid.length),
        fleet: this.robots.map((robot) => `${robot.id}:${robot.taskLabel}`),
      });
      if (this.externalStateLogs.length > 12) this.externalStateLogs.shift();
    }

    if (this.coordinatorClock >= 0.125) {
      this.coordinatorClock %= 0.125;
      this.coordinateFleet();
    }

    for (const robot of this.robots) this.updateRobot(robot, dt);

    if (this.riskClock >= 0.34) {
      this.riskClock %= 0.34;
      this.rebuildRiskGrid();
    }
  }

  getTelemetry(): SimulationTelemetry {
    let minClearance = Number.POSITIVE_INFINITY;
    for (const robot of this.robots) {
      for (const person of this.pedestrians.slice(0, this.settings.density)) {
        minClearance = Math.min(minClearance, distance(robot, person) - robot.radius - person.radius);
      }
    }

    const walkableCells = this.shared.riskGrid.filter((_, index) => {
      const column = index % RISK_COLUMNS;
      const row = Math.floor(index / RISK_COLUMNS);
      return !pointBlocked({ x: (column + 0.5) * 25, y: (row + 0.5) * 24.8 }, 0);
    });
    const averageRisk = walkableCells.reduce((sum, cell) => sum + 1 - (1 - cell.staticRisk) * (1 - cell.dynamicRisk), 0) / Math.max(1, walkableCells.length);

    return {
      clock: this.time,
      tick: this.tick,
      revision: this.shared.revision,
      routeEpoch: this.shared.routeEpoch,
      humans: this.settings.density,
      minClearance: Number.isFinite(minClearance) ? minClearance * METERS_PER_WORLD_UNIT : 0,
      averageRisk,
      fleet: this.robots.map((robot) => ({
        id: robot.id,
        x: robot.x,
        y: robot.y,
        speed: robot.speed,
        goal: robot.taskLabel,
        distance: robot.distanceTravelled,
        completed: robot.completed,
        state: robot.state,
        routeLength: robot.route.length,
      })),
      logs: [...this.externalStateLogs],
    };
  }

  private createPedestrians() {
    const palette = HUMAN_COLORS;
    return this.humanRoutes.map((route, index) => {
      const start = route[index % route.length];
      const next = route[(index + 1) % route.length];
      const heading = Math.atan2(next.y - start.y, next.x - start.x);
      const speed = 36 + (index % 4) * 5;
      const person: Pedestrian = {
        id: `P-${String(index + 1).padStart(2, "0")}`,
        x: start.x + (index % 3) * 9,
        y: start.y + (index % 2) * 4,
        vx: Math.cos(heading) * speed,
        vy: Math.sin(heading) * speed,
        radius: 8.5,
        preferredSpeed: speed,
        route,
        waypointIndex: (index + 1) % route.length,
        history: [],
        forecast: [],
        color: palette[index % palette.length],
        pause: index % 5 === 0 ? 0.3 : 0,
      };
      for (let sample = 7; sample >= 0; sample -= 1) {
        person.history.push({ x: person.x - person.vx * sample * 0.14, y: person.y - person.vy * sample * 0.14, time: -sample * 0.14 });
      }
      return person;
    });
  }

  private createRobots() {
    const starts = [
      { x: 75, y: 333, heading: 0 },
      { x: 925, y: 460, heading: Math.PI },
      { x: 90, y: 191, heading: 0 },
    ];
    return starts.map((start, index) => {
      const firstTask = ROBOT_TASKS[index][0];
      return {
        id: `R-0${index + 1}`,
        ...start,
        speed: 0,
        omega: 0,
        radius: ROBOT_RADIUS,
        color: ROBOT_COLORS[index],
        route: [start, firstTask.point],
        routeIndex: 1,
        taskIndex: 0,
        taskLabel: firstTask.label,
        taskPoint: firstTask.point,
        commandSpeed: 0,
        commandOmega: 0,
        distanceTravelled: 0,
        completed: 0,
        state: "MOVING" as const,
      };
    });
  }

  private updatePedestrians(dt: number) {
    const visiblePeople = this.pedestrians.slice(0, this.settings.density);
    for (const person of visiblePeople) {
      person.pause = Math.max(0, person.pause - dt);
      const target = person.route[person.waypointIndex];
      if (distance(person, target) < 13) {
        person.waypointIndex = (person.waypointIndex + 1) % person.route.length;
        if (this.rng() < 0.12) person.pause = 0.35 + this.rng() * 0.4;
      }

      const waypoint = person.route[person.waypointIndex];
      const directionX = waypoint.x - person.x;
      const directionY = waypoint.y - person.y;
      const length = Math.max(1, Math.hypot(directionX, directionY));
      let desiredX = (directionX / length) * person.preferredSpeed;
      let desiredY = (directionY / length) * person.preferredSpeed;

      for (const other of visiblePeople) {
        if (other.id === person.id) continue;
        const dx = person.x - other.x;
        const dy = person.y - other.y;
        const separation = Math.hypot(dx, dy);
        if (separation > 0 && separation < 27) {
          const weight = (27 - separation) / 27;
          desiredX += (dx / separation) * weight * 13;
          desiredY += (dy / separation) * weight * 13;
        }
      }
      for (const robot of this.robots) {
        const futureRobotX = robot.x + Math.cos(robot.heading) * robot.speed * 0.1;
        const futureRobotY = robot.y + Math.sin(robot.heading) * robot.speed * 0.1;
        const dx = person.x - futureRobotX;
        const dy = person.y - futureRobotY;
        const separation = Math.hypot(dx, dy);
        if (separation > 0 && separation < 35) {
          const weight = (35 - separation) / 35;
          desiredX += (dx / separation) * weight * 22;
          desiredY += (dy / separation) * weight * 22;
        }
      }

      if (person.pause > 0) {
        desiredX = 0;
        desiredY = 0;
      }
      const desiredSpeed = Math.hypot(desiredX, desiredY);
      if (desiredSpeed > person.preferredSpeed) {
        desiredX *= person.preferredSpeed / desiredSpeed;
        desiredY *= person.preferredSpeed / desiredSpeed;
      }
      const blend = 1 - Math.exp(-dt / 0.3);
      person.vx = lerp(person.vx, desiredX, blend);
      person.vy = lerp(person.vy, desiredY, blend);
      person.x += person.vx * dt;
      person.y += person.vy * dt;
    }
  }

  private recordHumanObservations() {
    const visibleIds = new Set(this.pedestrians.slice(0, this.settings.density).map((person) => person.id));
    for (const person of this.pedestrians) {
      if (!visibleIds.has(person.id)) continue;
      person.history.push({ x: person.x, y: person.y, time: this.time });
      if (person.history.length > 10) person.history.shift();
    }
  }

  private refreshForecasts() {
    this.shared.humanForecasts.clear();
    for (const person of this.pedestrians.slice(0, this.settings.density)) {
      person.forecast = predictHumanMotion(person, this.time);
      this.shared.humanForecasts.set(person.id, person.forecast);
    }
  }

  private rebuildRiskGrid() {
    const visiblePeople = this.pedestrians.slice(0, this.settings.density);
    const cells: RiskCell[] = [];
    for (let row = 0; row < RISK_ROWS; row += 1) {
      for (let column = 0; column < RISK_COLUMNS; column += 1) {
        const point = { x: (column + 0.5) * 25, y: (row + 0.5) * (WORLD.height / RISK_ROWS) };
        if (pointBlocked(point, 0)) {
          cells.push({ staticRisk: 0, dynamicRisk: 0 });
          continue;
        }

        let nearestStatic = 180;
        for (const obstacle of MALL_LAYOUT) {
          nearestStatic = Math.min(nearestStatic, pointToObstacleDistance(point, obstacle));
        }
        const staticRisk = nearestStatic < 108 ? 0.48 * Math.exp(-nearestStatic / 45) : 0.018;

        let freeProbability = 1;
        for (const person of visiblePeople) {
          for (let index = 0; index < person.forecast.length; index += 1) {
            const future = person.forecast[index];
            const uncertainty = future.sigma * 0.55;
            const spread = 25 + person.radius + uncertainty;
            const likelihood = Math.exp(-0.5 * (distance(point, future) / spread) ** 2);
            const horizonWeight = [0.28, 0.39, 0.25, 0.16][index] ?? 0.14;
            freeProbability *= 1 - clamp(likelihood * horizonWeight * 0.72, 0, 0.78);
          }
        }
        for (const robot of this.robots) {
          const velocity = { x: Math.cos(robot.heading) * robot.speed, y: Math.sin(robot.heading) * robot.speed };
          for (const horizon of [0.15, 0.55, 1.0]) {
            const future = { x: robot.x + velocity.x * horizon, y: robot.y + velocity.y * horizon };
            const likelihood = Math.exp(-0.5 * (distance(point, future) / 37) ** 2);
            freeProbability *= 1 - clamp(likelihood * (horizon === 0.15 ? 0.24 : 0.16), 0, 0.7);
          }
        }
        cells.push({ staticRisk, dynamicRisk: clamp(1 - freeProbability, 0, 0.98) });
      }
    }
    this.shared.riskGrid = cells;
  }

  private planAllRoutes() {
    for (const robot of this.robots) this.planRobotRoute(robot);
  }

  private planRobotRoute(robot: Robot) {
    robot.route = planRrtStar(
      { x: robot.x, y: robot.y },
      robot.taskPoint,
      268 + this.shared.routeEpoch * 41 + Number(robot.id.slice(-1)) * 17,
      this.shared,
      this.settings.riskAversion,
    );
    robot.routeIndex = 1;
  }

  private coordinateFleet() {
    const visiblePeople = this.pedestrians.slice(0, this.settings.density);
    for (const robot of this.robots) {
      if (distance(robot, robot.taskPoint) < 24) {
        robot.completed += 1;
        robot.taskIndex = (robot.taskIndex + 1) % ROBOT_TASKS[Number(robot.id.slice(-1)) - 1].length;
        const nextTask = ROBOT_TASKS[Number(robot.id.slice(-1)) - 1][robot.taskIndex];
        robot.taskLabel = nextTask.label;
        robot.taskPoint = nextTask.point;
        robot.state = "ARRIVED";
        this.shared.routeEpoch += 1;
        this.planRobotRoute(robot);
        continue;
      }

      if (robot.state === "ARRIVED") robot.state = "MOVING";
      const activeRoute = followPoint(robot.route, robot, robot.routeIndex);
      robot.routeIndex = activeRoute.routeIndex;

      const chosen = this.chooseDwaCommand(robot, activeRoute.point, visiblePeople);
      robot.commandSpeed = chosen.speed;
      robot.commandOmega = chosen.omega;

      const blockingHuman = visiblePeople.some((person) => distance(robot, person) < 45 && Math.cos(Math.atan2(person.y - robot.y, person.x - robot.x) - robot.heading) > 0.35);
      const sharedYield = this.robots.some((other) => {
        if (other.id === robot.id) return false;
        // Strict priority rule: robot with lower id yields to avoid circular waiting
        if (other.id.localeCompare(robot.id) > 0) return false;
        const closingDistance = distance(robot, other);
        // Only yield if approaching on a collision course
        const bearingToOther = Math.atan2(other.y - robot.y, other.x - robot.x);
        return closingDistance < 50 && Math.cos(bearingToOther - robot.heading) > 0.5;
      });
      if (blockingHuman || sharedYield) {
        // Yield gently without halting completely so the robot keeps maneuvering around
        robot.commandSpeed = Math.max(16, robot.commandSpeed * 0.65);
        robot.state = "YIELDING";
      } else {
        robot.state = "MOVING";
      }
    }

  }

  private chooseDwaCommand(robot: Robot, localTarget: Point, visiblePeople: Pedestrian[]) {
    const minimumSpeed = Math.max(0, robot.speed - 105 * 0.62);
    const maximumSpeed = Math.min(ROBOT_MAX_SPEED, robot.speed + 105 * 0.68);
    const linearSamples = 5;
    const angularSamples =  nineAngularSamples;
    let bestCost = Number.POSITIVE_INFINITY;
    let best = { speed: 0, omega: 0 };

    for (let linearIndex = 0; linearIndex < linearSamples; linearIndex += 1) {
      const speed = lerp(minimumSpeed, maximumSpeed, linearIndex / (linearSamples - 1));
      for (const omega of angularSamples) {
        let x = robot.x;
        let y = robot.y;
        let heading = robot.heading;
        let previous = { x, y };
        let riskCost = 0;
        let blocked = false;
        const horizon = 1.05;
        const samples = 7;

        for (let sample = 1; sample <= samples; sample += 1) {
          const time = (horizon / samples) * sample;
          heading = normalizeAngle(heading + omega * (horizon / samples));
          x += Math.cos(heading) * speed * (horizon / samples);
          y += Math.sin(heading) * speed * (horizon / samples);
          const next = { x, y };
          if (!motionSegmentClear(previous, next, robot.radius)) {
            blocked = true;
            break;
          }

          for (const person of visiblePeople) {
            const predicted = forecastAt(person.forecast, time, person, { x: person.vx, y: person.vy });
            const separation = distance(next, predicted);
            const bodyClearance = separation - person.radius - robot.radius;
            if (bodyClearance < 10) {
              blocked = true;
              break;
            }
            const comfortRadius = 52 + predicted.sigma * 0.35;
            riskCost += Math.exp(-0.5 * (bodyClearance / comfortRadius) ** 2) * (horizon / samples);
          }
          if (blocked) break;

          for (const other of this.robots) {
            if (other.id === robot.id) continue;
            const otherVelocity = { x: Math.cos(other.heading) * other.speed, y: Math.sin(other.heading) * other.speed };
            const otherPoint = { x: other.x + otherVelocity.x * time, y: other.y + otherVelocity.y * time };
            const separation = distance(next, otherPoint);
            if (separation < robot.radius + other.radius + 5) {
              blocked = true;
              break;
            }
            const clearance = separation - robot.radius - other.radius;
            riskCost += Math.exp(-0.5 * (clearance / 49) ** 2) * 0.17 * (horizon / samples);
          }
          if (blocked) break;
          previous = next;
        }
        if (blocked) continue;

        const targetHeading = Math.atan2(localTarget.y - robot.y, localTarget.x - robot.x);
        const headingError = Math.abs(normalizeAngle(targetHeading - heading));
        const endpointDistance = distance({ x, y }, localTarget);
        const goalDistance = distance({ x, y }, robot.taskPoint);
        const pathRisk = riskAtPoint({ x, y }, this.shared);
        const speedReward = speed * 0.085;
        const cost = endpointDistance * 0.2 + goalDistance * 0.025 + headingError * 13 +
          Math.abs(omega - robot.omega) * 2.7 + riskCost * 44 * this.settings.riskAversion +
          pathRisk * 34 * this.settings.riskAversion - speedReward;

        if (cost < bestCost) {
          bestCost = cost;
          best = { speed, omega };
        }
      }
    }

    if (best.speed < 1) {
      // If stuck, compute escape vector from nearest static obstacle or wall
      let nearestObstacle: Obstacle | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const obstacle of MALL_LAYOUT) {
        const clearance = pointToObstacleDistance(robot, obstacle);
        if (clearance < nearestDistance) {
          nearestDistance = clearance;
          nearestObstacle = obstacle;
        }
      }
      const boundaries = [
        { distance: robot.x - 22, heading: 0 },
        { distance: WORLD.width - 22 - robot.x, heading: Math.PI },
        { distance: robot.y - 132, heading: Math.PI / 2 },
        { distance: WORLD.height - 132 - robot.y, heading: -Math.PI / 2 },
      ];
      const nearestBoundary = boundaries.reduce((current, boundary) => boundary.distance < current.distance ? boundary : current);
      const nearBoundary = nearestBoundary.distance < nearestDistance;
      if (nearBoundary) nearestDistance = nearestBoundary.distance;

      if (nearestDistance < robot.radius + 25) {
        const surface = nearestObstacle ? closestObstacleSurface(robot, nearestObstacle) : robot;
        const escapeHeading = nearBoundary
          ? nearestBoundary.heading
          : Math.atan2(robot.y - surface.y, robot.x - surface.x);
        const turnError = normalizeAngle(escapeHeading - robot.heading);
        return {
          speed: 28,
          omega: clamp(turnError * 2.0, -2.45, 2.45),
        };
      }

      // If in open space but blocked by a human, turn around the human instead of stopping
      const targetHeading = Math.atan2(localTarget.y - robot.y, localTarget.x - robot.x);
      const turnTowardTarget = normalizeAngle(targetHeading - robot.heading);
      return {
        speed: 24,
        omega: clamp(turnTowardTarget * 1.5, -1.8, 1.8),
      };
    }

    if (!Number.isFinite(bestCost)) return { speed: 20, omega: 0.5 };
    return best;
  }

  private updateRobot(robot: Robot, dt: number) {
    const speedBlend = 1 - Math.exp(-dt / 0.18);
    const turnBlend = 1 - Math.exp(-dt / 0.22);
    const targetSpeed = robot.state === "ARRIVED" ? 0 : robot.commandSpeed;
    robot.speed = lerp(robot.speed, targetSpeed, speedBlend);
    robot.omega = lerp(robot.omega, robot.commandOmega, turnBlend);

    const old = { x: robot.x, y: robot.y };
    robot.heading = normalizeAngle(robot.heading + robot.omega * dt);
    const next = {
      x: robot.x + Math.cos(robot.heading) * robot.speed * dt,
      y: robot.y + Math.sin(robot.heading) * robot.speed * dt,
    };
    const nearPedestrian = this.pedestrians.slice(0, this.settings.density).some((person) => {
      const predicted = { x: person.x + person.vx * 0.05, y: person.y + person.vy * 0.05 };
      return distance(next, predicted) < robot.radius + person.radius + 10;
    });
    if (motionSegmentClear(old, next, robot.radius) && !nearPedestrian) {
      robot.x = next.x;
      robot.y = next.y;
      robot.distanceTravelled += distance(old, next);
    } else {
      robot.speed *= 0.3;
      robot.omega = lerp(robot.omega, 0, 0.3);
    }

    // Post-movement collision resolution: push robot away from any overlapping pedestrian
    for (const person of this.pedestrians.slice(0, this.settings.density)) {
      const separation = distance(robot, person);
      const minSeparation = robot.radius + person.radius + 2;
      if (separation < minSeparation && separation > 0) {
        const dx = (robot.x - person.x) / separation;
        const dy = (robot.y - person.y) / separation;
        const push = minSeparation - separation;
        robot.x += dx * push;
        robot.y += dy * push;
      }
    }

    // Deadlock recovery: if a robot has not progressed for too long, nudge and force a replan.
    const previous = this.lastPositions.get(robot.id);
    const moved = previous ? distance(previous, robot) : 0;
    if (moved < 0.8) {
      const timer = (this.stuckTimers.get(robot.id) ?? 0) + dt;
      this.stuckTimers.set(robot.id, timer);
      if (timer > 2.2) {
        this.stuckTimers.set(robot.id, 0);
        this.planRobotRoute(robot);
        // Force escape rotation and brief forward nudge
        robot.heading = normalizeAngle(robot.heading + (robot.id === "R-02" ? 0.9 : -0.9));
        robot.commandSpeed = 35;
        robot.commandOmega = (robot.id === "R-02" ? 1.4 : -1.4);
      }
    } else {
      this.stuckTimers.set(robot.id, 0);
    }
    this.lastPositions.set(robot.id, { x: robot.x, y: robot.y });
  }
}

const nineAngularSamples = [-2.45, -1.85, -1.25, -0.65, 0, 0.65, 1.25, 1.85, 2.45];