import { Navigate, Route, Routes, useNavigate } from "react-router";
import App from "./App.tsx";
import { ContributionAnalysis } from "./components/ContributionAnalysis.tsx";
import { Home } from "./components/Home.tsx";
import { InitialProfile } from "./components/InitialProfile.tsx";
import { MyPage } from "./components/MyPage.tsx";

function ProfileRoute() {
  const navigate = useNavigate();

  return <InitialProfile onComplete={() => navigate("/analysis")} />;
}

function AnalysisRoute() {
  const navigate = useNavigate();

  return <ContributionAnalysis onComplete={() => navigate("/home")} />;
}

function HomeRoute() {
  const navigate = useNavigate();

  return <Home onNavigate={navigate} />;
}

function MyPageRoute() {
  const navigate = useNavigate();

  return <MyPage onNavigate={navigate} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/profile" element={<ProfileRoute />} />
      <Route path="/analysis" element={<AnalysisRoute />} />
      <Route path="/home" element={<HomeRoute />} />
      <Route path="/mypage" element={<MyPageRoute />} />
      <Route path="/guild" element={<Navigate to="/mypage" replace />} />
      <Route path="/war" element={<Navigate to="/mypage" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
