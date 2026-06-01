import { useState, useEffect, useRef } from "react";

const API = "http://localhost:8000/kmeans-interactive";
const COLORS = [
  "#4299E1",
  "#F56565",
  "#48BB78",
  "#9F7AEA",
  "#ED8936",
  "#38B2AC",
  "#D69E2E",
  "#EC4899",
];
const SETS = ["blobs3", "blobs4", "uniform"];

export default function KMeansInteractivePage() {
  const [ds, setDs] = useState("blobs3");
  const [k, setK] = useState(3);
  const [seed, setSeed] = useState(1);
  const [data, setData] = useState(null);
  const [step, setStep] = useState(0);
  const [play, setPlay] = useState(false);
  const [speed, setSpeed] = useState(900);
  const [pred, setPred] = useState(null);
  const mainRef = useRef(null);
  const chartRef = useRef(null);

  // Fetch when dataset, k, or seed changes
  useEffect(() => {
    setData(null);
    setStep(0);
    setPlay(false);
    setPred(null);
    fetch(`${API}?dataset=${ds}&k=${k}&seed=${seed}`)
      .then((r) => r.json())
      .then(setData);
  }, [ds, k, seed]);

  const total = data ? data.total_steps - 1 : 0;

  // Animation loop
  useEffect(() => {
    if (!play) return;
    if (step >= total) {
      setPlay(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), speed);
    return () => clearTimeout(t);
  }, [play, step, total, speed]);

  const bounds = () => {
    const xs = data.points.map((q) => q.x);
    const ys = data.points.map((q) => q.y);
    return {
      x0: Math.min(...xs) - 0.5,
      x1: Math.max(...xs) + 0.5,
      y0: Math.min(...ys) - 0.5,
      y1: Math.max(...ys) + 0.5,
    };
  };

  // Draw main canvas
  useEffect(() => {
    if (!data) return;
    const W = 460,
      H = 460,
      p = 28;
    const ctx = mainRef.current.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    const b = bounds();
    const sx = (x) => p + ((x - b.x0) / (b.x1 - b.x0)) * (W - 2 * p);
    const sy = (y) => H - p - ((y - b.y0) / (b.y1 - b.y0)) * (H - 2 * p);

    const cur = data.steps[step];
    const C = cur.centroids;
    const lab = cur.assignments;

    // Lines from points to centroids
    lab.forEach((l, i) => {
      if (l < 0) return;
      ctx.strokeStyle = COLORS[l % 8] + "33";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx(data.points[i].x), sy(data.points[i].y));
      ctx.lineTo(sx(C[l].x), sy(C[l].y));
      ctx.stroke();
    });

    // Points
    data.points.forEach((q, i) => {
      const l = lab[i];
      ctx.fillStyle = l < 0 ? "#A0AEC0" : COLORS[l % 8];
      ctx.strokeStyle = "#1A202C";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), 4, 0, 7);
      ctx.fill();
      ctx.stroke();
    });

    // Centroid move arrows
    if (cur.type === "move" && cur.shifts) {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#1A202C";
      ctx.lineWidth = 1.5;
      cur.shifts.forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(sx(s.from.x), sy(s.from.y));
        ctx.lineTo(sx(s.to.x), sy(s.to.y));
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // Centroids (stars)
    C.forEach((c, j) => {
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = COLORS[j % 8];
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.strokeText("★", sx(c.x), sy(c.y));
      ctx.fillText("★", sx(c.x), sy(c.y));
    });

    // Test point
    if (pred) {
      ctx.fillStyle = COLORS[pred.cluster % 8];
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx(pred.x), sy(pred.y), 8, 0, 7);
      ctx.fill();
      ctx.stroke();
    }
  }, [data, step, pred]);

  // Draw inertia chart
  useEffect(() => {
    if (!data) return;
    const W = 300,
      H = 140,
      p = 24;
    const ctx = chartRef.current.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    const pts = data.steps
      .map((s, i) => ({ i, v: s.inertia }))
      .filter((o) => o.v != null);
    if (!pts.length) return;

    const vmax = Math.max(...pts.map((o) => o.v));
    const vmin = Math.min(...pts.map((o) => o.v));
    const sx = (i) => p + (i / (data.steps.length - 1)) * (W - 2 * p);
    const sy = (v) =>
      H - p - ((v - vmin) / ((vmax - vmin) || 1)) * (H - 2 * p);

    // Line
    ctx.strokeStyle = "#4299E1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((o, idx) => {
      const X = sx(o.i);
      const Y = sy(o.v);
      idx ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    });
    ctx.stroke();

    // Points on line
    pts.forEach((o) => {
      ctx.fillStyle = o.i === step ? "#E53E3E" : "#4299E1";
      ctx.beginPath();
      ctx.arc(sx(o.i), sy(o.v), o.i === step ? 5 : 3, 0, 7);
      ctx.fill();
    });

    // Label
    ctx.fillStyle = "#718096";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Inertia (lower = better)", p, 12);
  }, [data, step]);

  // Click to classify
  const onPick = (e) => {
    if (!data) return;
    const r = mainRef.current.getBoundingClientRect();
    const W = 460,
      H = 460,
      p = 28;
    const b = bounds();
    const x =
      b.x0 + ((e.clientX - r.left - p) / (W - 2 * p)) * (b.x1 - b.x0);
    const y =
      b.y0 +
      ((H - p - (e.clientY - r.top)) / (H - 2 * p)) * (b.y1 - b.y0);

    let best = 0;
    let bd = Infinity;
    data.final_centroids.forEach((c, j) => {
      const d = (c.x - x) ** 2 + (c.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = j;
      }
    });

    setPlay(false);
    setStep(total);
    setPred({ x, y, cluster: best });
  };

  const cur = data ? data.steps[step] : null;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
        K-Means — Interactive Training
      </h1>
      <p style={{ color: "#4A5568", fontSize: "14px", marginBottom: "24px" }}>
        Watch training alternate Assign ↔ Update until centroids stop moving.
        Inertia drops every step.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: "24px",
        }}
      >
        {/* Left panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <select
            value={ds}
            onChange={(e) => setDs(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #CBD5E0",
              borderRadius: "4px",
            }}
          >
            {SETS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div style={{ fontSize: "14px" }}>
            Clusters k = {k}
            <input
              type="range"
              min="2"
              max="8"
              value={k}
              onChange={(e) => setK(+e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <button
            onClick={() => setSeed((s) => s + 1)}
            style={{
              width: "100%",
              backgroundColor: "#A855F7",
              color: "white",
              padding: "8px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            🎲 Re-initialize
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              style={{
                flex: 1,
                backgroundColor: "#E2E8F0",
                padding: "8px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              ◀
            </button>
            <button
              onClick={() => {
                setPred(null);
                setPlay((p) => !p);
              }}
              style={{
                flex: 1,
                backgroundColor: play ? "#ED8936" : "#3182CE",
                color: "white",
                padding: "8px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              {play ? "⏸" : "▶"}
            </button>
            <button
              onClick={() => setStep((s) => Math.min(s + 1, total))}
              style={{
                flex: 1,
                backgroundColor: "#E2E8F0",
                padding: "8px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              ▶
            </button>
          </div>

          <button
            onClick={() => {
              setStep(0);
              setPlay(false);
              setPred(null);
            }}
            style={{
              width: "100%",
              backgroundColor: "#F7FAFC",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #CBD5E0",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ↺ Reset
          </button>

          <div style={{ fontSize: "14px" }}>
            Speed {speed}ms
            <input
              type="range"
              min="300"
              max="1800"
              step="100"
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ fontSize: "14px", color: "#4A5568" }}>
            Step <b>{step}</b> / {total}
          </div>

          <canvas
            ref={chartRef}
            width={300}
            height={140}
            style={{
              border: "1px solid #CBD5E0",
              borderRadius: "4px",
              backgroundColor: "white",
              width: "100%",
            }}
          />

          {cur && cur.type === "init" && (
            <div
              style={{
                fontSize: "14px",
                border: "1px solid #BEE3F8",
                borderRadius: "4px",
                padding: "12px",
                backgroundColor: "#EBF8FF",
              }}
            >
              {cur.detail} Press ▶ to train: it alternates Assign ↔ Update
              until the centroids stop moving.
            </div>
          )}

          {cur && cur.type !== "init" && (
            <div
              style={{
                fontSize: "14px",
                border: "1px solid #CBD5E0",
                borderRadius: "4px",
                padding: "12px",
                backgroundColor: "white",
              }}
            >
              <b>
                Step {step}/{total} — iter {cur.iteration}:{" "}
                {cur.type === "assign" ? "Assign" : "Update centroids"}
              </b>
              <div style={{ marginTop: "8px" }}>{cur.detail}</div>
              {cur.type === "assign" && cur.iteration > 1 && (
                <div style={{ fontSize: "12px", color: "#4A5568", marginTop: "8px" }}>
                  Points reassigned: <b>{cur.changed}</b>
                </div>
              )}
              {cur.type === "move" && (
                <ul
                  style={{
                    fontSize: "12px",
                    color: "#4A5568",
                    margin: "8px 0",
                    paddingLeft: "20px",
                  }}
                >
                  {cur.shifts.map((s) => (
                    <li key={s.id}>
                      C{s.id} moved {s.dist}
                    </li>
                  ))}
                </ul>
              )}
              {cur.inertia != null && (
                <div style={{ fontSize: "12px", marginTop: "8px" }}>
                  Inertia: <b>{cur.inertia}</b>
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: "12px", color: "#718096", borderTop: "1px solid #CBD5E0", paddingTop: "8px" }}>
            💡 Click the plot to drop a point and see which cluster it belongs
            to.
          </div>
        </div>

        {/* Right panel */}
        <div>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            Feature space (★ = centroid)
          </div>
          <canvas
            ref={mainRef}
            width={460}
            height={460}
            onClick={onPick}
            style={{
              border: "1px solid #CBD5E0",
              borderRadius: "4px",
              backgroundColor: "white",
              cursor: "crosshair",
              display: "block",
            }}
          />
        </div>
      </div>
    </div>
  );
}
