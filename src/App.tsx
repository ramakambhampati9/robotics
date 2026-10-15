import { useState, type CSSProperties } from "react";
import SimulationCanvas, { type MapLayers } from "./SimulationCanvas";
import type { SimulationSettings, SimulationTelemetry } from "./simulation";

const DOI_URL = "https://doi.org/10.63808/ihf.v2i1.268";

function formatClock(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const wholeSeconds = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${tenths}`;
}

function PlayGlyph({ paused }: { paused: boolean }) {
  return paused ? (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.5 4.8 15 10l-8.5 5.2z" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.5 5.2v9.6M13.5 5.2v9.6" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

function ResetGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.2 9.7a5.9 5.9 0 1 0 1.4-3.8L3.7 8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.6 4.8v3.4H7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LayerSwitch({
  label,
  detail,
  active,
  color,
  onClick,
}: {
  label: string;
  detail: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button className="layer-row" type="button" aria-pressed={active} onClick={onClick}>
      <span className="layer-swatch" style={{ "--layer-color": color } as CSSProperties} />
      <span className="layer-copy">
        <span className="layer-name">{label}</span>
        <span className="layer-detail">{detail}</span>
      </span>
      <span className={`switch ${active ? "switch-on" : ""}`} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

function ModelRow({ index, title, method, detail }: { index: string; title: string; method: string; detail: string }) {
  return (
    <div className="model-row">
      <span className="model-index">{index}</span>
      <div className="model-content">
        <div className="model-heading">
          <span>{title}</span>
          <strong>{method}</strong>
        </div>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function App() {
  const [running, setRunning] = useState(true);
  const [settings, setSettings] = useState<SimulationSettings>({ riskAversion: 1.25, density: 9 });
  const [layers, setLayers] = useState<MapLayers>({ staticRisk: true, dynamicRisk: true, forecast: true, routes: true });
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [telemetry, setTelemetry] = useState<SimulationTelemetry | null>(null);
  const [logExpanded, setLogExpanded] = useState(true);

  const toggleLayer = (layer: keyof MapLayers) => {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  };

  const adjustRisk = (value: number) => {
    setSettings((current) => ({ ...current, riskAversion: value }));
  };

  const adjustDensity = (value: number) => {
    setSettings((current) => ({ ...current, density: value }));
  };

  const cycleSpeed = () => {
    setSimulationSpeed((current) => (current === 1 ? 1.5 : current === 1.5 ? 0.65 : 1));
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <i />
          </div>
          <div className="brand-copy">
            <span className="brand-name">MALLFLOW</span>
            <span className="brand-subtitle">SHARED NAVIGATION LAB</span>
          </div>
        </div>
        <div className="topbar-divider" />
        <div className="scene-title">
          <span className="scene-overline">SCENARIO 04</span>
          <span className="scene-name">Galleria midday</span>
        </div>
        <div className="topbar-spacer" />
        <div className="shared-status">
          <span className={`live-dot ${running ? "live-dot-on" : ""}`} />
          <span>{running ? "SIMULATION LIVE" : "SIMULATION PAUSED"}</span>
        </div>
        <div className="topbar-readout">
          <span className="readout-label">SIM CLOCK</span>
          <strong>{formatClock(telemetry?.clock)}</strong>
        </div>
        <div className="topbar-paper">IHF-268 <span>MODEL STUDY</span></div>
      </header>

      <div className="workbench">
        <aside className="left-panel">
          <section className="control-plane">
            <div className="section-kicker dark-kicker"><span>CONTROL PLANE</span><span>01 / 01</span></div>
            <h1>One shared<br />world state.</h1>
            <p className="left-intro">A single external coordinator feeds every robot the same human forecast and risk field.</p>

            <div className="state-bus" aria-label="One external state connected to three robots">
              <div className="bus-source">
                <span className="bus-led" />
                <span className="bus-source-copy"><strong>GLOBAL-01</strong><small>EXTERNAL STATE</small></span>
                <span className="bus-rate">08 Hz</span>
              </div>
              <div className="bus-branches" aria-hidden="true">
                <span /><span /><span />
              </div>
              <div className="bus-agents">
                <span><i className="agent-dot agent-a" />R-01</span>
                <span><i className="agent-dot agent-b" />R-02</span>
                <span><i className="agent-dot agent-c" />R-03</span>
              </div>
              <div className="bus-foot"><span>SHARED SNAPSHOT</span><strong>#{String(telemetry?.revision ?? 1).padStart(4, "0")}</strong></div>
            </div>
          </section>

          <section className="model-stack">
            <div className="section-kicker dark-kicker"><span>PLANNING STACK</span><span>02</span></div>
            <ModelRow index="A" title="Human motion" method="GP / BOUNDED" detail="RBF forecast / adaptive, speed-bounded horizon" />
            <ModelRow index="B" title="Global route" method="RRT*" detail="Risk-weighted tree / static mall geometry" />
            <ModelRow index="C" title="Local control" method="DWA" detail="Predictive velocity rollouts / yielding" />
          </section>

          <section className="map-layers">
            <div className="section-kicker dark-kicker"><span>MAP LAYERS</span><span>03</span></div>
            <LayerSwitch label="Static risk" detail="FIXTURES + PINCH POINTS" active={layers.staticRisk} color="#e4af63" onClick={() => toggleLayer("staticRisk")} />
            <LayerSwitch label="Motion risk" detail="PREDICTED OCCUPANCY" active={layers.dynamicRisk} color="#e78262" onClick={() => toggleLayer("dynamicRisk")} />
            <LayerSwitch label="Human forecasts" detail="GP MEAN + UNCERTAINTY" active={layers.forecast} color="#80b8a0" onClick={() => toggleLayer("forecast")} />
            <LayerSwitch label="Fleet routes" detail="GLOBAL PLAN + TASK GOAL" active={layers.routes} color="#9e91c6" onClick={() => toggleLayer("routes")} />
          </section>

          <details className="replication-note">
            <summary>
              <span className="note-mark">i</span>
              <span>ABOUT THIS REPLICATION</span>
              <span className="note-chevron" aria-hidden="true" />
            </summary>
            <div className="note-body">
              <p>The paper describes GP prediction, dynamic spatial risk, RRT* and modified DWA, but omits the kernel, risk equation, coefficients and multi-robot state protocol. Those details are not reproducible from the publication; this demo exposes its own deterministic assumptions instead of claiming an exact replication.</p>
              <a href={DOI_URL} target="_blank" rel="noreferrer">READ HUANG / IHF 2(1), ARTICLE 268 <span aria-hidden="true">&gt;</span></a>
            </div>
          </details>
          <div className="left-foot"><span className="foot-grid-icon" />DETERMINISTIC SCENARIO <span>/</span> 60 FPS</div>
        </aside>

        <main className="simulation-area">
          <div className="map-heading">
            <div>
              <div className="map-overline"><span className="map-overline-dot" />LIVE ENVIRONMENT <span className="map-overline-separator">/</span> LEVEL 01</div>
              <h2>North gallery <span>/</span> atrium floor</h2>
            </div>
            <div className="map-coordinate">
              <span>GEOMETRIC MAP</span>
              <strong>20.0 x 12.4 M</strong>
            </div>
          </div>

          <div className="map-frame">
            <SimulationCanvas
              running={running}
              settings={settings}
              layers={layers}
              selectedRobot={selectedRobot}
              resetSignal={resetSignal}
              speedScale={simulationSpeed}
              onTelemetry={setTelemetry}
            />
            <div className="canvas-stamp"><span className="stamp-dot" />FIELD RENDER <span>/</span> STATIC / DYNAMIC</div>
            <div className="axis-stamp">X / Y / LOCAL FRAME</div>
          </div>

          <div className="map-legend">
            <div className="legend-items">
              <span className="legend-item"><i className="legend-robot" />FLEET</span>
              <span className="legend-item"><i className="legend-human" />PEDESTRIAN</span>
              <span className="legend-item"><i className="legend-route" />GLOBAL ROUTE</span>
              <span className="legend-item"><i className="legend-heat" />PREDICTED RISK</span>
            </div>
            <span className="legend-density">{String(telemetry?.humans ?? settings.density).padStart(2, "0")} PEOPLE IN FIELD</span>
          </div>

          <footer className="playback-bar">
            <div className="playback-actions">
              <button className={`play-button ${running ? "is-running" : ""}`} type="button" onClick={() => setRunning((value) => !value)} aria-label={running ? "Pause simulation" : "Play simulation"}>
                <PlayGlyph paused={!running} />
              </button>
              <button className="reset-button" type="button" onClick={() => setResetSignal((value) => value + 1)} aria-label="Reset simulation" title="Reset simulation">
                <ResetGlyph />
              </button>
              <div className="playback-time"><span>SIMULATION TIME</span><strong>{formatClock(telemetry?.clock)}</strong></div>
            </div>
            <div className="playback-track-wrap" aria-hidden="true">
              <div className="playback-track"><span style={{ width: `${telemetry ? (telemetry.clock % 48) / 48 * 100 : 5}%` }} /></div>
              <div className="track-markers"><span>00:00</span><span>SCENARIO LOOP / 00:48</span><span>00:48</span></div>
            </div>
            <button className="speed-button" type="button" onClick={cycleSpeed} aria-label="Change simulation speed">
              <span className="speed-glyph" aria-hidden="true"><i /><i /><i /></span>
              {simulationSpeed}x
            </button>
          </footer>
        </main>

        <aside className="right-panel">
          <div className="right-panel-top">
            <div className="section-kicker light-kicker"><span>SCENARIO MONITOR</span><span>04</span></div>
            <h2>Shared-space<br />performance</h2>
            <p>Three service robots navigating live pedestrian traffic.</p>
          </div>

          <section className="metrics-section">
            <div className="section-kicker light-kicker"><span>LIVE SAFETY SIGNALS</span><span>01</span></div>
            <div className="metric-row">
              <div><span>MINIMUM CLEARANCE</span><small>ROBOT TO PERSON</small></div>
              <strong>{telemetry ? <>{telemetry.minClearance.toFixed(1)}<small>m</small></> : "--"}</strong>
            </div>
            <div className="metric-row">
              <div><span>MEAN FIELD RISK</span><small>WALKABLE CELLS</small></div>
              <strong>{telemetry ? <>{Math.round(telemetry.averageRisk * 100)}<small>%</small></> : "--"}</strong>
            </div>
          </section>

          <section className="fleet-section">
            <div className="section-kicker light-kicker"><span>FLEET / SHARED TASKS</span><span>03</span></div>
            <div className="fleet-list">
              {telemetry?.fleet.map((robot, index) => (
                <button
                  className={`fleet-row ${selectedRobot === robot.id ? "fleet-row-selected" : ""}`}
                  type="button"
                  key={robot.id}
                  onClick={() => setSelectedRobot((current) => current === robot.id ? null : robot.id)}
                  aria-pressed={selectedRobot === robot.id}
                >
                  <span className={`fleet-color fleet-color-${index + 1}`} />
                  <span className="fleet-identity">
                    <strong>{robot.id}<small>{robot.state === "YIELDING" ? "YIELDING" : "SHARED CONTROL"}</small></strong>
                    <span>{robot.goal}</span>
                  </span>
                  <span className="fleet-arrow" aria-hidden="true">&gt;</span>
                </button>
              )) ?? (
                <div className="fleet-loading">CONNECTING TO GLOBAL STATE</div>
              )}
            </div>
            <div className="fleet-foot"><span>{String(telemetry?.routeEpoch ?? 1).padStart(2, "0")}</span>GLOBAL ROUTE EPOCH <i /></div>
          </section>

          <section className="exposure-controls">
            <div className="section-kicker light-kicker"><span>ENVIRONMENT INPUTS</span><span>02</span></div>
            <label className="range-control">
              <span className="range-top"><span>PEDESTRIAN DENSITY</span><strong>{settings.density}<small> people</small></strong></span>
              <input min="4" max="12" step="1" type="range" value={settings.density} onChange={(event) => adjustDensity(Number(event.target.value))} aria-label="Pedestrian density" />
              <span className="range-ends"><span>LOW FLOW</span><span>BUSY HOUR</span></span>
            </label>
            <label className="range-control">
              <span className="range-top"><span>RISK AVERSION</span><strong>{settings.riskAversion.toFixed(2)}<small> x</small></strong></span>
              <input min="0.4" max="2.4" step="0.05" type="range" value={settings.riskAversion} onChange={(event) => adjustRisk(Number(event.target.value))} aria-label="Risk aversion" />
              <span className="range-ends"><span>EFFICIENT</span><span>CAUTIOUS</span></span>
            </label>
          </section>

          <section className="external-state-log">
            <div className="log-header">
              <div className="section-kicker light-kicker">
                <span>EXTERNAL STATE LOG</span>
                <span>08 HZ</span>
              </div>
              <button className="log-toggle" type="button" onClick={() => setLogExpanded((value) => !value)}>
                {logExpanded ? "MINIMIZE" : "EXPAND"}
              </button>
            </div>
            {logExpanded && (
              <div className="log-body">
                {telemetry?.logs && telemetry.logs.length > 0 ? (
                  telemetry.logs.slice().reverse().map((entry, index) => (
                    <div className="log-entry" key={`${entry.revision}-${index}`}>
                      <div className="log-entry-row">
                        <span className="log-time">{entry.time.toFixed(2)}s</span>
                        <span className="log-revision">REV #{String(entry.revision).padStart(4, "0")}</span>
                        <span className="log-epoch">EP {entry.routeEpoch}</span>
                        <span className="log-risk">R: {Math.round(entry.risk * 100)}%</span>
                      </div>
                      <div className="log-entry-row log-sub">
                        <span>{entry.humans} PEDESTRIANS ({entry.forecasts} FORECASTS)</span>
                      </div>
                      <div className="log-fleet-line">
                        {entry.fleet.join(" · ")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="log-empty">SYNCHRONIZING WITH GLOBAL STATE...</div>
                )}
              </div>
            )}
          </section>

          <div className="right-panel-foot">
            <span>SHARED PLANNER</span>
            <span><i /> {telemetry ? `${telemetry.revision} UPDATES` : "SYNCHRONIZING"}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;