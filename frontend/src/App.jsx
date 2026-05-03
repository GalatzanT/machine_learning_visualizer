import { TopNav } from "./components/TopNav";
import { TrainingPage } from "./pages/TrainingPage";

function App() {
  return (
    <>
      <TopNav />
      <main style={{ paddingTop: "64px" }}>
        <TrainingPage />
      </main>
    </>
  );
}

export default App;
