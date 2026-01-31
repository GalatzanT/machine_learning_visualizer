import { TEXT } from "../constants/text";

export const FreezeExplainPanel = ({ freezeData, onContinue }) => {
  if (!freezeData) return null;

  return (
    <div
      style={{
        background: "#f0f0f0",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "3px solid #666",
      }}
    >
      <h2>{TEXT.FREEZE_MODE_TITLE}</h2>

      <h3>{TEXT.MSE_FORMULA}:</h3>
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
          Σ(yᵢ - ŷᵢ)² = {freezeData.mse_breakdown.sum_squared_errors.toFixed(4)}
          <br />
          <strong>MSE = {freezeData.mse_breakdown.mse_value.toFixed(4)}</strong>
        </div>
      </div>

      <h3 style={{ marginTop: "15px" }}>{TEXT.GRADIENT_FORMULA}:</h3>
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
          <strong>∇b: {freezeData.gradient_breakdown.db_formula}</strong>
          <br />
          Σ(yᵢ - ŷᵢ) = {freezeData.gradient_breakdown.sum_errors.toFixed(4)}
          <br />
          <strong>
            ∇b = {freezeData.gradient_breakdown.db_value.toFixed(4)}
          </strong>
        </div>
      </div>

      <button
        onClick={onContinue}
        style={{ marginTop: "15px", padding: "10px 20px" }}
        className="btn-primary"
      >
        ▶️ Continue
      </button>
    </div>
  );
};
