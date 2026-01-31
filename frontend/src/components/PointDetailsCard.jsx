import { TEXT } from "../constants/text";

export const PointDetailsCard = ({ currentPointData }) => {
  if (!currentPointData) return null;

  return (
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
        🔍 {TEXT.POINT_DETAILS_TITLE} {currentPointData.point_index + 1}/
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
          style={{ background: "white", padding: "15px", borderRadius: "8px" }}
        >
          <h3>{TEXT.POINT_DATA}</h3>
          <div style={{ fontFamily: "monospace", fontSize: "16px" }}>
            <strong>x = {currentPointData.x_value.toFixed(4)}</strong>
            <br />
            <strong>
              y<sub>actual</sub> = {currentPointData.y_actual.toFixed(4)}
            </strong>
            <br />
            <strong style={{ color: "#007bff" }}>
              ŷ = {currentPointData.y_predicted.toFixed(4)}
            </strong>
            <br />
            <strong
              style={{
                color: currentPointData.error > 0 ? "#dc3545" : "#28a745",
              }}
            >
              {TEXT.ERROR} = {currentPointData.error.toFixed(4)}
            </strong>
          </div>
        </div>

        <div
          style={{ background: "white", padding: "15px", borderRadius: "8px" }}
        >
          <h3>{TEXT.GRADIENT_CONTRIBUTION}</h3>
          <div style={{ fontFamily: "monospace", fontSize: "16px" }}>
            <strong>
              ∂w = {currentPointData.contribution_w.toFixed(6)}
            </strong>
            <br />
            <strong>
              ∂b = {currentPointData.contribution_b.toFixed(6)}
            </strong>
            <br />
            <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
              {TEXT.ACCUMULATED}:
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
        <h3>{TEXT.EXPLANATION}</h3>
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
          <h3>{TEXT.FINAL_UPDATE}</h3>
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
  );
};
