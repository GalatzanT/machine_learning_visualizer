import { TEXT } from "../constants/text";

export const PointByPointPanel = ({
  dataset,
  isAutoPlaying,
  pointByPointMode,
  playbackSpeed,
  onPointStep,
  onAutoPlay,
  onSpeedChange,
  onResetMode,
}) => {
  return (
    <div
      className="control-group"
      style={{
        borderTop: "2px solid #007bff",
        paddingTop: "15px",
        marginTop: "15px",
      }}
    >
      <label>{TEXT.POINT_MODE_TITLE}</label>
      <div className="button-group">
        <button
          className="btn-primary"
          onClick={onPointStep}
          disabled={!dataset || isAutoPlaying}
          style={{ fontSize: "16px" }}
        >
          {TEXT.NEXT_POINT}
        </button>
        <button
          className="btn-secondary"
          onClick={onAutoPlay}
          disabled={!dataset}
          style={{
            background: isAutoPlaying ? "#dc3545" : "#28a745",
            color: "white",
          }}
        >
          {isAutoPlaying ? TEXT.PAUSE : TEXT.AUTO_PLAY}
        </button>
        <button
          className="btn-secondary"
          onClick={onResetMode}
          disabled={!pointByPointMode}
        >
          {TEXT.RESET_MODE}
        </button>
      </div>
      <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
        <span style={{ fontSize: "14px", color: "#666" }}>Speed:</span>
        {[1, 5, 100].map(speed => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            disabled={!dataset}
            style={{
              padding: "5px 15px",
              fontSize: "14px",
              border: playbackSpeed === speed ? "2px solid #007bff" : "1px solid #ccc",
              background: playbackSpeed === speed ? "#e3f2fd" : "white",
              color: playbackSpeed === speed ? "#007bff" : "#333",
              borderRadius: "4px",
              cursor: dataset ? "pointer" : "not-allowed",
              fontWeight: playbackSpeed === speed ? "bold" : "normal"
            }}
          >
            x{speed}
          </button>
        ))}
      </div>
    </div>
  );
};
