import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useTraining } from "./hooks/useTraining";
import { DatasetPanel } from "./components/DatasetPanel";
import { ControlPanel } from "./components/ControlPanel";
import { PointByPointPanel } from "./components/PointByPointPanel";
import { ScatterChart } from "./components/ScatterChart";
import { LossChart } from "./components/LossChart";
import { ExplanationPanel } from "./components/ExplanationPanel";
import { PointDetailsCard } from "./components/PointDetailsCard";
import { FreezeExplainPanel } from "./components/FreezeExplainPanel";
import { ContributionsTable } from "./components/ContributionsTable";
import { TEXT } from "./constants/text";
import "./index.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

function App() {
  const {
    dataset,
    learningRate,
    model,
    stepData,
    currentEpoch,
    explanations,
    lrWarning,
    freezeMode,
    freezeData,
    pointByPointMode,
    currentPointData,
    isAutoPlaying,
    fileInputRef,
    handleFileUpload,
    handleGenerateDataset,
    handleGradientStep,
    handleLearningRateChange,
    handleFreezeExplain,
    handleReset,
    handleResetAll,
    handlePointStep,
    handleAutoPlay,
    handleResetPointMode,
  } = useTraining();

  return (
    <div className="app">
      <h1>{TEXT.APP_TITLE}</h1>
      <p style={{ textAlign: "center", color: "#666", marginTop: "-10px" }}>
        {TEXT.APP_SUBTITLE}
      </p>

      <DatasetPanel
        fileInputRef={fileInputRef}
        onFileUpload={handleFileUpload}
        onGenerate={handleGenerateDataset}
      />

      <ControlPanel
        dataset={dataset}
        learningRate={learningRate}
        lrWarning={lrWarning}
        onLearningRateChange={handleLearningRateChange}
        onGradientStep={handleGradientStep}
        onFreezeExplain={handleFreezeExplain}
        onReset={handleReset}
        onResetAll={handleResetAll}
      />

      <PointByPointPanel
        dataset={dataset}
        isAutoPlaying={isAutoPlaying}
        pointByPointMode={pointByPointMode}
        onPointStep={handlePointStep}
        onAutoPlay={handleAutoPlay}
        onResetMode={handleResetPointMode}
      />

      {dataset && (
        <>
          <div className="info">
            {TEXT.EPOCH}: {currentEpoch} | {TEXT.MODEL}: y ={" "}
            {model.w.toFixed(4)}·x + {model.b.toFixed(4)}
            {stepData &&
              stepData.loss_after &&
              stepData.gradient_magnitude &&
              ` | ${TEXT.LOSS}: ${stepData.loss_after.toFixed(4)} | ${TEXT.GRADIENT}: ${stepData.gradient_magnitude.toFixed(4)}`}
          </div>

          {!freezeMode && (
            <ExplanationPanel explanations={explanations} />
          )}

          {pointByPointMode && (
            <PointDetailsCard currentPointData={currentPointData} />
          )}

          {freezeMode && (
            <FreezeExplainPanel
              freezeData={freezeData}
              onContinue={() => {
                handleReset();
              }}
            />
          )}

          <div className="charts">
            <ScatterChart
              dataset={dataset}
              model={model}
              stepData={stepData}
              currentPointData={currentPointData}
            />

            <LossChart stepData={stepData} />

            <ContributionsTable stepData={stepData} />
          </div>
        </>
      )}

      {!dataset && (
        <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>
          <h2>{TEXT.LOAD_DATASET_PROMPT}</h2>
        </div>
      )}
    </div>
  );
}

export default App;
