import { TEXT } from "../constants/text";

export const DatasetPanel = ({ fileInputRef, onFileUpload, onGenerate }) => {
  return (
    <div className="controls">
      <div className="control-group">
        <label>{TEXT.DATASET_TITLE}</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={onFileUpload}
        />
      </div>

      <div className="control-group">
        <label>Or generate synthetic data:</label>
        <div className="button-group">
          <button
            className="btn-secondary"
            onClick={() => onGenerate("simple")}
          >
            {TEXT.GENERATE_SIMPLE}
          </button>
          <button
            className="btn-secondary"
            onClick={() => onGenerate("noisy")}
          >
            {TEXT.GENERATE_NOISY}
          </button>
          <button
            className="btn-secondary"
            onClick={() => onGenerate("outliers")}
          >
            {TEXT.GENERATE_OUTLIERS}
          </button>
        </div>
      </div>
    </div>
  );
};
