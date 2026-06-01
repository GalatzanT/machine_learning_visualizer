import { useState, useEffect, useRef } from "react";

const API = "http://localhost:8000/dt-interactive";
const COLORS = ["#4299E1", "#F56565", "#48BB78", "#9F7AEA"];
const SETS = ["quadrants", "stripes", "corners"];

export default function DecisionTreeInteractivePage() {
  const [ds, setDs] = useState("quadrants");
  const [data, setData] = useState(null);
  const [step, setStep] = useState(0);
  const [play, setPlay] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [pred, setPred] = useState(null);
  const spaceRef = useRef(null);
  const treeRef = useRef(null);

  // Fetch tree when dataset changes
  useEffect(() => {
    setData(null);
    setStep(0);
    setPlay(false);
    setPred(null);
    fetch(`${API}?dataset=${ds}`)
      .then((r) => r.json())
      .then(setData);
  }, [ds]);

  const total = data ? data.total_steps : 0;

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

  // Visible nodes at current step
  const visible = () => {
    const s = new Set();
    if (!data) return s;
    s.add(0);
    for (let i = 0; i < step; i++) {
      s.add(data.steps[i].left_id);
      s.add(data.steps[i].right_id);
    }
    return s;
  };

  // Draw feature space
  useEffect(() => {
    if (!data) return;
    const W = 440,
      H = 440,
      p = 28;
    const vis = visible();
    const ctx = spaceRef.current.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    const b = data.tree["0"].bounds;
    const sx = (x) =>
      p + ((x - b.x_min) / (b.x_max - b.x_min)) * (W - 2 * p);
    const sy = (y) =>
      H - p - ((y - b.y_min) / (b.y_max - b.y_min)) * (H - 2 * p);

    // Shade regions
    Object.values(data.tree).forEach((n) => {
      if (!vis.has(n.id)) return;
      if (n.left_id != null && vis.has(n.left_id)) return;
      const q = n.bounds;
      ctx.fillStyle = COLORS[n.predicted_class] + "22";
      ctx.fillRect(
        sx(q.x_min),
        sy(q.y_max),
        sx(q.x_max) - sx(q.x_min),
        sy(q.y_min) - sy(q.y_max)
      );
    });

    // Draw points
    for (let i = 0; i < data.points.length; i++) {
      const pt = data.points[i];
      ctx.fillStyle = COLORS[pt.label];
      ctx.strokeStyle = "#1A202C";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx(pt.x), sy(pt.y), 4, 0, 7);
      ctx.fill();
      ctx.stroke();
    }

    // Highlight predicted point
    if (pred) {
      const leaf = pred.path[pred.path.length - 1];
      ctx.fillStyle = COLORS[data.tree[leaf].predicted_class];
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx(pred.x), sy(pred.y), 8, 0, 7);
      ctx.fill();
      ctx.stroke();
    }
  }, [data, step, pred]);

  // Draw tree
  useEffect(() => {
    if (!data) return;
    const c = treeRef.current;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);

    const vis = visible();
    const pos = {};
    let leaf = 0;
    let maxD = 0;

    const walk = (id) => {
      const n = data.tree[id];
      maxD = Math.max(maxD, n.depth);
      if (n.left_id == null) {
        pos[id] = { x: leaf++, d: n.depth };
        return pos[id].x;
      }
      const a = walk(n.left_id);
      const e = walk(n.right_id);
      pos[id] = { x: (a + e) / 2, d: n.depth };
      return pos[id].x;
    };
    walk(0);

    const px = 50,
      py = 40;
    const sx = (x) =>
      px + (x * (c.width - 2 * px)) / Math.max(leaf - 1, 1);
    const sy = (d) =>
      py + (d * (c.height - 2 * py)) / Math.max(maxD, 1);

    const path = new Set(pred ? pred.path : []);

    // Draw edges
    Object.values(data.tree).forEach((n) => {
      if (n.left_id == null || !vis.has(n.id)) return;
      [n.left_id, n.right_id].forEach((cid) => {
        if (!vis.has(cid)) return;
        const on = path.has(n.id) && path.has(cid);
        ctx.strokeStyle = on ? "#F6AD55" : "#CBD5E0";
        ctx.lineWidth = on ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(sx(pos[n.id].x), sy(pos[n.id].d));
        ctx.lineTo(sx(pos[cid].x), sy(pos[cid].d));
        ctx.stroke();
      });
    });

    // Draw nodes
    Object.values(data.tree).forEach((n) => {
      if (!vis.has(n.id)) return;
      const X = sx(pos[n.id].x);
      const Y = sy(pos[n.id].d);
      const on = path.has(n.id);
      const isSplit = n.left_id != null && vis.has(n.left_id);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (isSplit) {
        ctx.fillStyle = on ? "#FEEBC8" : "#EDF2F7";
        ctx.strokeStyle = on ? "#DD6B20" : "#4A5568";
        ctx.lineWidth = on ? 3 : 1.5;
        ctx.beginPath();
        ctx.arc(X, Y, 26, 0, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#2D3748";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(`${n.feature_name}≤${n.threshold}`, X, Y);
      } else {
        ctx.fillStyle = COLORS[n.predicted_class];
        ctx.strokeStyle = on ? "#DD6B20" : "#2D3748";
        ctx.lineWidth = on ? 3 : 1.5;
        ctx.beginPath();
        ctx.rect(X - 24, Y - 16, 48, 32);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(`C${n.predicted_class}`, X, Y - 5);
        ctx.font = "10px sans-serif";
        ctx.fillText(`n=${n.n_samples}`, X, Y + 8);
      }
    });
  }, [data, step, pred]);

  // Click to classify
  const onPick = (e) => {
    if (!data) return;
    const r = spaceRef.current.getBoundingClientRect();
    const b = data.tree["0"].bounds;
    const W = 440,
      H = 440,
      p = 28;
    const x =
      b.x_min +
      ((e.clientX - r.left - p) / (W - 2 * p)) * (b.x_max - b.x_min);
    const y =
      b.y_min +
      ((H - p - (e.clientY - r.top)) / (H - 2 * p)) * (b.y_max - b.y_min);

    let id = 0;
    const pth = [0];
    while (!data.tree[id].is_leaf) {
      const n = data.tree[id];
      id = (n.feature === 0 ? x : y) <= n.threshold ? n.left_id : n.right_id;
      pth.push(id);
    }
    setPred({ x, y, path: pth });
  };

  const st = step > 0 && data ? data.steps[step - 1] : null;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>🌳 Decision Tree — Interactive Builder</h1>
      <p>
        Each split cuts the 2D space and lowers Gini. Then click the plot to
        classify a point.
      </p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <select
          value={ds}
          onChange={(e) => setDs(e.target.value)}
          style={{ padding: "8px" }}
        >
          {SETS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          style={{
            padding: "8px 12px",
            backgroundColor: "#E2E8F0",
            border: "1px solid #CBD5E0",
            cursor: "pointer",
          }}
        >
          ◀ Prev
        </button>
        <button
          onClick={() => {
            setPred(null);
            setPlay((p) => !p);
          }}
          style={{
            padding: "8px 12px",
            backgroundColor: play ? "#ED8936" : "#3182CE",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          {play ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={() => setStep((s) => Math.min(s + 1, total))}
          style={{
            padding: "8px 12px",
            backgroundColor: "#E2E8F0",
            border: "1px solid #CBD5E0",
            cursor: "pointer",
          }}
        >
          Next ▶
        </button>

        <button
          onClick={() => {
            setStep(0);
            setPlay(false);
            setPred(null);
          }}
          style={{
            padding: "8px 12px",
            backgroundColor: "#F7FAFC",
            border: "1px solid #CBD5E0",
            cursor: "pointer",
          }}
        >
          ↺ Reset
        </button>

        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          Speed {speed}ms
          <input
            type="range"
            min="100"
            max="2000"
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            style={{ width: "150px" }}
          />
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        {COLORS.map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: c,
                borderRadius: "4px",
              }}
            />
            <span>Class {i}</span>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: "#EDF2F7", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
        <p>
          <strong>Step {step} / {total}</strong>
        </p>
        {step === 0 && (
          <p>Whole dataset = one region. The tree picks the split that lowers Gini most. Press ▶.</p>
        )}
        {st && (
          <div>
            <p>
              <strong>Node #{st.node_id}</strong>: {st.feature_name} ≤{" "}
              {st.threshold}
            </p>
            <p>
              Gini: {st.gini_before} → {st.gini_after} | Gain: +{st.gain} ({st.n_samples} samples)
            </p>
            <p style={{ fontSize: "0.9em", marginTop: "8px" }}>
              <strong>Candidates (best gain wins):</strong>
            </p>
            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
              {st.candidates.map((c, i) => (
                <li key={i}>
                  {c.feature_name} ≤ {c.threshold} → gain {c.gain}
                  {i === 0 ? " ✓" : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p style={{ fontSize: "0.9em", marginTop: "12px" }}>
          💡 Click the plot to drop a test point and watch it travel to a leaf.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        <div style={{ border: "1px solid #CBD5E0", borderRadius: "8px", padding: "10px" }}>
          <h3>Feature Space (X1 × X2)</h3>
          <canvas
            ref={spaceRef}
            width={440}
            height={440}
            onClick={onPick}
            style={{
              border: "1px solid #A0AEC0",
              backgroundColor: "#F7FAFC",
              cursor: "crosshair",
              display: "block",
            }}
          />
        </div>

        <div style={{ border: "1px solid #CBD5E0", borderRadius: "8px", padding: "10px" }}>
          <h3>Decision Tree</h3>
          <canvas
            ref={treeRef}
            width={440}
            height={440}
            style={{
              border: "1px solid #A0AEC0",
              backgroundColor: "#F7FAFC",
              display: "block",
            }}
          />
        </div>
      </div>
    </div>
  );
}
