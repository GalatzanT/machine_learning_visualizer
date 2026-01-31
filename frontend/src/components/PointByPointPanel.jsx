import { TEXT } from "../constants/text";

export const PointByPointPanel = ({
  dataset,
  isAutoPlaying,
  pointByPointMode,
  onPointStep,
  onAutoPlay,
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
    </div>
  );
};
