import { Line } from "react-chartjs-2";
import { TEXT } from "../constants/text";

export const LossChart = ({ stepData, lossLabel = TEXT.LOSS_MSE, title = TEXT.LOSS_TITLE }) => {
  if (!stepData || !stepData.loss_history) return null;

  const lossData = {
    labels: stepData.loss_history.map((_, i) => i + 1),
    datasets: [
      {
        label: lossLabel,
        data: stepData.loss_history,
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
    aspectRatio: 2,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
    },
    scales: {
      x: { title: { display: true, text: TEXT.EPOCH } },
      y: { title: { display: true, text: TEXT.LOSS } },
    },
  };

  return (
    <div className="chart-container">
      <h2>{title}</h2>
      <Line data={lossData} options={chartOptions} />
    </div>
  );
};
