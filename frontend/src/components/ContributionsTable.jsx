import { TEXT } from "../constants/text";

export const ContributionsTable = ({ stepData }) => {
  if (!stepData || !stepData.contributions) return null;

  return (
    <div className="chart-container">
      <h2>{TEXT.CONTRIBUTIONS_TITLE}</h2>
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
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                {TEXT.POINT_INDEX}
              </th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                {TEXT.ERROR_VALUE}
              </th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                {TEXT.CONTRIBUTION_W}
              </th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                {TEXT.CONTRIBUTION_B}
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
  );
};
