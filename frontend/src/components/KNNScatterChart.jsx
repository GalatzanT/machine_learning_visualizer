import React from "react";

export function KNNScatterChart({
  dataset,
  decisionBoundary,
  currentPrediction,
  predictions
}) {
  if (!dataset) return null;

  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Get data bounds
    const minX = Math.min(...dataset.x);
    const maxX = Math.max(...dataset.x);
    const rangeX = maxX - minX || 1;

    // Draw background regions based on decision boundary
    if (decisionBoundary && decisionBoundary.x && decisionBoundary.y) {
      const boundX = decisionBoundary.x;
      const boundY = decisionBoundary.y;

      for (let i = 0; i < boundX.length - 1; i++) {
        const x1 = padding + ((boundX[i] - minX) / rangeX) * plotWidth;
        const x2 = padding + ((boundX[i + 1] - minX) / rangeX) * plotWidth;
        const pred = boundY[i];

        ctx.fillStyle =
          pred === 0 ? "rgba(173, 216, 230, 0.3)" : "rgba(255, 192, 203, 0.3)";
        ctx.fillRect(x1, padding, x2 - x1, plotHeight);
      }
    }

    // Draw axes
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding + plotHeight);
    ctx.lineTo(padding + plotWidth, padding + plotHeight);
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + plotHeight);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + plotWidth, y);
      ctx.stroke();
    }

    // Draw training points
    dataset.x.forEach((x, i) => {
      const canvasX = padding + ((x - minX) / rangeX) * plotWidth;
      const canvasY = padding + plotHeight - ((dataset.y[i] * 0.3) + 0.1) * plotHeight;

      ctx.fillStyle = dataset.y[i] === 0 ? "rgba(66, 153, 225, 0.8)" : "rgba(245, 101, 101, 0.8)";
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = dataset.y[i] === 0 ? "rgba(44, 82, 130, 1)" : "rgba(197, 48, 48, 1)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw neighbor connections if current prediction exists
    if (currentPrediction && currentPrediction.neighbor_indices) {
      const currentX = padding + ((currentPrediction.x - minX) / rangeX) * plotWidth;
      const currentY = padding + plotHeight - ((currentPrediction.prediction * 0.3) + 0.1) * plotHeight;

      currentPrediction.neighbor_indices.forEach((idx) => {
        const neighborX = padding + ((dataset.x[idx] - minX) / rangeX) * plotWidth;
        const neighborY = padding + plotHeight - ((dataset.y[idx] * 0.3) + 0.1) * plotHeight;

        ctx.strokeStyle = "rgba(200, 200, 0, 0.5)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
        ctx.lineTo(neighborX, neighborY);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw current prediction point (green)
      ctx.fillStyle = "rgba(0, 200, 0, 0.9)";
      ctx.beginPath();
      ctx.arc(currentX, currentY, 7, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 100, 0, 1)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw previous predictions
    predictions.forEach((pred) => {
      const x = padding + ((pred.x - minX) / rangeX) * plotWidth;
      const y = padding + plotHeight - ((pred.prediction * 0.3) + 0.1) * plotHeight;

      ctx.fillStyle = pred.prediction === 0 ? "rgba(173, 216, 230, 0.6)" : "rgba(255, 192, 203, 0.6)";
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw axis labels
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(minX.toFixed(1), padding, padding + plotHeight + 20);
    ctx.fillText(maxX.toFixed(1), padding + plotWidth, padding + plotHeight + 20);
    ctx.fillText("Feature X", padding + plotWidth / 2, height - 5);

    ctx.save();
    ctx.translate(15, padding + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Class", 0, 0);
    ctx.restore();

    // Draw legend
    const legendX = padding + plotWidth - 150;
    const legendY = padding + 20;

    ctx.fillStyle = "rgba(66, 153, 225, 0.8)";
    ctx.fillRect(legendX, legendY, 12, 12);
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Class 0", legendX + 20, legendY + 10);

    ctx.fillStyle = "rgba(245, 101, 101, 0.8)";
    ctx.fillRect(legendX, legendY + 20, 12, 12);
    ctx.fillStyle = "#000";
    ctx.fillText("Class 1", legendX + 20, legendY + 30);

    if (currentPrediction) {
      ctx.fillStyle = "rgba(0, 200, 0, 0.9)";
      ctx.fillRect(legendX, legendY + 40, 12, 12);
      ctx.fillStyle = "#000";
      ctx.fillText("Current", legendX + 20, legendY + 50);
    }
  }, [dataset, decisionBoundary, currentPrediction, predictions]);

  return (
    <div style={{ padding: "10px" }}>
      <h3 style={{ marginTop: 0, marginBottom: "10px" }}>
        📊 Decision Boundary & Data Points
      </h3>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          display: "block",
          margin: "0 auto",
          backgroundColor: "#fafafa"
        }}
      />
    </div>
  );
}
