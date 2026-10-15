"""Mallflow interactive Pygame simulation.

Run with: python -m pip install -r pygame_sim/requirements.txt && python pygame_sim/main.py
"""

from __future__ import annotations

import math
import heapq
import random
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Optional

import pygame

pygame.init()
pygame.display.set_caption("Mallflow - Shared Navigation Lab")

WORLD_W, WORLD_H = 1000.0, 620.0
ROBOT_RADIUS = 13.0
MAX_ROBOT_SPEED = 86.0
MAX_HUMAN_SPEED = 73.0
STEP = 1 / 60
HORIZONS = (0.42, 0.82, 1.25, 1.7)

RECTS = [
    (20, 20, 190, 94, "NORTHLINE", "#b98662"),
    (226, 20, 160, 94, "MORROW", "#708c7d"),
    (402, 20, 188, 94, "GROVE MARKET", "#b7a065"),
    (606, 20, 164, 94, "NEX / TECH", "#6f8695"),
    (790, 20, 190, 94, "FOLIO", "#a97878"),
    (20, 506, 174, 94, "MARKET HALL", "#8b9b6b"),
    (210, 506, 168, 94, "ATELIER 06", "#967ca1"),
    (394, 506, 190, 94, "SLOW / COFFEE", "#bd8e62"),
    (600, 506, 174, 94, "GOOD FORM", "#72928d"),
    (790, 506, 190, 94, "OBJECTS", "#b28278"),
]
FIXTURES = [
    ("rect", 237, 250, 100, 55, "LOUNGE"),
    ("rect", 672, 260, 105, 58, "PLANTER"),
    ("rect", 330, 397, 90, 29, "BENCH"),
    ("rect", 615, 397, 85, 29, "BENCH"),
    ("circle", 500, 324, 40, 0, "FOUNTAIN"),
    ("circle", 418, 224, 14, 0, "TREE"),
    ("circle", 560, 440, 14, 0, "TREE"),
    ("circle", 879, 373, 20, 0, "PLANTER"),
]
OBSTACLES = [
    ("rect", x, y, w, h, label) for x, y, w, h, label, _ in RECTS
]
OBSTACLES.extend(FIXTURES)

WALKER_ROUTES = [
    [(128, 177), (855, 177), (855, 204), (128, 204)],
    [(105, 455), (897, 455), (897, 438), (105, 438)],
    [(461, 176), (461, 461), (482, 461), (482, 176)],
    [(832, 228), (832, 386), (812, 386), (812, 228)],
    [(155, 392), (207, 392), (222, 366), (207, 392), (155, 392)],
    [(724, 350), (783, 350), (803, 330), (783, 350), (724, 350)],
    [(563, 179), (563, 236), (647, 236), (563, 236)],
    [(385, 454), (385, 441), (285, 441), (385, 441)],
    [(920, 238), (920, 351), (903, 370), (920, 351)],
    [(536, 454), (536, 441), (570, 441), (536, 441)],
    [(133, 229), (133, 390), (152, 410), (133, 390)],
    [(650, 452), (650, 438), (732, 438), (650, 438)],
]
TASKS = [
    [("RETURNS DESK", (927.0, 333.0)), ("SERVICE HUB", (72.0, 333.0))],
    [("PICKUP POINT", (76.0, 460.0)), ("FOOD COURT", (920.0, 460.0))],
    [("ATRIUM EAST", (910.0, 191.0)), ("ATRIUM WEST", (90.0, 191.0))],
]
BOT_COLORS = ((217, 123, 85), (63, 129, 130), (134, 115, 167))
PERSON_COLORS = ((99, 117, 108), (184, 127, 103), (116, 135, 160), (160, 138, 85))


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def mix(a: float, b: float, amount: float) -> float:
    return a + (b - a) * amount


