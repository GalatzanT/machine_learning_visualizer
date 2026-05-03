import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { TopNav } from "./components/TopNav";
import { TrainingPage } from "./pages/TrainingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SavedSessionsPage } from "./pages/SavedSessionsPage";

function App() {
  const [currentPage, setCurrentPage] = useState("training");

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

  return (
    <AuthProvider>
      <TopNav setCurrentPage={setCurrentPage} currentPage={currentPage} />
      <main style={{ paddingTop: "80px" }}>
        <TrainingPage />
      </main>
    </AuthProvider>
  );
}

export default App;
