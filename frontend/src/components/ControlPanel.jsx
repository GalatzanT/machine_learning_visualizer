import { TEXT } from "../constants/text";

export const ControlPanel = ({
  dataset,
  learningRate,
  lrWarning,
  onLearningRateChange,
  onGradientStep,
  onFreezeExplain,
  onReset,
  onResetAll,
}) => {
  return (
    <div className="controls">
      <div className="control-group">
        <label>{TEXT.LEARNING_RATE}</label>
        <input
          type="number"
          step="0.001"
          value={learningRate}
          onChange={(e) => onLearningRateChange(parseFloat(e.target.value))}
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
          onClick={onGradientStep}
          disabled={!dataset}
          style={{ fontSize: "18px", padding: "15px 30px" }}
        >
          {TEXT.NEXT_STEP}
        </button>
        <button
          className="btn-secondary"
          onClick={onFreezeExplain}
          disabled={!dataset}
        >
          {TEXT.FREEZE_EXPLAIN}
        </button>
        <button className="btn-secondary" onClick={onReset} disabled={!dataset}>
          {TEXT.RESET_MODEL}
        </button>
        <button className="btn-danger" onClick={onResetAll}>
          {TEXT.RESET_ALL}
        </button>
      </div>
    </div>
  );
};
