import { useState, useRef } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Scatter, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const API_URL = "http://localhost:8000";

function App() {
  const [dataset, setDataset] = useState(null);
  const [learningRate, setLearningRate] = useState(0.01);
  const [model, setModel] = useState({ w: 1.0, b: 1.0 });
  const [stepData, setStepData] = useState(null);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [explanations, setExplanations] = useState([]);
  const [lrWarning, setLrWarning] = useState(null);
  const [freezeMode, setFreezeMode] = useState(false);
  const [freezeData, setFreezeData] = useState(null);
  const fileInputRef = useRef(null);

  // State pentru modul pas cu pas
  const [pointByPointMode, setPointByPointMode] = useState(false);
  const [currentPointData, setCurrentPointData] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_URL}/api/dataset/upload`,
        formData,
      );
      setDataset({ x: response.data.x_values, y: response.data.y_values });
      setModel({ w: 1.0, b: 1.0 });
      setStepData(null);
      setCurrentEpoch(0);
      setExplanations([]);
      setFreezeMode(false);
      alert(`✅ Dataset încărcat: ${response.data.num_points} puncte`);
    } catch (error) {
      alert("❌ Eroare: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleGenerateDataset = async (type) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/dataset/generate/${type}`,
      );
      setDataset({ x: response.data.x_values, y: response.data.y_values });
      setModel({ w: 1.0, b: 1.0 });
      setStepData(null);
      setCurrentEpoch(0);
      setExplanations([]);
      setFreezeMode(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      alert("❌ Eroare: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleGradientStep = async () => {
    if (!dataset) {
      alert("⚠️ Încarcă mai întâi un dataset!");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/gradient/step`);
      setModel({ w: response.data.w_after, b: response.data.b_after });
      setStepData(response.data);
      setCurrentEpoch(response.data.epoch);
      setExplanations(response.data.explanations);
      setFreezeMode(false);
    } catch (error) {
      alert("❌ Eroare: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleLearningRateChange = async (newLr) => {
    setLearningRate(newLr);
    try {
      const response = await axios.post(`${API_URL}/api/config/learning-rate`, {
        learning_rate: newLr,
      });
      setLrWarning(
        response.data.warnings.length > 0 ? response.data.warnings : null,
      );
    } catch (error) {
      console.error("Error setting learning rate:", error);
    }
  };

  const handleFreezeExplain = async () => {
    if (!dataset) {
      alert("⚠️ Încarcă mai întâi un dataset!");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/state/current`);
      setFreezeData(response.data);
      setFreezeMode(true);
    } catch (error) {
      alert("❌ Eroare: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleReset = async () => {
    try {
      await axios.post(`${API_URL}/api/model/reset`);
      setModel({ w: 1.0, b: 1.0 });
      setStepData(null);
      setCurrentEpoch(0);
      setExplanations([]);
      setFreezeMode(false);
      setFreezeData(null);
      setPointByPointMode(false);
      setCurrentPointData(null);
      setIsAutoPlaying(false);
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    } catch (error) {
      alert("❌ Eroare: " + (error.response?.data?.detail || error.message));
    }
  };

  const handlePointStep = async () => {
    if (!dataset) {
      alert("⚠️ Încarcă mai întâi un dataset!");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/gradient/point-step`);
      setCurrentPointData(response.data);
      setPointByPointMode(true);

      if (response.data.is_last_point) {
        setModel({ w: response.data.w_new, b: response.data.b_new });

        // Setează categoriile de eroare pentru colorare
        if (response.data.error_categories) {
          setStepData({
            error_categories: response.data.error_categories,
            error_magnitudes: response.data.error_magnitudes,
          });
        }

        setIsAutoPlaying(false);
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
          autoPlayRef.current = null;
        }
      }
    } catch (error) {
      alert("❌ Eroare: " + (error.response?.data?.detail || error.message));
      setIsAutoPlaying(false);
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    }
  };

  const handleAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    } else {
      setIsAutoPlaying(true);
      autoPlayRef.current = setInterval(() => {
        handlePointStep();
      }, 1000);
    }
  };

  const handleResetPointMode = async () => {
    try {
      await axios.post(`${API_URL}/api/gradient/point-reset`);
      setPointByPointMode(false);
      setCurrentPointData(null);
      setIsAutoPlaying(false);
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    } catch (error) {
      alert("❌ Eroare: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleResetAll = async () => {
    try {
      await axios.post(`${API_URL}/api/reset`);
      setDataset(null);
      setModel({ w: 1.0, b: 1.0 });
      setStepData(null);
      setCurrentEpoch(0);
      setExplanations([]);
      setFreezeMode(false);
      setFreezeData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      alert("❌ Eroare: " + (error.response?.data?.detail || error.message));
    }
  };

  const getPointColor = (category) => {
    if (category === "low") return "rgba(75, 192, 75, 0.7)";
    if (category === "medium") return "rgba(255, 206, 86, 0.7)";
    return "rgba(255, 99, 132, 0.7)";
  };

  const scatterData = {
    datasets: [
      {
        label: "Puncte Date",
        data: dataset ? dataset.x.map((x, i) => ({ x, y: dataset.y[i] })) : [],
        backgroundColor:
          stepData && stepData.error_categories
            ? stepData.error_categories.map((cat) => getPointColor(cat))
            : dataset && currentPointData
              ? dataset.x.map(
                  (_, i) =>
                    i === currentPointData.point_index
                      ? "rgba(255, 0, 0, 1)" // Punct activ - roșu
                      : "rgba(54, 162, 235, 0.3)", // Celelalte puncte - transparent
                )
              : "rgba(54, 162, 235, 0.6)",
        pointRadius:
          dataset && currentPointData
            ? dataset.x.map((_, i) =>
                i === currentPointData.point_index ? 15 : 8,
              )
            : 8,
        pointHoverRadius: 10,
        borderColor:
          dataset && currentPointData
            ? dataset.x.map((_, i) =>
                i === currentPointData.point_index
                  ? "rgba(255, 0, 0, 1)"
                  : "rgba(54, 162, 235, 1)",
              )
            : "rgba(54, 162, 235, 1)",
        borderWidth:
          dataset && currentPointData
            ? dataset.x.map((_, i) =>
                i === currentPointData.point_index ? 3 : 1,
              )
            : 1,
      },
      {
        label: "Linie Regresie",
        data: dataset
          ? [
              {
                x: Math.min(...dataset.x),
                y: model.w * Math.min(...dataset.x) + model.b,
              },
              {
                x: Math.max(...dataset.x),
                y: model.w * Math.max(...dataset.x) + model.b,
              },
            ]
          : [],
        type: "line",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 3,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.3,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: function (context) {
            if (stepData && stepData.errors && context.datasetIndex === 0) {
              const idx = context.dataIndex;
              const error = stepData.errors[idx];
              const magnitude = stepData.error_magnitudes[idx];
              return `Eroare: ${error.toFixed(3)}\nMagnitudine: ${magnitude.toFixed(3)}`;
            }
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: { display: true, text: "x" },
      },
      y: { title: { display: true, text: "y" } },
    },
  };

  const lossData = {
    labels:
      stepData && stepData.loss_history
        ? stepData.loss_history.map((_, i) => i + 1)
        : [],
    datasets: [
      {
        label: "Loss (MSE)",
        data: stepData && stepData.loss_history ? stepData.loss_history : [],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5,
    plugins: { legend: { position: "top" } },
    scales: { y: { beginAtZero: false } },
  };

  return (
    <div className="app">
      <h1>🧠 Sistem Explicativ ML - Gradient Descent</h1>

      <div className="controls">
        <div className="control-group">
          <label>📊 Încarcă Date</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
          />
        </div>

        <div className="control-group">
          <label>📦 Sau generează dataset:</label>
          <div className="button-group">
            <button
              className="btn-secondary"
              onClick={() => handleGenerateDataset("simple")}
            >
              Simple
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleGenerateDataset("noisy")}
            >
              Zgomotos
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleGenerateDataset("outliers")}
            >
              Cu Outlieri
            </button>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="lr-input">🎚️ Learning Rate: {learningRate}</label>
          <input
            id="lr-input"
            type="range"
            min="0.001"
            max="0.2"
            step="0.001"
            value={learningRate}
            onChange={(e) =>
              handleLearningRateChange(parseFloat(e.target.value))
            }
          />
          {lrWarning && (
            <div
              style={{
                background: "#fff3cd",
                padding: "10px",
                borderRadius: "4px",
                marginTop: "5px",
              }}
            >
              {lrWarning.map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </div>
          )}
        </div>

        <div className="button-group">
          <button
            className="btn-primary"
            onClick={handleGradientStep}
            disabled={!dataset}
            style={{ fontSize: "18px", padding: "15px 30px" }}
          >
            ▶️ Next Gradient Step
          </button>
          <button
            className="btn-secondary"
            onClick={handleFreezeExplain}
            disabled={!dataset}
          >
            ❄️ Freeze & Explain
          </button>
          <button
            className="btn-secondary"
            onClick={handleReset}
            disabled={!dataset}
          >
            🔄 Reset Model
          </button>
          <button className="btn-danger" onClick={handleResetAll}>
            🗑️ Reset Tot
          </button>
        </div>

        <div
          className="control-group"
          style={{
            borderTop: "2px solid #007bff",
            paddingTop: "15px",
            marginTop: "15px",
          }}
        >
          <label>🔍 Mod Pas cu Pas (Punct cu Punct)</label>
          <div className="button-group">
            <button
              className="btn-primary"
              onClick={handlePointStep}
              disabled={!dataset || isAutoPlaying}
              style={{ fontSize: "16px" }}
            >
              ➡️ Următorul Punct
            </button>
            <button
              className="btn-secondary"
              onClick={handleAutoPlay}
              disabled={!dataset}
              style={{
                background: isAutoPlaying ? "#dc3545" : "#28a745",
                color: "white",
              }}
            >
              {isAutoPlaying ? "⏸️ Pauză" : "▶️ Auto Play"}
            </button>
            <button
              className="btn-secondary"
              onClick={handleResetPointMode}
              disabled={!pointByPointMode}
            >
              🔄 Reset Mod
            </button>
          </div>
        </div>
      </div>

      {dataset && (
        <>
          <div className="info">
            Epocă: {currentEpoch} | Model: y = {model.w.toFixed(4)}·x +{" "}
            {model.b.toFixed(4)}
            {stepData &&
              stepData.loss_after &&
              stepData.gradient_magnitude &&
              ` | Loss: ${stepData.loss_after.toFixed(4)} | Gradient: ${stepData.gradient_magnitude.toFixed(4)}`}
          </div>

          {explanations.length > 0 && !freezeMode && (
            <div
              style={{
                background: "#e3f2fd",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "2px solid #2196f3",
              }}
            >
              <h3>💡 Ce s-a întâmplat în acest pas:</h3>
              {explanations.map((exp, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px",
                    marginBottom: "5px",
                    background: "white",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {exp}
                </div>
              ))}
            </div>
          )}

          {pointByPointMode && currentPointData && (
            <div
              style={{
                background: "#fff3cd",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "3px solid #ff9800",
              }}
            >
              <h2>
                🔍 Analiza Punctului {currentPointData.point_index + 1}/
                {currentPointData.total_points}
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginTop: "15px",
                }}
              >
                <div
                  style={{
                    background: "white",
                    padding: "15px",
                    borderRadius: "8px",
                  }}
                >
                  <h3>📊 Date Punct</h3>
                  <div style={{ fontFamily: "monospace", fontSize: "16px" }}>
                    <strong>x = {currentPointData.x_value.toFixed(4)}</strong>
                    <br />
                    <strong>
                      y<sub>actual</sub> ={" "}
                      {currentPointData.y_actual.toFixed(4)}
                    </strong>
                    <br />
                    <strong style={{ color: "#007bff" }}>
                      ŷ = {currentPointData.y_predicted.toFixed(4)}
                    </strong>
                    <br />
                    <strong
                      style={{
                        color:
                          currentPointData.error > 0 ? "#dc3545" : "#28a745",
                      }}
                    >
                      Eroare = {currentPointData.error.toFixed(4)}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    background: "white",
                    padding: "15px",
                    borderRadius: "8px",
                  }}
                >
                  <h3>📈 Contribuție Gradient</h3>
                  <div style={{ fontFamily: "monospace", fontSize: "16px" }}>
                    <strong>
                      ∂w = {currentPointData.contribution_w.toFixed(6)}
                    </strong>
                    <br />
                    <strong>
                      ∂b = {currentPointData.contribution_b.toFixed(6)}
                    </strong>
                    <br />
                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      Acumulat:
                      <br />
                      Σ∂w = {currentPointData.accumulated_gradient_w.toFixed(6)}
                      <br />
                      Σ∂b = {currentPointData.accumulated_gradient_b.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "15px",
                  borderRadius: "8px",
                  marginTop: "15px",
                }}
              >
                <h3>💭 Explicație</h3>
                <p style={{ fontSize: "14px", margin: 0 }}>
                  {currentPointData.explanation}
                </p>
              </div>

              {currentPointData.is_last_point && (
                <div
                  style={{
                    background: "#d4edda",
                    border: "2px solid #28a745",
                    padding: "15px",
                    borderRadius: "8px",
                    marginTop: "15px",
                  }}
                >
                  <h3>✅ Update Final</h3>
                  <div style={{ fontFamily: "monospace", fontSize: "16px" }}>
                    <strong>
                      w: {currentPointData.w_current.toFixed(4)} →{" "}
                      {currentPointData.w_new.toFixed(4)}
                    </strong>
                    <br />
                    <strong>
                      b: {currentPointData.b_current.toFixed(4)} →{" "}
                      {currentPointData.b_new.toFixed(4)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {freezeMode && freezeData && (
            <div
              style={{
                background: "#f0f0f0",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "3px solid #666",
              }}
            >
              <h2>❄️ Modul FREEZE & EXPLAIN</h2>

              <h3>📐 Formula MSE (Mean Squared Error):</h3>
              <div
                style={{
                  background: "white",
                  padding: "15px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}
              >
                <strong>{freezeData.mse_breakdown.formula}</strong>
                <div style={{ marginTop: "10px" }}>
                  n = {freezeData.mse_breakdown.n}
                  <br />
                  Σ(yᵢ - ŷᵢ)² ={" "}
                  {freezeData.mse_breakdown.sum_squared_errors.toFixed(4)}
                  <br />
                  <strong>
                    MSE = {freezeData.mse_breakdown.mse_value.toFixed(4)}
                  </strong>
                </div>
              </div>

              <h3 style={{ marginTop: "15px" }}>📉 Formula Gradient:</h3>
              <div
                style={{
                  background: "white",
                  padding: "15px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}
              >
                <strong>∇w: {freezeData.gradient_breakdown.dw_formula}</strong>
                <br />Σ xᵢ(yᵢ - ŷᵢ) ={" "}
                {freezeData.gradient_breakdown.sum_x_errors.toFixed(4)}
                <br />
                <strong>
                  ∇w = {freezeData.gradient_breakdown.dw_value.toFixed(4)}
                </strong>
                <div style={{ marginTop: "10px" }}>
                  <strong>
                    ∇b: {freezeData.gradient_breakdown.db_formula}
                  </strong>
                  <br />
                  Σ(yᵢ - ŷᵢ) ={" "}
                  {freezeData.gradient_breakdown.sum_errors.toFixed(4)}
                  <br />
                  <strong>
                    ∇b = {freezeData.gradient_breakdown.db_value.toFixed(4)}
                  </strong>
                </div>
              </div>

              <button
                onClick={() => setFreezeMode(false)}
                style={{ marginTop: "15px", padding: "10px 20px" }}
                className="btn-primary"
              >
                ▶️ Continuă
              </button>
            </div>
          )}

          <div className="charts">
            <div className="chart-container" style={{ gridColumn: "1 / -1" }}>
              <h2>📊 Date & Erori per Punct</h2>
              {stepData && (
                <div style={{ marginBottom: "10px", fontSize: "14px" }}>
                  <span style={{ color: "rgb(75, 192, 75)" }}>
                    🟢 Eroare Mică
                  </span>{" "}
                  |
                  <span
                    style={{ color: "rgb(255, 206, 86)", marginLeft: "10px" }}
                  >
                    🟡 Eroare Medie
                  </span>{" "}
                  |
                  <span
                    style={{ color: "rgb(255, 99, 132)", marginLeft: "10px" }}
                  >
                    🔴 Eroare Mare
                  </span>
                </div>
              )}
              <Scatter data={scatterData} options={scatterOptions} />
            </div>

            {stepData && stepData.loss_history && (
              <div className="chart-container">
                <h2>📈 Evoluția Loss-ului</h2>
                <Line data={lossData} options={chartOptions} />
              </div>
            )}

            {stepData && stepData.contributions && (
              <div className="chart-container">
                <h2>🎯 Contribuții la Gradient</h2>
                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    fontSize: "12px",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f0f0f0" }}>
                        <th
                          style={{ padding: "8px", border: "1px solid #ddd" }}
                        >
                          Punct
                        </th>
                        <th
                          style={{ padding: "8px", border: "1px solid #ddd" }}
                        >
                          Eroare
                        </th>
                        <th
                          style={{ padding: "8px", border: "1px solid #ddd" }}
                        >
                          ∇w
                        </th>
                        <th
                          style={{ padding: "8px", border: "1px solid #ddd" }}
                        >
                          ∇b
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stepData.contributions.errors.map((err, i) => (
                        <tr key={i}>
                          <td
                            style={{
                              padding: "8px",
                              border: "1px solid #ddd",
                              textAlign: "center",
                            }}
                          >
                            {i}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              border: "1px solid #ddd",
                              textAlign: "center",
                              color: err > 0 ? "red" : "blue",
                            }}
                          >
                            {err.toFixed(3)}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              border: "1px solid #ddd",
                              textAlign: "center",
                            }}
                          >
                            {stepData.contributions.dw_individual[i].toFixed(3)}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              border: "1px solid #ddd",
                              textAlign: "center",
                            }}
                          >
                            {stepData.contributions.db_individual[i].toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!dataset && (
        <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>
          <h2>👆 Începe prin a încărca un dataset sau a genera unul</h2>
        </div>
      )}
    </div>
  );
}

export default App;
