import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { TopNav } from "./components/TopNav";
import { TrainingPage } from "./pages/TrainingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

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

  return (
    <AuthProvider>
      <TopNav setCurrentPage={setCurrentPage} />
      <main style={{ paddingTop: "64px" }}>
        <TrainingPage />
      </main>
    </AuthProvider>
  );
}

export default App;
