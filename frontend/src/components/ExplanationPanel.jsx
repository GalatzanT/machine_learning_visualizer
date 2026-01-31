import { TEXT } from "../constants/text";

export const ExplanationPanel = ({ explanations }) => {
  if (!explanations || explanations.length === 0) return null;

  return (
    <div
      style={{
        background: "#e3f2fd",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "2px solid #2196f3",
      }}
    >
      <h3>{TEXT.EXPLANATION_TITLE}</h3>
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
  );
};
