import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/loginPage';
import RegisterAnalystPage from './pages/RegisterAnalystPage';
import RegisterClientPage from './pages/RegisterClientPage';
import ProfileFillPage from './pages/ProfileFillPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import AnalystsPage from './pages/AnalystsPage';
import { authEvents } from './utils/authEvents';
import SessionExpiredModal from './components/SessionExpiredModal'; // создадим ниже
import ClientProfileFillPage from './pages/ClientProfileFillPage';
import ClientProfilePage from './pages/ClientProfilePage';
import EditClientProfilePage from './pages/EditClientProfilePage';
import ClientsPage from './pages/ClientsPage';
import ProjectCreatePage from './pages/ProjectCreatePage';
import ProjectPage from './pages/ProjectPage';
import ProjectEditPage from './pages/ProjectEditPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectApplicationsPage from './pages/ProjectApplicationsPage';

function App() {
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    // Подписываемся на событие истечения сеанса
    const unsubscribe = authEvents.onUnauthorized(() => {
      setShowSessionModal(true);
    });
    return unsubscribe;
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/analyst" element={<RegisterAnalystPage />} />
        <Route path="/register/client" element={<RegisterClientPage />} />
        <Route path="/profile/fill" element={<ProfileFillPage />} />
        <Route path="/profile/my" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/profile" element={<Navigate to="/profile/my" replace />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/analysts" element={<AnalystsPage />} />
        <Route path="/client/profile/fill" element={<ClientProfileFillPage />} />
        <Route path="/client/profile/my" element={<ClientProfilePage />} />
        <Route path="/client/profile/edit" element={<EditClientProfilePage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/client/profile/fill" element={<ClientProfileFillPage />} />
        <Route path="/client/profile/edit" element={<EditClientProfilePage />} />
        <Route path="/client/profile/my" element={<ClientProfilePage />} />
        <Route path="/client/profile/:id" element={<ClientProfilePage />} />
        <Route path="/projects/create" element={<ProjectCreatePage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id/applications" element={<ProjectApplicationsPage />} />
      </Routes>
      <SessionExpiredModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
      />
    </BrowserRouter>
  );
}

export default App;