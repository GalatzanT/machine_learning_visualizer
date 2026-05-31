import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { TopNav } from "./components/TopNav";
import { HomePage } from "./pages/HomePage";
import { TrainingPage } from "./pages/TrainingPage";
import { LogisticRegressionPage } from "./pages/LogisticRegressionPage";
import { KNNPage } from "./pages/KNNPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SavedSessionsPage } from "./pages/SavedSessionsPage";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  if (currentPage === "login") {
    return (
      <AuthProvider>
        <LoginPage setCurrentPage={setCurrentPage} />
      </AuthProvider>
    );
  }

  if (currentPage === "register") {
    return (
      <AuthProvider>
        <RegisterPage setCurrentPage={setCurrentPage} />
      </AuthProvider>
    );
  }

  if (currentPage === "saved-sessions") {
    return (
      <AuthProvider>
        <TopNav setCurrentPage={setCurrentPage} currentPage={currentPage} />
        <main style={{ paddingTop: "80px" }}>
          <SavedSessionsPage setCurrentPage={setCurrentPage} />
        </main>
      </AuthProvider>
    );
  }

  if (currentPage === "home") {
    return (
      <AuthProvider>
        <TopNav setCurrentPage={setCurrentPage} currentPage={currentPage} />
        <main style={{ paddingTop: "80px" }}>
          <HomePage setCurrentPage={setCurrentPage} />
        </main>
      </AuthProvider>
    );
  }

  if (currentPage === "training-linear") {
    return (
      <AuthProvider>
        <TopNav setCurrentPage={setCurrentPage} currentPage={currentPage} />
        <main style={{ paddingTop: "80px" }}>
          <TrainingPage setCurrentPage={setCurrentPage} />
        </main>
      </AuthProvider>
    );
  }

  if (currentPage === "training-logistic") {
    return (
      <AuthProvider>
        <TopNav setCurrentPage={setCurrentPage} currentPage={currentPage} />
        <main style={{ paddingTop: "80px" }}>
          <LogisticRegressionPage setCurrentPage={setCurrentPage} />
        </main>
      </AuthProvider>
    );
  }

  if (currentPage === "training-knn") {
    return (
      <AuthProvider>
        <TopNav setCurrentPage={setCurrentPage} currentPage={currentPage} />
        <main style={{ paddingTop: "80px" }}>
          <KNNPage setCurrentPage={setCurrentPage} />
        </main>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <TopNav setCurrentPage={setCurrentPage} currentPage={currentPage} />
      <main style={{ paddingTop: "80px" }}>
        <HomePage setCurrentPage={setCurrentPage} />
      </main>
    </AuthProvider>
  );
}

export default App;
