import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";

const API = "http://localhost:8000/api/training-sessions";
const C_A = "#3182CE";
const C_B = "#E53E3E";

function norm(s) {
  const p = s.parameters || s.model_parameters || {};
  const ds = s.dataset;
  return {
    id: s.id ?? s.session_id ?? s.created_at,
    label:
      (s.name || s.algorithm || s.algorithm_type || "session") +
      (s.created_at
        ? " · " + s.created_at.slice(0, 16).replace("T", " ")
        : ""),
    algo: s.algorithm || s.algorithm_type || "",
    w: p.w,
    b: p.b,
    loss: s.final_loss ?? (s.metrics && s.metrics.final_loss),
    samples:
      s.training_samples ??
      (ds && ds.x ? ds.x.length : Array.isArray(ds) ? ds.length : undefined),
    lossHistory: s.loss_history || null,
    dataset: ds || null,
  };
}

function fmt(v) {
  return v == null ? "—" : typeof v === "number" ? v.toFixed(4) : v;
}

export default function CompareSessionsPage() {
  const auth = useAuth();
  const [sessions, setSessions] = useState([]);
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const curveRef = useRef(null);
  const lossRef = useRef(null);

  useEffect(() => {
    if (!auth.token) return;
    fetch(API, {
      headers: {
        "Authorization": `Bearer ${auth.token}`,
      },
    })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.sessions || [];
        setSessions(
          list
            .map(norm)
            .filter((s) =>
              s.algo.toLowerCase().includes("regression")
            )
        );
      })
      .catch(() => setSessions([]));
  }, []);

  const A = sessions.find((s) => String(s.id) === aId);
  const B = sessions.find((s) => String(s.id) === bId);
  const bOptions = A
    ? sessions.filter(
        (s) => s.algo === A.algo && String(s.id) !== aId
      )
    : [];
  const ready = A && B && A.algo === B.algo;
  const isLog = !!(A && A.algo.toLowerCase().includes("logistic"));
  const hasLoss = A && B && A.lossHistory && B.lossHistory;

  // Draw curves
  useEffect(() => {
    if (!ready) return;
    const W = 520,
      H = 360,
      p = 36;
    const ctx = curveRef.current.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    let x0 = isLog ? -10 : 0,
      x1 = 10;
    const allX = [];
    [A, B].forEach((S) => {
      const d = S.dataset;
      if (d && d.x) allX.push(...d.x);
      else if (Array.isArray(d)) d.forEach((o) => allX.push(o.x));
    });
    if (allX.length) {
      x0 = Math.min(...allX);
      x1 = Math.max(...allX);
    }

    const f = (S, x) =>
      isLog ? 1 / (1 + Math.exp(-(S.w * x + S.b))) : S.w * x + S.b;
    let y0, y1;
    if (isLog) {
      y0 = 0;
      y1 = 1;
    } else {
      const ys = [f(A, x0), f(A, x1), f(B, x0), f(B, x1)];
      y0 = Math.min(...ys);
      y1 = Math.max(...ys);
      const pad = (y1 - y0) * 0.1 || 1;
      y0 -= pad;
      y1 += pad;
    }

    const sx = (x) => p + ((x - x0) / (x1 - x0)) * (W - 2 * p);
    const sy = (y) =>
      H - p - ((y - y0) / (y1 - y0)) * (H - 2 * p);

    // Axes
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p, sy(isLog ? 0 : y0));
    ctx.lineTo(W - p, sy(isLog ? 0 : y0));
    ctx.moveTo(sx(x0), p);
    ctx.lineTo(sx(x0), H - p);
    ctx.stroke();

    // Data points
    [A, B].forEach((S, i) => {
      const d = S.dataset;
      if (!d) return;
      const pts = d.x
        ? d.x.map((xv, idx) => ({ x: xv, y: d.y[idx] }))
        : Array.isArray(d)
        ? d
        : [];
      ctx.fillStyle = (i ? C_B : C_A) + "55";
      pts.forEach((o) => {
        ctx.beginPath();
        ctx.arc(sx(o.x), sy(o.y), 3, 0, 7);
        ctx.fill();
      });
    });

    // Curves
    [[A, C_A], [B, C_B]].forEach(([S, col]) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = x0 + (i / 100) * (x1 - x0);
        const y = f(S, x);
        const X = sx(x);
        const Y = sy(y);
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
    });
  }, [ready, A, B, isLog]);

  // Draw loss chart
  useEffect(() => {
    if (!hasLoss) return;
    const W = 520,
      H = 200,
      p = 30;
    const ctx = lossRef.current.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    const all = [...A.lossHistory, ...B.lossHistory];
    const vmax = Math.max(...all);
    const vmin = Math.min(...all);
    const n = Math.max(A.lossHistory.length, B.lossHistory.length);
    const sx = (i) => p + (i / Math.max(n - 1, 1)) * (W - 2 * p);
    const sy = (v) =>
      H - p - ((v - vmin) / ((vmax - vmin) || 1)) * (H - 2 * p);

    [[A.lossHistory, C_A], [B.lossHistory, C_B]].forEach(([hist, col]) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      hist.forEach((v, i) => {
        const X = sx(i);
        const Y = sy(v);
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      });
      ctx.stroke();
    });
  }, [hasLoss, A, B]);

  const diff = (va, vb, dp = 4) => {
    if (va == null || vb == null) return "—";
    const d = vb - va;
    return `${d >= 0 ? "+" : ""}${d.toFixed(dp)}`;
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
        Compare Trained Sessions
      </h1>
      <p style={{ color: "#4A5568", fontSize: "14px", marginBottom: "24px" }}>
        Pick two saved sessions of the SAME algorithm to see how their
        coefficients and curves differ.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
            Session A
          </label>
          <select
            value={aId}
            onChange={(e) => {
              setAId(e.target.value);
              setBId("");
            }}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #CBD5E0",
              borderRadius: "4px",
            }}
          >
            <option value="">— choose —</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
            Session B {A && `(${A.algo} only)`}
          </label>
          <select
            value={bId}
            onChange={(e) => setBId(e.target.value)}
            disabled={!A}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #CBD5E0",
              borderRadius: "4px",
              backgroundColor: !A ? "#F7FAFC" : "white",
              opacity: !A ? 0.6 : 1,
            }}
          >
            <option value="">— choose —</option>
            {bOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!ready && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#EBF8FF",
            border: "1px solid #BEE3F8",
            borderRadius: "4px",
            color: "#2C5282",
          }}
        >
          Select Session A, then a different Session B of the same type.
        </div>
      )}

      {ready && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Diff table */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid #CBD5E0",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#F7FAFC" }}>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #CBD5E0" }}>
                    Metric
                  </th>
                  <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #CBD5E0" }}>
                    Session A
                  </th>
                  <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #CBD5E0" }}>
                    Session B
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      borderBottom: "2px solid #CBD5E0",
                      backgroundColor: "#FEF5E7",
                    }}
                  >
                    Δ (B − A)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #CBD5E0" }}>
                  <td style={{ padding: "12px" }}>Weight w</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    {fmt(A.w)}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    {fmt(B.w)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      backgroundColor: "#FEF5E7",
                      fontWeight: "600",
                    }}
                  >
                    {diff(A.w, B.w)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #CBD5E0" }}>
                  <td style={{ padding: "12px" }}>Bias b</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    {fmt(A.b)}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    {fmt(B.b)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      backgroundColor: "#FEF5E7",
                      fontWeight: "600",
                    }}
                  >
                    {diff(A.b, B.b)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #CBD5E0" }}>
                  <td style={{ padding: "12px" }}>Final loss</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    {fmt(A.loss)}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    {fmt(B.loss)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      backgroundColor: "#FEF5E7",
                      fontWeight: "600",
                    }}
                  >
                    {diff(A.loss, B.loss)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "12px" }}>Training samples</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    {A.samples ?? "—"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    {B.samples ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      backgroundColor: "#FEF5E7",
                      fontWeight: "600",
                    }}
                  >
                    {diff(A.samples, B.samples, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Curves */}
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
              {isLog ? "Sigmoid curves" : "Regression lines"}
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", fontWeight: "400", marginTop: "4px" }}>
                <span style={{ color: C_A }}>■ A</span>
                <span style={{ color: C_B }}>■ B</span>
              </div>
            </div>
            <canvas
              ref={curveRef}
              width={520}
              height={360}
              style={{
                border: "1px solid #CBD5E0",
                borderRadius: "4px",
                backgroundColor: "white",
                display: "block",
                width: "100%",
              }}
            />
            <p style={{ fontSize: "12px", color: "#718096", marginTop: "8px" }}>
              {isLog ? "sigmoid(w·x + b)" : "y = w·x + b"} — the gap between
              the two curves is the effect of the different coefficients.
            </p>
          </div>

          {/* Loss chart */}
          {hasLoss && (
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                Training loss over epochs
                <div style={{ display: "flex", gap: "16px", fontSize: "12px", fontWeight: "400", marginTop: "4px" }}>
                  <span style={{ color: C_A }}>■ A</span>
                  <span style={{ color: C_B }}>■ B</span>
                </div>
              </div>
              <canvas
                ref={lossRef}
                width={520}
                height={200}
                style={{
                  border: "1px solid #CBD5E0",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  display: "block",
                  width: "100%",
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
