import { Scatter } from "react-chartjs-2";
import { TEXT } from "../constants/text";

const getPointColor = (category) => {
  if (category === "low") return "rgba(75, 192, 75, 0.7)";
  if (category === "medium") return "rgba(255, 206, 86, 0.7)";
  return "rgba(255, 99, 132, 0.7)";
};

export const ScatterChart = ({
  dataset,
  model,
  previousModel,
  stepData,
  currentPointData,
  isPointByPoint = false,
  currentPointIndex = null,
  mode = "linear",
}) => {
  if (!dataset) return null;

  const isLogistic = mode === "logistic";

  // Determine which point index to highlight
  const highlightedIndex = currentPointIndex !== null ? currentPointIndex : (currentPointData?.point_index ?? -1);

  const logisticPointColor = dataset.y.map((yVal, i) => {
    if (highlightedIndex >= 0 && i === highlightedIndex) {
      return "rgba(255, 215, 0, 1)"; // Gold for current point
    }
    return yVal === 0 ? "rgba(66, 153, 225, 0.8)" : "rgba(245, 101, 101, 0.8)";
  });

  const logisticBorderColor = dataset.y.map((yVal, i) => {
    if (highlightedIndex >= 0 && i === highlightedIndex) {
      return "rgba(255, 0, 0, 1)"; // Red outline for current point
    }
    return yVal === 0 ? "rgba(44, 82, 130, 1)" : "rgba(197, 48, 48, 1)";
  });

  const logisticPointRadius = dataset.y.map((yVal, i) => {
    if (highlightedIndex >= 0 && i === highlightedIndex) {
      return 8; // Larger radius for highlighted point
    }
    return 6;
  });

  const logisticBorderWidth = dataset.y.map((yVal, i) => {
    if (highlightedIndex >= 0 && i === highlightedIndex) {
      return 3; // Thicker border for highlighted point
    }
    return 1;
  });

  const generateSigmoidCurve = (w, b) => {
    const minX = Math.min(...dataset.x);
    const maxX = Math.max(...dataset.x);
    const step = (maxX - minX) / 99;
    return Array.from({ length: 100 }, (_, i) => {
      const x = minX + i * step;
      const z = w * x + b;
      const y = 1 / (1 + Math.exp(-z));
      return { x, y };
    });
  };

  const scatterData = {
    datasets: [
      {
        label: isLogistic ? "Data points by class" : TEXT.DATA_POINTS,
        data: dataset.x.map((x, i) => ({ x, y: dataset.y[i] })),
        backgroundColor:
          isLogistic
            ? logisticPointColor
            : stepData && stepData.error_categories
            ? stepData.error_categories.map((cat) => getPointColor(cat))
            : dataset && currentPointData
              ? dataset.x.map((_, i) =>
                  i === currentPointData.point_index
                    ? "rgba(255, 0, 0, 1)"
                    : "rgba(54, 162, 235, 0.3)",
                )
              : "rgba(54, 162, 235, 0.6)",
        pointRadius:
            isLogistic
              ? logisticPointRadius
              : dataset && currentPointData
            ? dataset.x.map((_, i) =>
                i === currentPointData.point_index ? 15 : 8,
              )
            : 8,
        pointHoverRadius: 10,
        borderColor:
            isLogistic
              ? logisticBorderColor
              : dataset && currentPointData
            ? dataset.x.map((_, i) =>
                i === currentPointData.point_index
                  ? "rgba(255, 0, 0, 1)"
                  : "rgba(54, 162, 235, 1)",
              )
            : "rgba(54, 162, 235, 1)",
        borderWidth:
          isLogistic
            ? logisticBorderWidth
            : dataset && currentPointData
            ? dataset.x.map((_, i) =>
                i === currentPointData.point_index ? 3 : 1,
              )
            : 1,
      },
      ...(previousModel
        ? [
            {
              label: "Previous Epoch",
              data: isLogistic
                ? generateSigmoidCurve(previousModel.w, previousModel.b)
                : [
                    {
                      x: Math.min(...dataset.x),
                      y: previousModel.w * Math.min(...dataset.x) + previousModel.b,
                    },
                    {
                      x: Math.max(...dataset.x),
                      y: previousModel.w * Math.max(...dataset.x) + previousModel.b,
                    },
                  ],
              type: "line",
              borderColor: "rgba(150, 150, 150, 0.5)",
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false,
            },
          ]
        : []),
      {
        label: isLogistic ? "Sigmoid decision boundary" : "Current Epoch",
        data: isLogistic
          ? generateSigmoidCurve(model.w, model.b)
          : [
              {
                x: Math.min(...dataset.x),
                y: model.w * Math.min(...dataset.x) + model.b,
              },
              {
                x: Math.max(...dataset.x),
                y: model.w * Math.max(...dataset.x) + model.b,
              },
            ],
        type: "line",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 3,
        pointRadius: 0,
        fill: false,
      },
      ...(isLogistic
        ? [
            {
              label: "Threshold = 0.5",
              data: [
                { x: Math.min(...dataset.x), y: 0.5 },
                { x: Math.max(...dataset.x), y: 0.5 },
              ],
              type: "line",
              borderColor: "rgba(120, 120, 120, 0.7)",
              borderWidth: 2,
              borderDash: [6, 6],
              pointRadius: 0,
              fill: false,
            },
          ]
        : []),
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
              return `${TEXT.ERROR}: ${error.toFixed(3)}\n${TEXT.MAGNITUDE}: ${magnitude.toFixed(3)}`;
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
      y: isLogistic
        ? {
            min: -0.05,
            max: 1.05,
            title: { display: true, text: "Probability / Class" },
          }
        : { title: { display: true, text: "y" } },
    },
  };

  return (
    <div className="chart-container">
      <h2>{isLogistic ? "Data & Decision Boundary" : TEXT.SCATTER_TITLE}</h2>
      {currentPointData && (
        <div
          style={{
            background: "#fff3cd",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          <span style={{ fontSize: "16px", fontWeight: "bold" }}>
            🔴 {TEXT.ANALYZING_POINT} {currentPointData.point_index + 1}/
            {currentPointData.total_points}
          </span>
        </div>
      )}
      <Scatter data={scatterData} options={scatterOptions} />
    </div>
  );
};