def dist(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def angle_delta(a: float, b: float) -> float:
    return math.atan2(math.sin(a - b), math.cos(a - b))


def point_blocked(point: tuple[float, float], clearance: float = 0.0) -> bool:
    x, y = point
    if x < 22 + clearance or x > WORLD_W - 22 - clearance:
        return True
    if y < 132 + clearance or y > WORLD_H - 132 - clearance:
        return True
    for kind, ox, oy, width, height, _ in OBSTACLES:
        if kind == "rect":
            if ox - clearance < x < ox + width + clearance and oy - clearance < y < oy + height + clearance:
                return True
        elif math.hypot(x - ox, y - oy) < width + clearance:
            return True
    return False


def segment_clear(a: tuple[float, float], b: tuple[float, float], clearance: float = ROBOT_RADIUS + 4) -> bool:
    length = dist(a, b)
    samples = max(2, math.ceil(length / 10))
    for index in range(samples + 1):
        amount = index / samples
        point = (mix(a[0], b[0], amount), mix(a[1], b[1], amount))
        if point_blocked(point, clearance):
            return False
    return True


def motion_segment_clear(a: tuple[float, float], b: tuple[float, float], clearance: float) -> bool:
    samples = max(2, math.ceil(dist(a, b) / 8))
    for index in range(1, samples + 1):
        amount = index / samples
        if point_blocked((mix(a[0], b[0], amount), mix(a[1], b[1], amount)), clearance):
            return False
    return True


def obstacle_distance(point: tuple[float, float], obstacle: tuple) -> float:
    kind, x, y, a, b, _ = obstacle
    if kind == "rect":
        dx = max(x - point[0], 0.0, point[0] - (x + a))
        dy = max(y - point[1], 0.0, point[1] - (y + b))
        return math.hypot(dx, dy)
    return max(0.0, math.hypot(point[0] - x, point[1] - y) - a)


def obstacle_surface(point: tuple[float, float], obstacle: tuple) -> tuple[float, float]:
    kind, x, y, a, b, _ = obstacle
    if kind == "rect":
        return clamp(point[0], x, x + a), clamp(point[1], y, y + b)
    dx, dy = point[0] - x, point[1] - y
    magnitude = max(1e-6, math.hypot(dx, dy))
    return x + dx / magnitude * a, y + dy / magnitude * a


def cholesky_solve(matrix: list[list[float]], values: list[float]) -> list[float]:
    size = len(values)
    lower = [[0.0] * size for _ in range(size)]
    for row in range(size):
        for column in range(row + 1):
            total = matrix[row][column]
            for k in range(column):
                total -= lower[row][k] * lower[column][k]
            lower[row][column] = math.sqrt(max(total, 1e-6)) if row == column else total / lower[column][column]
    forward = [0.0] * size
    for row in range(size):
        value = values[row] - sum(lower[row][column] * forward[column] for column in range(row))
        forward[row] = value / lower[row][row]
    result = [0.0] * size
    for row in range(size - 1, -1, -1):
        value = forward[row] - sum(lower[column][row] * result[column] for column in range(row + 1, size))
        result[row] = value / lower[row][row]
    return result


@dataclass
class Person:
    identifier: str
    x: float
    y: float
    vx: float
    vy: float
    speed: float
    route: list[tuple[float, float]]
    waypoint: int
    color: tuple[int, int, int]
    history: list[tuple[float, float, float]] = field(default_factory=list)
    forecast: list[tuple[float, float, float, float]] = field(default_factory=list)
    pause: float = 0.0
    radius: float = 8.5


@dataclass
class Robot:
    identifier: str
    x: float
    y: float
    heading: float
    color: tuple[int, int, int]
    task_index: int
    route: list[tuple[float, float]] = field(default_factory=list)
    route_index: int = 1
    speed: float = 0.0
    omega: float = 0.0
    command_speed: float = 0.0
    command_omega: float = 0.0
    task_label: str = ""
    task_point: tuple[float, float] = (0.0, 0.0)
    distance: float = 0.0
    completed: int = 0
    state: str = "MOVING"
    radius: float = ROBOT_RADIUS


@dataclass
class SharedState:
    revision: int = 0
    route_epoch: int = 1
    clock: float = 0.0
    forecasts: dict[str, list[tuple[float, float, float, float]]] = field(default_factory=dict)
    risk_grid: list[tuple[float, float]] = field(default_factory=list)
    focus: Optional[str] = None


class MallSimulation:
    def __init__(self) -> None:
        self.random = random.Random(268)
        self.time = 0.0
        self.tick = 0
        self.density = 9
        self.risk_aversion = 1.25
        self.observation_clock = 0.0
        self.coordinator_clock = 0.0
        self.risk_clock = 0.0
        self.shared = SharedState(risk_grid=[(0.0, 0.0)] * (40 * 25))
        self.risk_version = 0
        self.people = self._make_people()
        self.robots = self._make_robots()
        self._refresh_forecasts()
        self._rebuild_risk()
        self._plan_all()
        self.stuck_timers = {robot.identifier: 0.0 for robot in self.robots}
        self.last_positions = {robot.identifier: (robot.x, robot.y) for robot in self.robots}

    def _make_people(self) -> list[Person]:
        people = []
        for index, route in enumerate(WALKER_ROUTES):
            start = route[index % len(route)]
            next_point = route[(index + 1) % len(route)]
            heading = math.atan2(next_point[1] - start[1], next_point[0] - start[0])
            speed = 36 + (index % 4) * 5
            person = Person(
                f"P-{index + 1:02d}", start[0] + index % 3 * 9, start[1] + index % 2 * 4,
                math.cos(heading) * speed, math.sin(heading) * speed, speed, route,
                (index + 1) % len(route), PERSON_COLORS[index % len(PERSON_COLORS)], pause=0.3 if index % 5 == 0 else 0.0,
            )
            person.history = [(person.x - person.vx * sample * 0.14, person.y - person.vy * sample * 0.14, -sample * 0.14) for sample in range(7, -1, -1)]
            people.append(person)
        return people

    def _make_robots(self) -> list[Robot]:
        starts = [(75.0, 333.0, 0.0), (925.0, 460.0, math.pi), (90.0, 191.0, 0.0)]
        robots = []
        for index, (x, y, heading) in enumerate(starts):
            label, target = TASKS[index][0]
            robots.append(Robot(f"R-0{index + 1}", x, y, heading, BOT_COLORS[index], 0, task_label=label, task_point=target))
        return robots

    def reset(self) -> None:
        self.__init__()
        self.stuck_timers = {robot.identifier: 0.0 for robot in self.robots}
        self.last_positions = {robot.identifier: (robot.x, robot.y) for robot in self.robots}

    def set_settings(self, density: int, risk_aversion: float) -> None:
        next_density = int(clamp(density, 4, len(self.people)))
        density_changed = next_density != self.density
        self.density = next_density
        self.risk_aversion = clamp(risk_aversion, 0.4, 2.4)
        if density_changed:
            self._refresh_forecasts()
            self._rebuild_risk()
            self.shared.revision += 1

    def _fit_velocity(self, person: Person) -> tuple[float, float]:
        history = person.history[-9:]
        if len(history) < 2:
            return 0.0, 0.0
        origin = history[-1][2]
        mean_t = sum(item[2] - origin for item in history) / len(history)
        mean_x = sum(item[0] for item in history) / len(history)
        mean_y = sum(item[1] for item in history) / len(history)
        variance = sum((item[2] - origin - mean_t) ** 2 for item in history)
        if variance < 1e-5:
            return 0.0, 0.0
        vx = sum((item[2] - origin - mean_t) * (item[0] - mean_x) for item in history) / variance
        vy = sum((item[2] - origin - mean_t) * (item[1] - mean_y) for item in history) / variance
        magnitude = math.hypot(vx, vy)
        if magnitude > MAX_HUMAN_SPEED:
            return vx / magnitude * MAX_HUMAN_SPEED, vy / magnitude * MAX_HUMAN_SPEED
        return vx, vy

    def _predict_person(self, person: Person) -> list[tuple[float, float, float, float]]:
        history = person.history[-9:]
        vx, vy = self._fit_velocity(person)
        headings = []
        for before, after in zip(history, history[1:]):
            dx, dy = after[0] - before[0], after[1] - before[1]
            if math.hypot(dx, dy) >= 2:
                headings.append(math.atan2(dy, dx))
        turns = [abs(angle_delta(headings[index], headings[index - 1])) for index in range(1, len(headings))]
        regularity = clamp(1 - sum(turns) / max(1, len(turns)) / 1.35, 0, 1) if len(headings) >= 2 else 0
        horizons = [horizon * (0.72 + regularity * 0.68) for horizon in HORIZONS]
        if len(history) < 4:
            return [(person.x + vx * horizon, person.y + vy * horizon, horizon, 6 + horizon * 8) for horizon in horizons]

        length_scale, signal_variance, noise = 0.58, 25.0, 5.5
        relative_times = [sample[2] - self.time for sample in history]
        covariance = [[signal_variance * math.exp(-0.5 * ((a - b) / length_scale) ** 2) + (noise if i == j else 0) for j, b in enumerate(relative_times)] for i, a in enumerate(relative_times)]
        residual_x = [sample[0] - (person.x + vx * relative_times[i]) for i, sample in enumerate(history)]
        residual_y = [sample[1] - (person.y + vy * relative_times[i]) for i, sample in enumerate(history)]
        alpha_x, alpha_y = cholesky_solve(covariance, residual_x), cholesky_solve(covariance, residual_y)
        predictions = []
        for horizon in horizons:
            kernel = [signal_variance * math.exp(-0.5 * ((horizon - sample_time) / length_scale) ** 2) for sample_time in relative_times]
            x = person.x + vx * horizon + sum(value * alpha_x[i] for i, value in enumerate(kernel))
            y = person.y + vy * horizon + sum(value * alpha_y[i] for i, value in enumerate(kernel))
            dx, dy = x - person.x, y - person.y
            travel, max_travel = math.hypot(dx, dy), MAX_HUMAN_SPEED * horizon
            if travel > max_travel:
                x = person.x + dx * max_travel / travel
                y = person.y + dy * max_travel / travel
            variance_reduction = sum(value * value for value in kernel)
            sigma = math.sqrt(max(4.0, signal_variance - variance_reduction / (signal_variance + noise))) + horizon * 3.5
            predictions.append((x, y, horizon, sigma))
        return predictions

    def _refresh_forecasts(self) -> None:
        self.shared.forecasts = {}
        for person in self.people[: self.density]:
            person.forecast = self._predict_person(person)
            self.shared.forecasts[person.identifier] = person.forecast

    def _risk_at(self, point: tuple[float, float]) -> float:
        column = clamp(point[0] / 25 - 0.5, 0, 39)
        row = clamp(point[1] / (WORLD_H / 25) - 0.5, 0, 24)
        left, right = int(column), min(39, int(column) + 1)
        top, bottom = int(row), min(24, int(row) + 1)
        cx, cy = column - left, row - top

        def combined(col: int, r: int) -> float:
            static, moving = self.shared.risk_grid[r * 40 + col]
            return 1 - (1 - static) * (1 - moving)

        upper = mix(combined(left, top), combined(right, top), cx)
        lower = mix(combined(left, bottom), combined(right, bottom), cx)
        return mix(upper, lower, cy)

    def _rebuild_risk(self) -> None:
        cells = []
        for row in range(25):
            for column in range(40):
                point = ((column + 0.5) * 25, (row + 0.5) * WORLD_H / 25)
                if point_blocked(point):
                    cells.append((0.0, 0.0))
                    continue
                closest = min((obstacle_distance(point, item) for item in OBSTACLES), default=180)
                static_risk = 0.48 * math.exp(-closest / 45) if closest < 108 else 0.018
                free_probability = 1.0
                for person in self.people[: self.density]:
                    for index, (x, y, _, sigma) in enumerate(person.forecast):
                        spread = 25 + person.radius + sigma * 0.55
                        likelihood = math.exp(-0.5 * (dist(point, (x, y)) / spread) ** 2)
                        weight = (0.28, 0.39, 0.25, 0.16)[index]
                        free_probability *= 1 - clamp(likelihood * weight * 0.72, 0, 0.78)
                for robot in self.robots:
                    for horizon in (0.15, 0.55, 1.0):
                        future = (robot.x + math.cos(robot.heading) * robot.speed * horizon, robot.y + math.sin(robot.heading) * robot.speed * horizon)
                        likelihood = math.exp(-0.5 * (dist(point, future) / 37) ** 2)
                        free_probability *= 1 - clamp(likelihood * (0.24 if horizon == 0.15 else 0.16), 0, 0.7)
                cells.append((static_risk, clamp(1 - free_probability, 0, 0.98)))
        self.shared.risk_grid = cells
        self.risk_version += 1

    def _risk_segment(self, a: tuple[float, float], b: tuple[float, float]) -> float:
        samples = max(2, math.ceil(dist(a, b) / 34))
        values = [self._risk_at((mix(a[0], b[0], i / samples), mix(a[1], b[1], i / samples))) for i in range(samples + 1)]
        return sum(values) / len(values)

    def _grid_fallback(self, start: tuple[float, float], goal: tuple[float, float]) -> list[tuple[float, float]]:
        step = 16
        columns, rows = math.ceil(WORLD_W / step) + 1, math.ceil(WORLD_H / step) + 1
        origin = (round(start[0] / step), round(start[1] / step))
        costs = {origin: 0.0}
        parents = {}
        queue = [(dist((origin[0] * step, origin[1] * step), goal), 0.0, origin)]
        end = None

        while queue:
            _, known_cost, current = heapq.heappop(queue)
            if known_cost > costs.get(current, math.inf) + 1e-6:
                continue
            point = (current[0] * step, current[1] * step)
            if segment_clear(point, goal):
                end = current
                break
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    neighbor = (current[0] + dx, current[1] + dy)
                    if not (0 <= neighbor[0] < columns and 0 <= neighbor[1] < rows):
                        continue
                    neighbor_point = (neighbor[0] * step, neighbor[1] * step)
                    if point_blocked(neighbor_point, ROBOT_RADIUS + 4) or not segment_clear(point, neighbor_point):
                        continue
                    edge = dist(point, neighbor_point)
                    candidate = known_cost + edge * (1 + self._risk_segment(point, neighbor_point) * self.risk_aversion)
                    if candidate >= costs.get(neighbor, math.inf):
                        continue
                    costs[neighbor] = candidate
                    parents[neighbor] = current
                    heuristic = dist(neighbor_point, goal)
                    heapq.heappush(queue, (candidate + heuristic, candidate, neighbor))

        if end is None:
            return [start, goal]
        grid_path = []
        current = end
        while current in parents:
            grid_path.append((current[0] * step, current[1] * step))
            current = parents[current]
        grid_path.append((current[0] * step, current[1] * step))
        grid_path.reverse()
        path = [start, *grid_path, goal]
        smooth = [path[0]]
        anchor = 0
        while anchor < len(path) - 1:
            candidate = len(path) - 1
            while candidate > anchor + 1 and not segment_clear(path[anchor], path[candidate]):
                candidate -= 1
            smooth.append(path[candidate])
            anchor = candidate
        return smooth

    def _rrt_star(self, start: tuple[float, float], goal: tuple[float, float], seed: int) -> list[tuple[float, float]]:
        if segment_clear(start, goal):
            return [start, goal]
        rng = random.Random(seed)
        nodes = [[start, -1, 0.0]]
        goal_node, goal_cost = -1, math.inf
        for _ in range(330):
            sample = goal if rng.random() < 0.17 else (28 + rng.random() * 944, 138 + rng.random() * 344)
            nearest_index = min(range(len(nodes)), key=lambda i: dist(nodes[i][0], sample))
            nearest = nodes[nearest_index][0]
            length = max(1e-6, dist(nearest, sample))
            ratio = min(1, 47 / length)
            candidate = (nearest[0] + (sample[0] - nearest[0]) * ratio, nearest[1] + (sample[1] - nearest[1]) * ratio)
            if point_blocked(candidate, ROBOT_RADIUS + 6) or not segment_clear(nearest, candidate):
                continue
            neighbors = [i for i, node in enumerate(nodes) if dist(node[0], candidate) < 82]
            if nearest_index not in neighbors:
                neighbors.append(nearest_index)
            parent = nearest_index
            best_cost = math.inf
            for index in neighbors:
                if not segment_clear(nodes[index][0], candidate):
                    continue
                edge = dist(nodes[index][0], candidate)
                cost = nodes[index][2] + edge * (1 + self._risk_segment(nodes[index][0], candidate) * self.risk_aversion * 1.15)
                if cost < best_cost:
                    parent, best_cost = index, cost
            new_index = len(nodes)
            nodes.append([candidate, parent, best_cost])
            for index in neighbors:
                if index == parent or not segment_clear(candidate, nodes[index][0]):
                    continue
                edge = dist(candidate, nodes[index][0])
                cost = best_cost + edge * (1 + self._risk_segment(candidate, nodes[index][0]) * self.risk_aversion * 1.15)
                if cost < nodes[index][2]:
                    nodes[index][1], nodes[index][2] = new_index, cost
            gap = dist(candidate, goal)
            if gap < 65 and segment_clear(candidate, goal):
                cost = best_cost + gap * (1 + self._risk_segment(candidate, goal) * self.risk_aversion * 1.15)
                if cost < goal_cost:
                    goal_node, goal_cost = new_index, cost

        if goal_node < 0:
            eligible = [i for i, node in enumerate(nodes) if segment_clear(node[0], goal)]
            if not eligible:
                return self._grid_fallback(start, goal)
            goal_node = min(eligible, key=lambda i: dist(nodes[i][0], goal))

        path = [goal]
        index = goal_node
        while index >= 0:
            path.append(nodes[index][0])
            index = nodes[index][1]
        path.reverse()
        smooth = [path[0]]
        anchor = 0
        while anchor < len(path) - 1:
            candidate = len(path) - 1
            while candidate > anchor + 1 and not segment_clear(path[anchor], path[candidate]):
                candidate -= 1
            smooth.append(path[candidate])
            anchor = candidate
        return smooth

    def _plan_robot(self, robot: Robot) -> None:
        seed = 268 + self.shared.route_epoch * 41 + int(robot.identifier[-1]) * 17
        robot.route = self._rrt_star((robot.x, robot.y), robot.task_point, seed)
        robot.route_index = 1

    def _plan_all(self) -> None:
        for robot in self.robots:
            self._plan_robot(robot)

    def _update_people(self, dt: float) -> None:
        people = self.people[: self.density]
        for person in people:
            person.pause = max(0.0, person.pause - dt)
            target = person.route[person.waypoint]
            if dist((person.x, person.y), target) < 13:
                person.waypoint = (person.waypoint + 1) % len(person.route)
                if self.random.random() < 0.12:
                    person.pause = 0.35 + self.random.random() * 0.4
            target = person.route[person.waypoint]
            dx, dy = target[0] - person.x, target[1] - person.y
            length = max(1.0, math.hypot(dx, dy))
            desired_x, desired_y = dx / length * person.speed, dy / length * person.speed
            for other in people:
                if other is person:
                    continue
                sx, sy = person.x - other.x, person.y - other.y
                separation = math.hypot(sx, sy)
                if 0 < separation < 27:
                    strength = (27 - separation) / 27 * 13
                    desired_x += sx / separation * strength
                    desired_y += sy / separation * strength
            for robot in self.robots:
                future_x = robot.x + math.cos(robot.heading) * robot.speed * 0.1
                future_y = robot.y + math.sin(robot.heading) * robot.speed * 0.1
                sx, sy = person.x - future_x, person.y - future_y
                separation = math.hypot(sx, sy)
                if 0 < separation < 35:
                    strength = (35 - separation) / 35 * 22
                    desired_x += sx / separation * strength
                    desired_y += sy / separation * strength
            if person.pause:
                desired_x = desired_y = 0.0
            magnitude = math.hypot(desired_x, desired_y)
            if magnitude > person.speed:
                desired_x *= person.speed / magnitude
                desired_y *= person.speed / magnitude
            blend = 1 - math.exp(-dt / 0.3)
            person.vx = mix(person.vx, desired_x, blend)
            person.vy = mix(person.vy, desired_y, blend)
            person.x += person.vx * dt
            person.y += person.vy * dt

    def _record_people(self) -> None:
        for person in self.people[: self.density]:
            person.history.append((person.x, person.y, self.time))
            person.history = person.history[-10:]

    @staticmethod
    def _forecast_at(person: Person, seconds: float) -> tuple[float, float, float]:
        if not person.forecast:
            return person.x + person.vx * seconds, person.y + person.vy * seconds, 8.0
        if seconds <= person.forecast[0][2]:
            x, y, horizon, sigma = person.forecast[0]
            amount = seconds / horizon
            return mix(person.x, x, amount), mix(person.y, y, amount), sigma
        for index in range(1, len(person.forecast)):
            if seconds <= person.forecast[index][2]:
                before, after = person.forecast[index - 1], person.forecast[index]
                amount = (seconds - before[2]) / (after[2] - before[2])
                return mix(before[0], after[0], amount), mix(before[1], after[1], amount), mix(before[3], after[3], amount)
        last = person.forecast[-1]
        return last[0] + person.vx * (seconds - last[2]), last[1] + person.vy * (seconds - last[2]), last[3] + 5

    def _path_target(self, robot: Robot) -> tuple[float, float]:
        path = robot.route
        index = max(1, robot.route_index)
        while index < len(path) - 1 and dist((robot.x, robot.y), path[index]) < 36:
            index += 1
        remaining = 93.0
        previous = (robot.x, robot.y)
        for current in path[index:]:
            length = dist(previous, current)
            if length >= remaining:
                amount = remaining / max(1e-6, length)
                robot.route_index = index
                return mix(previous[0], current[0], amount), mix(previous[1], current[1], amount)
            remaining -= length
            previous = current
            index += 1
        robot.route_index = len(path) - 1
        return path[-1]

    def _choose_dwa(self, robot: Robot, target: tuple[float, float], people: list[Person]) -> tuple[float, float]:
        low_speed = max(0.0, robot.speed - 105 * 0.62)
        high_speed = min(MAX_ROBOT_SPEED, robot.speed + 105 * 0.68)
        best_cost, best = math.inf, (0.0, 0.0)
        omegas = (-2.45, -1.85, -1.25, -0.65, 0.0, 0.65, 1.25, 1.85, 2.45)
        for linear_index in range(5):
            speed = mix(low_speed, high_speed, linear_index / 4)
            for omega in omegas:
                x, y, heading = robot.x, robot.y, robot.heading
                previous = (x, y)
                risk_cost = 0.0
                blocked = False
                for sample in range(1, 8):
                    seconds = 1.05 / 7 * sample
                    heading = angle_delta(heading + omega * 1.05 / 7, 0)
                    x += math.cos(heading) * speed * 1.05 / 7
                    y += math.sin(heading) * speed * 1.05 / 7
                    current = (x, y)
                    if not motion_segment_clear(previous, current, robot.radius):
                        blocked = True
                        break
                    for person in people:
                        px, py, sigma = self._forecast_at(person, seconds)
                        clearance = dist(current, (px, py)) - person.radius - robot.radius
                        if clearance < 10:
                            blocked = True
                            break
                        comfort = 52 + sigma * 0.35
                        risk_cost += math.exp(-0.5 * (clearance / comfort) ** 2) * (1.05 / 7)
                    if blocked:
                        break
                    for other in self.robots:
                        if other is robot:
                            continue
                        predicted = (other.x + math.cos(other.heading) * other.speed * seconds, other.y + math.sin(other.heading) * other.speed * seconds)
                        separation = dist(current, predicted)
                        if separation < robot.radius + other.radius + 5:
                            blocked = True
                            break
                        clearance = separation - robot.radius - other.radius
                        risk_cost += math.exp(-0.5 * (clearance / 49) ** 2) * 0.17 * (1.05 / 7)
                    if blocked:
                        break
                    previous = current
                if blocked:
                    continue
                target_heading = math.atan2(target[1] - robot.y, target[0] - robot.x)
                heading_error = abs(angle_delta(target_heading, heading))
                goal_distance = dist((x, y), robot.task_point)
                path_risk = self._risk_at((x, y))
                cost = dist((x, y), target) * 0.2 + goal_distance * 0.025 + heading_error * 13
                cost += abs(omega - robot.omega) * 2.7 + risk_cost * 44 * self.risk_aversion
                cost += path_risk * 34 * self.risk_aversion - speed * 0.085
                if cost < best_cost:
                    best_cost, best = cost, (speed, omega)

        if best[0] < 1:
            closest = min(OBSTACLES, key=lambda item: obstacle_distance((robot.x, robot.y), item), default=None)
            nearest_distance = obstacle_distance((robot.x, robot.y), closest) if closest else math.inf
            bounds = [
                (robot.x - 22, 0.0),
                (WORLD_W - 22 - robot.x, math.pi),
                (robot.y - 132, math.pi / 2),
                (WORLD_H - 132 - robot.y, -math.pi / 2),
            ]
            boundary = min(bounds, key=lambda item: item[0])
            near_boundary = boundary[0] < nearest_distance
            if near_boundary:
                nearest_distance = boundary[0]
            if nearest_distance < robot.radius + 25:
                surface = obstacle_surface((robot.x, robot.y), closest) if closest else (robot.x, robot.y)
                direction = boundary[1] if near_boundary else math.atan2(robot.y - surface[1], robot.x - surface[0])
                turn = angle_delta(direction, robot.heading)
                return 28.0, clamp(turn * 2.0, -2.45, 2.45)

            target_heading = math.atan2(target[1] - robot.y, target[0] - robot.x)
            turn_target = angle_delta(target_heading, robot.heading)
            return 24.0, clamp(turn_target * 1.5, -1.8, 1.8)

        return best if math.isfinite(best_cost) else (20.0, 0.5)

    def _coordinate(self) -> None:
        people = self.people[: self.density]
        for robot in self.robots:
            if dist((robot.x, robot.y), robot.task_point) < 24:
                robot.completed += 1
                robot.task_index = (robot.task_index + 1) % len(TASKS[int(robot.identifier[-1]) - 1])
                robot.task_label, robot.task_point = TASKS[int(robot.identifier[-1]) - 1][robot.task_index]
                robot.state = "ARRIVED"
                self.shared.route_epoch += 1
                self._plan_robot(robot)
                continue
            if robot.state == "ARRIVED":
                robot.state = "MOVING"
            target = self._path_target(robot)
            robot.command_speed, robot.command_omega = self._choose_dwa(robot, target, people)
            blocking = any(dist((robot.x, robot.y), (person.x, person.y)) < 45 and math.cos(math.atan2(person.y - robot.y, person.x - robot.x) - robot.heading) > 0.35 for person in people)
            yielding = any(other is not robot and other.identifier < robot.identifier and dist((robot.x, robot.y), (other.x, other.y)) < 50 and math.cos(math.atan2(other.y - robot.y, other.x - robot.x) - robot.heading) > 0.5 for other in self.robots)
            if blocking or yielding:
                robot.command_speed = max(16.0, robot.command_speed * 0.65)
                robot.state = "YIELDING"
            else:
                robot.state = "MOVING"

    def _move_robot(self, robot: Robot, dt: float) -> None:
        robot.speed = mix(robot.speed, robot.command_speed, 1 - math.exp(-dt / 0.18))
        robot.omega = mix(robot.omega, robot.command_omega, 1 - math.exp(-dt / 0.22))
        robot.heading = angle_delta(robot.heading + robot.omega * dt, 0)
        old = (robot.x, robot.y)
        new = (robot.x + math.cos(robot.heading) * robot.speed * dt, robot.y + math.sin(robot.heading) * robot.speed * dt)
        near_person = any(dist(new, (person.x + person.vx * 0.05, person.y + person.vy * 0.05)) < robot.radius + person.radius + 10 for person in self.people[: self.density])
        if motion_segment_clear(old, new, robot.radius) and not near_person:
            robot.x, robot.y = new
            robot.distance += dist(old, new)
        else:
            robot.speed *= 0.3
            robot.omega = mix(robot.omega, 0, 0.3)

        for person in self.people[: self.density]:
            separation = dist((robot.x, robot.y), (person.x, person.y))
            min_separation = robot.radius + person.radius + 2
            if 0 < separation < min_separation:
                dx = (robot.x - person.x) / separation
                dy = (robot.y - person.y) / separation
                push = min_separation - separation
                robot.x += dx * push
                robot.y += dy * push

        previous = self.last_positions.get(robot.identifier, (robot.x, robot.y))
        if dist(previous, (robot.x, robot.y)) < 0.8:
            timer = self.stuck_timers.get(robot.identifier, 0.0) + dt
            self.stuck_timers[robot.identifier] = timer
            if timer > 2.2:
                self.stuck_timers[robot.identifier] = 0.0
                self._plan_robot(robot)
                robot.heading = angle_delta(robot.heading + (0.9 if robot.identifier == "R-02" else -0.9), 0)
                robot.command_speed = 35.0
                robot.command_omega = 1.4 if robot.identifier == "R-02" else -1.4
        else:
            self.stuck_timers[robot.identifier] = 0.0
        self.last_positions[robot.identifier] = (robot.x, robot.y)

    def step(self, dt: float) -> None:
        self.time += dt
        self.tick += 1
        self._update_people(dt)
        self.observation_clock += dt
        self.coordinator_clock += dt
        self.risk_clock += dt
        if self.observation_clock >= 0.125:
            self.observation_clock %= 0.125
            self._record_people()
            self._refresh_forecasts()
            self.shared.clock = self.time
            self.shared.revision += 1
        if self.coordinator_clock >= 0.125:
            self.coordinator_clock %= 0.125
            self._coordinate()
        for robot in self.robots:
            self._move_robot(robot, dt)
        if self.risk_clock >= 0.34:
            self.risk_clock %= 0.34
            self._rebuild_risk()

    def telemetry(self) -> dict:
        clearance = min((dist((robot.x, robot.y), (person.x, person.y)) - robot.radius - person.radius for robot in self.robots for person in self.people[: self.density]), default=0)
        walkable = [cell for index, cell in enumerate(self.shared.risk_grid) if not point_blocked(((index % 40 + 0.5) * 25, (index // 40 + 0.5) * WORLD_H / 25))]
        risk = sum(1 - (1 - cell[0]) * (1 - cell[1]) for cell in walkable) / max(1, len(walkable))
        return {"clearance": max(0, clearance) / 50, "risk": risk, "people": self.density}


def rgb(hex_color: str) -> tuple[int, int, int]:
    value = hex_color.lstrip("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def font(size: int, bold: bool = False) -> pygame.font.Font:
    return pygame.font.SysFont("segoeui", size, bold=bold)


def label(surface: pygame.Surface, text: str, x: int, y: int, color: tuple[int, int, int], size: int = 12, bold: bool = False, right: bool = False) -> None:
    image = font(size, bold).render(text, True, color)
    rect = image.get_rect()
    if right:
        rect.topright = (x, y)
    else:
        rect.topleft = (x, y)
    surface.blit(image, rect)


def dashed_line(surface: pygame.Surface, color: tuple[int, int, int], start: tuple[int, int], end: tuple[int, int], width: int = 2, dash: int = 7, gap: int = 7, phase: float = 0) -> None:
    dx, dy = end[0] - start[0], end[1] - start[1]
    length = math.hypot(dx, dy)
    if length < 1:
        return
    ux, uy = dx / length, dy / length
    cursor = -phase % (dash + gap)
    while cursor < length:
        begin = max(0, cursor)
        finish = min(length, cursor + dash)
        if finish > begin:
            pygame.draw.line(surface, color, (start[0] + ux * begin, start[1] + uy * begin), (start[0] + ux * finish, start[1] + uy * finish), width)
        cursor += dash + gap


@lru_cache(maxsize=128)
def forecast_glow(radius: int, color: tuple[int, int, int]) -> pygame.Surface:
    glow = pygame.Surface((radius * 2, radius * 2), pygame.SRCALPHA)
    pygame.draw.ellipse(glow, (*color, 31), (0, 0, radius * 2, int(radius * 1.4)))
    return glow


class RiskMapCache:
    def __init__(self) -> None:
        self.key: Optional[tuple] = None
        self.static_layer: Optional[pygame.Surface] = None
        self.dynamic_layer: Optional[pygame.Surface] = None

    def draw(self, surface: pygame.Surface, sim: MallSimulation, origin: tuple[int, int], size: tuple[int, int], layers: dict) -> None:
        key = (sim.risk_version, size)
        if key != self.key:
            static_grid = pygame.Surface((40, 25), pygame.SRCALPHA)
            dynamic_grid = pygame.Surface((40, 25), pygame.SRCALPHA)
            for index, (static_risk, dynamic_risk) in enumerate(sim.shared.risk_grid):
                column, row = index % 40, index // 40
                if static_risk > 0.045:
                    static_grid.set_at((column, row), (206, 151, 77, round(min(68, static_risk * 95))))
                if dynamic_risk > 0.04:
                    color = (191, 81, 63) if dynamic_risk > 0.66 else (222, 127, 77)
                    dynamic_grid.set_at((column, row), (*color, round(min(120, 15 + dynamic_risk * 96))))
            self.static_layer = pygame.transform.scale(static_grid, size)
            self.dynamic_layer = pygame.transform.scale(dynamic_grid, size)
            self.key = key
        if layers["static"] and self.static_layer:
            surface.blit(self.static_layer, origin)
        if layers["dynamic"] and self.dynamic_layer:
            surface.blit(self.dynamic_layer, origin)


def rounded(surface: pygame.Surface, color: tuple[int, int, int], rect: pygame.Rect, radius: int = 6, width: int = 0) -> None:
    pygame.draw.rect(surface, color, rect, width, border_radius=radius)


def draw_people_and_bots(surface: pygame.Surface, sim: MallSimulation, to_screen, timestamp: float, layers: dict, selected: Optional[str], scale: float) -> None:
    if layers["forecast"]:
        for person in sim.people[: sim.density]:
            points = [(person.x, person.y)] + [(item[0], item[1]) for item in person.forecast]
            projected = [to_screen(point) for point in points]
            for start, end in zip(projected, projected[1:]):
                dashed_line(surface, (*person.color, 140), start, end, max(1, round(scale * 1.5)), max(2, round(scale * 5)), max(2, round(scale * 6)), timestamp * 8 * scale)
            for x, y, _, sigma in person.forecast:
                px, py = to_screen((x, y))
                radius = max(3, round((sigma + 10) * scale))
                surface.blit(forecast_glow(radius, person.color), (px - radius, py - int(radius * 0.7)))
                pygame.draw.circle(surface, person.color, (px, py), max(2, round(2.2 * scale)))

    if layers["routes"]:
        for robot in sim.robots:
            active = selected is None or selected == robot.identifier
            color = robot.color if active else tuple(int(channel * 0.36) for channel in robot.color)
            points = [to_screen((robot.x, robot.y))] + [to_screen(point) for point in robot.route[max(1, robot.route_index) :]]
            for start, end in zip(points, points[1:]):
                dashed_line(surface, color, start, end, max(1, round(3 * scale)), max(3, round(7 * scale)), max(3, round(7 * scale)), timestamp * 13 * scale)
            gx, gy = to_screen(robot.task_point)
            pygame.draw.circle(surface, color, (gx, gy), max(5, round(10 * scale)), max(1, round(1.5 * scale)))
            pygame.draw.line(surface, color, (gx - 10, gy), (gx + 10, gy), max(1, round(scale)))
            pygame.draw.line(surface, color, (gx, gy - 10), (gx, gy + 10), max(1, round(scale)))

    for person in sim.people[: sim.density]:
        x, y = to_screen((person.x, person.y))
        pygame.draw.ellipse(surface, (70, 70, 60), (x - 9 * scale, y + 4 * scale, 18 * scale, 10 * scale))
        pygame.draw.ellipse(surface, (245, 241, 232), (x - 5 * scale, y - 3 * scale, 11 * scale, 14 * scale))
        pygame.draw.ellipse(surface, person.color, (x - 4 * scale, y - 2 * scale, 8 * scale, 11 * scale))
        pygame.draw.circle(surface, (198, 156, 120), (x, y - round(6 * scale)), max(2, round(3 * scale)))
        label(surface, person.identifier, x, y + round(13 * scale), (80, 95, 84), max(7, round(7 * scale)), True)

    for robot in sim.robots:
        x, y = to_screen((robot.x, robot.y))
        active = selected == robot.identifier
        if active:
            pulse = 19 + math.sin(timestamp * 2.3) * 2
            pygame.draw.circle(surface, (*robot.color, 100), (x, y), round(pulse * scale), max(1, round(scale)))
        size = max(14, round(24 * scale))
        body = pygame.Rect(x - size // 2, y - size // 2, size, size)
        rounded(surface, (39, 58, 52), body.inflate(3, 3), max(3, round(5 * scale)))
        rounded(surface, robot.color, body, max(3, round(4 * scale)))
        nose = (x + math.cos(robot.heading) * size * 0.5, y + math.sin(robot.heading) * size * 0.5)
        pygame.draw.circle(surface, (255, 247, 233), (round(nose[0]), round(nose[1])), max(2, round(2.6 * scale)))
        label(surface, robot.identifier, x, y + round(15 * scale), (44, 64, 53), max(7, round(8 * scale)), True)


def draw_map(surface: pygame.Surface, sim: MallSimulation, rect: pygame.Rect, timestamp: float, layers: dict, selected: Optional[str], risk_cache: RiskMapCache) -> None:
    pygame.draw.rect(surface, (229, 226, 217), rect)
    scale = min((rect.width - 28) / WORLD_W, (rect.height - 28) / WORLD_H)
    offset_x = rect.x + (rect.width - WORLD_W * scale) / 2
    offset_y = rect.y + (rect.height - WORLD_H * scale) / 2

    def to_screen(point: tuple[float, float]) -> tuple[int, int]:
        return round(offset_x + point[0] * scale), round(offset_y + point[1] * scale)

    origin = to_screen((0, 0))
    floor_rect = pygame.Rect(origin[0], origin[1], round(WORLD_W * scale), round(WORLD_H * scale))
    pygame.draw.rect(surface, (238, 236, 229), floor_rect)
    walk_start, walk_end = to_screen((14, 122)), to_screen((986, 498))
    pygame.draw.rect(surface, (245, 242, 235), pygame.Rect(walk_start[0], walk_start[1], walk_end[0] - walk_start[0], walk_end[1] - walk_start[1]))

    for x in range(24, 981, 40):
        pygame.draw.line(surface, (229, 228, 219), to_screen((x, 126)), to_screen((x, 494)), 1)
    for y in range(136, 487, 40):
        pygame.draw.line(surface, (229, 228, 219), to_screen((16, y)), to_screen((984, y)), 1)

    risk_cache.draw(surface, sim, origin, floor_rect.size, layers)

    for x, y, width, height, name, accent in RECTS:
        sx, sy = to_screen((x, y))
        ex, ey = to_screen((x + width, y + height))
        store = pygame.Rect(sx, sy, ex - sx, ey - sy)
        rounded(surface, (226, 222, 213), store, max(2, round(3 * scale)))
        pygame.draw.rect(surface, rgb(accent), (sx + 1, sy + 1, store.width - 2, max(2, round(4 * scale))))
        pygame.draw.rect(surface, (185, 187, 176), (sx + round(11 * scale), sy + round(21 * scale), max(5, round(18 * scale)), max(5, round(18 * scale))))
        pygame.draw.rect(surface, (185, 187, 176), (ex - round(29 * scale), sy + round(21 * scale), max(5, round(18 * scale)), max(5, round(18 * scale))))
        pygame.draw.line(surface, (198, 196, 187), (sx + round(10 * scale), sy + round(62 * scale)), (ex - round(10 * scale), sy + round(62 * scale)), max(1, round(scale)))
        label(surface, name, (sx + ex) // 2, sy + round(49 * scale), (83, 99, 88), max(7, round(9 * scale)), True)

    for kind, x, y, a, b, name in FIXTURES:
        px, py = to_screen((x, y))
        if kind == "rect":
            far_x, far_y = to_screen((x + a, y + b))
            box = pygame.Rect(px, py, far_x - px, far_y - py)
            fill = (224, 231, 218) if name == "PLANTER" else (231, 228, 220)
            pygame.draw.rect(surface, fill, box, border_radius=max(3, round(6 * scale)))
            pygame.draw.rect(surface, (190, 201, 185), box, max(1, round(scale)), border_radius=max(3, round(6 * scale)))
            if name == "LOUNGE":
                for dx in (18, 62):
                    cx, cy = to_screen((x + dx, y + 19))
                    pygame.draw.rect(surface, (169, 180, 168), (cx - round(13 * scale), cy - round(8 * scale), round(26 * scale), round(16 * scale)), border_radius=max(2, round(4 * scale)))
            if name == "BENCH":
                for dx in range(8, int(a - 4), 11):
                    sx, sy = to_screen((x + dx, y + 5))
                    ex, ey = to_screen((x + dx, y + b - 5))
                    pygame.draw.line(surface, (174, 159, 137), (sx, sy), (ex, ey), max(1, round(scale)))
            label(surface, name, px + (far_x - px) // 2, far_y + round(3 * scale), (94, 113, 99), max(6, round(7 * scale)), True)
        else:
            radius = round(a * scale)
            color = (218, 230, 223) if name == "FOUNTAIN" else (221, 232, 219)
            pygame.draw.circle(surface, color, (px, py), radius + round(4 * scale))
            pygame.draw.circle(surface, (174, 192, 181), (px, py), radius + round(4 * scale), max(1, round(scale)))
            pygame.draw.circle(surface, (185, 203, 194) if name == "FOUNTAIN" else (142, 170, 137), (px, py), max(2, radius - round(3 * scale)))
            if name == "FOUNTAIN":
                pygame.draw.circle(surface, (246, 247, 238), (px, py), max(2, radius - round(14 * scale)), max(1, round(scale)))
                label(surface, "FOUNTAIN", px, py + radius + round(7 * scale), (101, 128, 113), max(6, round(7 * scale)), True)

    topleft, bottomright = to_screen((11, 12)), to_screen((989, 608))
    pygame.draw.rect(surface, (122, 130, 117), pygame.Rect(topleft[0], topleft[1], bottomright[0] - topleft[0], bottomright[1] - topleft[1]), max(1, round(scale)))
    for y, text in ((144, "NORTH WALK"), (472, "SOUTH WALK")):
        px, py = to_screen((34, y))
        label(surface, text, px, py - 9, (105, 117, 106), max(6, round(8 * scale)), True)

    draw_people_and_bots(surface, sim, to_screen, timestamp, layers, selected, scale)
    sx, sy = to_screen((43, 565))
    ex, _ = to_screen((143, 565))
    pygame.draw.line(surface, (71, 87, 75), (sx, sy), (ex, sy), max(1, round(1.5 * scale)))
    label(surface, "2 M", sx + (ex - sx) // 2 - 10, sy - 15, (77, 91, 80), max(6, round(7 * scale)), True)


def draw_left_panel(surface: pygame.Surface, rect: pygame.Rect, sim: MallSimulation, layers: dict) -> None:
    pygame.draw.rect(surface, (34, 58, 49), rect)
    label(surface, "CONTROL PLANE", rect.x + 19, rect.y + 19, (157, 175, 159), 9, True)
    label(surface, "01 / 01", rect.right - 19, rect.y + 19, (112, 136, 119), 8, True, True)
    label(surface, "One shared", rect.x + 19, rect.y + 45, (240, 238, 227), 24)
    label(surface, "world state.", rect.x + 19, rect.y + 71, (240, 238, 227), 24)
    label(surface, "One coordinator feeds every agent", rect.x + 19, rect.y + 109, (177, 190, 174), 9)
    label(surface, "the same predicted risk field.", rect.x + 19, rect.y + 124, (177, 190, 174), 9)

    y = rect.y + 158
    pygame.draw.line(surface, (66, 89, 75), (rect.x + 19, y), (rect.right - 19, y), 1)
    pygame.draw.circle(surface, (223, 155, 116), (rect.x + 25, y + 17), 3)
    label(surface, "GLOBAL-01", rect.x + 36, y + 8, (243, 239, 228), 10, True)
    label(surface, "EXTERNAL STATE / 08 HZ", rect.x + 36, y + 24, (143, 164, 146), 7, True)
    branches_y = y + 47
    for column, color in enumerate(BOT_COLORS):
        x = rect.x + 49 + column * 62
        pygame.draw.line(surface, (194, 145, 111), (rect.centerx, y + 34), (x, branches_y), 1)
        pygame.draw.circle(surface, color, (x, branches_y + 7), 3)
        label(surface, f"R-0{column + 1}", x, branches_y + 16, (204, 216, 202), 7, True)
    label(surface, f"SHARED SNAPSHOT    #{sim.shared.revision:04d}", rect.x + 19, branches_y + 40, (143, 164, 146), 7, True)

    section_y = branches_y + 68
    pygame.draw.line(surface, (66, 89, 75), (rect.x + 19, section_y), (rect.right - 19, section_y), 1)
    label(surface, "PLANNING STACK", rect.x + 19, section_y + 11, (157, 175, 159), 8, True)
    model_rows = [
        ("A", "HUMAN MOTION", "RBF GP / ADAPTIVE HORIZON"),
        ("B", "GLOBAL ROUTE", "RISK-WEIGHTED RRT*"),
        ("C", "LOCAL CONTROL", "PREDICTIVE DWA"),
    ]
    for index, (letter, title, method) in enumerate(model_rows):
        row_y = section_y + 34 + index * 42
        label(surface, letter, rect.x + 19, row_y, (219, 151, 116), 9, True)
        label(surface, title, rect.x + 40, row_y, (224, 230, 218), 8, True)
        label(surface, method, rect.x + 40, row_y + 14, (143, 164, 146), 7, True)
        pygame.draw.line(surface, (59, 81, 68), (rect.x + 40, row_y + 32), (rect.right - 19, row_y + 32), 1)

    layer_y = section_y + 172
    label(surface, "MAP LAYERS  /  1-4", rect.x + 19, layer_y, (157, 175, 159), 8, True)
    layer_items = [("1", "STATIC RISK", "static"), ("2", "MOTION RISK", "dynamic"), ("3", "HUMAN FORECASTS", "forecast"), ("4", "FLEET ROUTES", "routes")]
    for index, (shortcut, name, key) in enumerate(layer_items):
        row_y = layer_y + 24 + index * 28
        color = (226, 175, 99) if key == "static" else (231, 130, 98) if key == "dynamic" else (128, 184, 160) if key == "forecast" else (158, 145, 198)
        pygame.draw.rect(surface, color if layers[key] else (87, 107, 92), (rect.x + 20, row_y + 3, 7, 7), border_radius=2)
        label(surface, name, rect.x + 35, row_y, (228, 230, 220) if layers[key] else (134, 153, 137), 8, True)
        label(surface, shortcut, rect.right - 20, row_y, (139, 158, 143), 8, True, True)

    note_y = rect.bottom - 100
    pygame.draw.line(surface, (66, 89, 75), (rect.x + 19, note_y), (rect.right - 19, note_y), 1)
    label(surface, "IHF-268 / REPLICATION NOTE", rect.x + 19, note_y + 11, (223, 161, 125), 7, True)
    label(surface, "Kernel, risk equation and fleet protocol", rect.x + 19, note_y + 26, (173, 187, 171), 7)
    label(surface, "are not fully specified in the paper.", rect.x + 19, note_y + 38, (173, 187, 171), 7)
    label(surface, "Exact reproduction is not verifiable.", rect.x + 19, note_y + 50, (173, 187, 171), 7)
    label(surface, "60 FPS / FIXED 1/60S PHYSICS", rect.x + 19, rect.bottom - 22, (127, 151, 134), 6, True)


def draw_right_panel(surface: pygame.Surface, rect: pygame.Rect, sim: MallSimulation, selected: Optional[str], density_rect: pygame.Rect, risk_rect: pygame.Rect) -> None:
    pygame.draw.rect(surface, (249, 248, 243), rect)
    label(surface, "SCENARIO MONITOR", rect.x + 18, rect.y + 19, (124, 136, 125), 8, True)
    label(surface, "04", rect.right - 18, rect.y + 19, (156, 164, 152), 8, True, True)
    label(surface, "Shared-space", rect.x + 18, rect.y + 45, (42, 64, 52), 23)
    label(surface, "performance", rect.x + 18, rect.y + 71, (42, 64, 52), 23)
    label(surface, "Three service robots in live pedestrian traffic.", rect.x + 18, rect.y + 107, (129, 139, 127), 8)

    telemetry = sim.telemetry()
    section = rect.y + 145
    pygame.draw.line(surface, (224, 226, 218), (rect.x + 18, section), (rect.right - 18, section), 1)
    label(surface, "LIVE SAFETY SIGNALS", rect.x + 18, section + 11, (121, 135, 123), 8, True)
    label(surface, "MIN CLEARANCE", rect.x + 18, section + 34, (77, 99, 83), 7, True)
    label(surface, "ROBOT TO PERSON", rect.x + 18, section + 48, (157, 166, 155), 6, True)
    label(surface, f"{telemetry['clearance']:.1f} m", rect.right - 18, section + 30, (51, 74, 59), 20, False, True)
    label(surface, "MEAN FIELD RISK", rect.x + 18, section + 78, (77, 99, 83), 7, True)
    label(surface, "WALKABLE CELLS", rect.x + 18, section + 92, (157, 166, 155), 6, True)
    label(surface, f"{telemetry['risk'] * 100:.0f}%", rect.right - 18, section + 74, (51, 74, 59), 20, False, True)

    fleet_y = section + 120
    pygame.draw.line(surface, (224, 226, 218), (rect.x + 18, fleet_y), (rect.right - 18, fleet_y), 1)
    label(surface, "FLEET / SHARED TASKS", rect.x + 18, fleet_y + 10, (121, 135, 123), 8, True)
    for index, robot in enumerate(sim.robots):
        y = fleet_y + 34 + index * 42
        focused = selected == robot.identifier
        if focused:
            pygame.draw.rect(surface, (239, 241, 234), (rect.x + 9, y - 3, rect.width - 18, 38), border_radius=4)
        pygame.draw.rect(surface, robot.color, (rect.x + 18, y + 1, 6, 20), border_radius=3)
        label(surface, robot.identifier, rect.x + 32, y, (63, 84, 68), 9, True)
        label(surface, robot.state, rect.x + 96, y + 1, (130, 146, 131), 6, True)
        label(surface, robot.task_label, rect.x + 32, y + 16, (129, 139, 127), 7, True)
        label(surface, ">", rect.right - 20, y + 7, (105, 133, 111), 11, True, True)

    control_y = fleet_y + 169
    pygame.draw.line(surface, (224, 226, 218), (rect.x + 18, control_y), (rect.right - 18, control_y), 1)
    label(surface, "ENVIRONMENT INPUTS", rect.x + 18, control_y + 10, (121, 135, 123), 8, True)
    label(surface, f"PEDESTRIAN DENSITY   {sim.density:02d}", rect.x + 18, control_y + 32, (76, 98, 83), 7, True)
    pygame.draw.line(surface, (190, 199, 186), (density_rect.left, density_rect.centery), (density_rect.right, density_rect.centery), 2)
    density_x = density_rect.left + round((sim.density - 4) / 8 * density_rect.width)
    pygame.draw.circle(surface, (70, 116, 90), (density_x, density_rect.centery), 5)
    label(surface, "LOW FLOW", density_rect.left, density_rect.bottom + 2, (156, 165, 153), 6, True)
    label(surface, "BUSY HOUR", density_rect.right, density_rect.bottom + 2, (156, 165, 153), 6, True, True)

    risk_y = control_y + 77
    label(surface, f"RISK AVERSION   {sim.risk_aversion:.2f}x", rect.x + 18, risk_y, (76, 98, 83), 7, True)
    pygame.draw.line(surface, (190, 199, 186), (risk_rect.left, risk_rect.centery), (risk_rect.right, risk_rect.centery), 2)
    risk_x = risk_rect.left + round((sim.risk_aversion - 0.4) / 2.0 * risk_rect.width)
    pygame.draw.circle(surface, (70, 116, 90), (risk_x, risk_rect.centery), 5)
    label(surface, "EFFICIENT", risk_rect.left, risk_rect.bottom + 2, (156, 165, 153), 6, True)
    label(surface, "CAUTIOUS", risk_rect.right, risk_rect.bottom + 2, (156, 165, 153), 6, True, True)


def draw_app(surface: pygame.Surface, sim: MallSimulation, running: bool, layers: dict, selected: Optional[str], speed: float, timestamp: float, risk_cache: RiskMapCache) -> tuple[pygame.Rect, pygame.Rect, pygame.Rect]:
    width, height = surface.get_size()
    surface.fill((241, 239, 232))
    pygame.draw.rect(surface, (27, 48, 40), (0, 0, width, 66))
    rounded(surface, (45, 70, 57), pygame.Rect(21, 18, 28, 28), 7)
    pygame.draw.circle(surface, (235, 231, 216), (29, 26), 2)
    pygame.draw.circle(surface, (235, 231, 216), (41, 37), 2)
    pygame.draw.circle(surface, (235, 231, 216), (41, 26), 2)
    pygame.draw.line(surface, (220, 151, 116), (30, 27), (40, 35), 1)
    label(surface, "MALLFLOW", 58, 17, (243, 240, 231), 13, True)
    label(surface, "SHARED NAVIGATION LAB", 58, 36, (152, 170, 155), 7, True)
    pygame.draw.line(surface, (73, 92, 78), (222, 18), (222, 49), 1)
    label(surface, "SCENARIO 04", 243, 17, (145, 164, 148), 7, True)
    label(surface, "Galleria midday", 243, 32, (241, 238, 228), 11)
    status_color = (217, 138, 103) if running else (130, 140, 126)
    pygame.draw.circle(surface, status_color, (width - 314, 32), 4)
    label(surface, "SIMULATION LIVE" if running else "SIMULATION PAUSED", width - 302, 26, (220, 226, 215), 7, True)
    label(surface, f"{int(sim.time // 60):02d}:{int(sim.time % 60):02d}", width - 148, 25, (242, 237, 227), 12, True)
    label(surface, "IHF-268", width - 25, 27, (224, 173, 139), 8, True, True)

    left = pygame.Rect(0, 66, 250, height - 66)
    right = pygame.Rect(width - 286, 66, 286, height - 66)
    map_rect = pygame.Rect(262, 112, width - 262 - 298, height - 219)
    draw_left_panel(surface, left, sim, layers)
    draw_right_panel(
        surface, right, sim, selected,
        pygame.Rect(right.x + 19, right.y + 482, right.width - 38, 15),
        pygame.Rect(right.x + 19, right.y + 530, right.width - 38, 15),
    )

    label(surface, "LIVE ENVIRONMENT  /  LEVEL 01", map_rect.x + 3, 78, (108, 126, 112), 7, True)
    label(surface, "North gallery  /  atrium floor", map_rect.x + 3, 91, (42, 61, 49), 15, True)
    label(surface, "GEOMETRIC MAP", map_rect.right, 81, (126, 138, 126), 6, True, True)
    label(surface, "20.0 x 12.4 M", map_rect.right, 95, (69, 89, 73), 8, True, True)
    draw_map(surface, sim, map_rect, timestamp, layers, selected, risk_cache)

    legend_y = map_rect.bottom + 10
    pygame.draw.rect(surface, (217, 123, 85), (map_rect.x + 2, legend_y + 3, 7, 7), border_radius=2)
    label(surface, "FLEET", map_rect.x + 14, legend_y, (114, 127, 114), 6, True)
    pygame.draw.circle(surface, (186, 137, 105), (map_rect.x + 75, legend_y + 6), 4)
    label(surface, "PEDESTRIAN", map_rect.x + 84, legend_y, (114, 127, 114), 6, True)
    pygame.draw.line(surface, (137, 122, 169), (map_rect.x + 177, legend_y + 7), (map_rect.x + 190, legend_y + 7), 2)
    label(surface, "GLOBAL ROUTE", map_rect.x + 195, legend_y, (114, 127, 114), 6, True)
    label(surface, f"{sim.density:02d} PEOPLE IN FIELD", map_rect.right, legend_y, (140, 148, 136), 6, True, True)

    playback_y = height - 50
    pygame.draw.line(surface, (213, 216, 205), (250, playback_y - 5), (width - 286, playback_y - 5), 1)
    play_rect = pygame.Rect(270, playback_y + 2, 31, 31)
    rounded(surface, (43, 71, 58), play_rect, 15)
    if running:
        pygame.draw.line(surface, (247, 243, 231), (play_rect.x + 12, play_rect.y + 9), (play_rect.x + 12, play_rect.y + 23), 2)
        pygame.draw.line(surface, (247, 243, 231), (play_rect.x + 19, play_rect.y + 9), (play_rect.x + 19, play_rect.y + 23), 2)
    else:
        pygame.draw.polygon(surface, (247, 243, 231), [(play_rect.x + 11, play_rect.y + 8), (play_rect.x + 22, play_rect.y + 16), (play_rect.x + 11, play_rect.y + 24)])
    reset_rect = pygame.Rect(309, playback_y + 2, 31, 31)
    pygame.draw.circle(surface, (239, 238, 229), reset_rect.center, 15)
    pygame.draw.arc(surface, (97, 119, 101), reset_rect.inflate(-11, -11), 0.5, 5.6, 2)
    label(surface, f"SIM T+ {int(sim.time // 60):02d}:{int(sim.time % 60):02d}", 351, playback_y + 7, (58, 79, 64), 9, True)
    track = pygame.Rect(485, playback_y + 16, max(50, width - 286 - 535), 2)
    pygame.draw.rect(surface, (215, 218, 207), track)
    progress = (sim.time % 48) / 48
    pygame.draw.rect(surface, (103, 140, 115), (track.x, track.y, max(2, round(track.width * progress)), track.height))
    label(surface, "00:00", track.x, playback_y + 24, (153, 160, 148), 6)
    label(surface, "48 SEC SCENARIO LOOP", track.right, playback_y + 24, (153, 160, 148), 6, True, True)
    speed_rect = pygame.Rect(width - 329, playback_y + 5, 37, 24)
    label(surface, f"{speed:g}x", speed_rect.centerx, speed_rect.y + 5, (74, 96, 79), 9, True)

    log_rect = pygame.Rect(width - 300, playback_y - 170, 286, 155)
    pygame.draw.rect(surface, (27, 48, 40), log_rect)
    pygame.draw.rect(surface, (70, 92, 77), log_rect, 1)
    label(surface, "EXTERNAL STATE LOG", log_rect.x + 8, log_rect.y + 6, (232, 183, 149), 7, True)
    for index, line in enumerate(log_lines[-8:]):
        label(surface, line, log_rect.x + 8, log_rect.y + 20 + index * 15, (197, 206, 193), 6)
    if not log_lines:
        label(surface, "WAITING FOR FIRST SHARED SNAPSHOT", log_rect.x + 8, log_rect.y + 36, (129, 143, 131), 6)
    return play_rect, reset_rect, map_rect


def main() -> None:
    screen = pygame.display.set_mode((1500, 900), pygame.RESIZABLE)
    clock = pygame.time.Clock()
    simulation = MallSimulation()
    risk_cache = RiskMapCache()
    running = True
    log_lines = []
    playing = True
    speed = 1.0
    layers = {"static": True, "dynamic": True, "forecast": True, "routes": True}
    selected: Optional[str] = None
    density_rect = pygame.Rect(0, 0, 0, 0)
    risk_rect = pygame.Rect(0, 0, 0, 0)
    accumulator = 0.0
    elapsed = 0.0

    while running:
        frame_seconds = min(0.06, clock.tick(60) / 1000)
        elapsed += frame_seconds
        if playing:
            accumulator += frame_seconds * speed
            while accumulator >= STEP:
                simulation.step(STEP)
                accumulator -= STEP
                if simulation.shared.revision > len(log_lines):
                    entry = simulation.shared
                    log_lines.append(f"T+{simulation.time:6.2f}s  REV {entry.revision:04d}  EPOCH {entry.route_epoch:02d}  HUMANS {simulation.density:02d}  FORECASTS {len(entry.forecasts):02d}  RISK {simulation.telemetry()['risk'] * 100:03.0f}%")
                    log_lines = log_lines[-10:]

        width = screen.get_width()
        right_x = width - 286
        density_rect = pygame.Rect(right_x + 19, 66 + 482, 286 - 38, 15)
        risk_rect = pygame.Rect(right_x + 19, 66 + 530, 286 - 38, 15)
        play_rect, reset_rect, map_rect = draw_app(screen, simulation, playing, layers, selected, speed, elapsed, risk_cache)
        pygame.display.flip()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.VIDEORESIZE:
                screen = pygame.display.set_mode((max(1080, event.w), max(720, event.h)), pygame.RESIZABLE)
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                elif event.key == pygame.K_SPACE:
                    playing = not playing
                elif event.key == pygame.K_r:
                    simulation.reset()
                elif event.key == pygame.K_s:
                    speed = {1.0: 1.5, 1.5: 0.65, 0.65: 1.0}[speed]
                elif event.key in (pygame.K_1, pygame.K_2, pygame.K_3, pygame.K_4):
                    key = {pygame.K_1: "static", pygame.K_2: "dynamic", pygame.K_3: "forecast", pygame.K_4: "routes"}[event.key]
                    layers[key] = not layers[key]
                elif event.key in (pygame.K_PLUS, pygame.K_EQUALS, pygame.K_KP_PLUS):
                    simulation.set_settings(simulation.density + 1, simulation.risk_aversion)
                elif event.key in (pygame.K_MINUS, pygame.K_KP_MINUS):
                    simulation.set_settings(simulation.density - 1, simulation.risk_aversion)
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                if play_rect.collidepoint(event.pos):
                    playing = not playing
                elif reset_rect.collidepoint(event.pos):
                    simulation.reset()
                elif density_rect.inflate(12, 10).collidepoint(event.pos):
                    value = round(4 + clamp((event.pos[0] - density_rect.left) / density_rect.width, 0, 1) * 8)
                    simulation.set_settings(value, simulation.risk_aversion)
                elif risk_rect.inflate(12, 10).collidepoint(event.pos):
                    value = 0.4 + clamp((event.pos[0] - risk_rect.left) / risk_rect.width, 0, 1) * 2
                    simulation.set_settings(simulation.density, value)
                elif event.pos[0] >= right_x:
                    panel_x = width - 286
                    fleet_start = 66 + 145 + 120 + 34
                    for index, robot in enumerate(simulation.robots):
                        row = pygame.Rect(panel_x, fleet_start + index * 42, 286, 38)
                        if row.collidepoint(event.pos):
                            selected = None if selected == robot.identifier else robot.identifier
            elif event.type == pygame.MOUSEMOTION and event.buttons[0]:
                if density_rect.inflate(12, 10).collidepoint(event.pos):
                    value = round(4 + clamp((event.pos[0] - density_rect.left) / density_rect.width, 0, 1) * 8)
                    simulation.set_settings(value, simulation.risk_aversion)
                elif risk_rect.inflate(12, 10).collidepoint(event.pos):
                    value = 0.4 + clamp((event.pos[0] - risk_rect.left) / risk_rect.width, 0, 1) * 2
                    simulation.set_settings(simulation.density, value)

    pygame.quit()


if __name__ == "__main__":
    main()