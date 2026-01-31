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
  stepData,
  currentPointData,
}) => {
  if (!dataset) return null;

  const scatterData = {
    datasets: [
      {
        label: TEXT.DATA_POINTS,
        data: dataset.x.map((x, i) => ({ x, y: dataset.y[i] })),
        backgroundColor:
          stepData && stepData.error_categories
            ? stepData.error_categories.map((cat) => getPointColor(cat))
            : dataset && currentPointData
              ? dataset.x.map((_, i) =>
                  i === currentPointData.point_index
                    ? "rgba(255, 0, 0, 1)"
                    : "rgba(54, 162, 235, 0.3)",
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
        label: TEXT.REGRESSION_LINE,
        data: [
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
      y: { title: { display: true, text: "y" } },
    },
  };

  return (
    <div className="chart-container">
      <h2>{TEXT.SCATTER_TITLE}</h2>
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
