import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';

import { jwtDecode } from 'jwt-decode';

import LoadingPage from './pages/LoadingPage';
import MapPage from './pages/MapPage';
import EventsPage from './pages/EventsPage';
import SearchPage from './pages/SearchPage';
import AccountPage from './pages/AccountPage';

import Navbar from './components/Navbar.component';
import Onboarding from './components/Onboarding.component';

import { useAuthContext } from './hooks/useAuthContext';
import { useLocationsContext } from './hooks/useLocationsContext';

import { sleep } from './utils/functions';

const App = () => {
  const { appLoading, dispatch: authDispatch } = useAuthContext();
  const { dispatch: locationsDispatch } = useLocationsContext();

  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);

  useEffect(() => {
    const incrementAppVisits = async () => {
      const response = await fetch('/api/statistics/increment', {
        method: 'PATCH'
      });

      const json = await response.json();

      if (!response.ok) {
        console.error(json.error);
      }
    };

    const fetchLocations = async () => {
      const response = await fetch('/api/locations');
      const json = await response.json();

      if (response.ok) {
        locationsDispatch({ type: 'SET_LOCATIONS', payload: json });
      }
    };

    setTimeout(async () => {
      await incrementAppVisits();
      await fetchLocations();

      const user = JSON.parse(localStorage.getItem('user'));

      if (user) {
        const decodedToken = jwtDecode(user.token);
        user.isAdmin = decodedToken.isAdmin;
        authDispatch({ type: 'AUTH_READY', payload: user });
      } else {
        authDispatch({ type: 'AUTH_READY', payload: null });
      }

      await sleep(450);

      if (!JSON.parse(localStorage.getItem('onboardingShown'))) {
        setOnboardingDialogOpen(true);
      }
    }, 1125);
  }, []);

  return appLoading ? (
    <LoadingPage />
  ) : (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Navbar />

      <Onboarding
        open={onboardingDialogOpen}
        onClose={() => {
          setOnboardingDialogOpen(false);
          localStorage.setItem('onboardingShown', 'true');
        }}
      />
    </BrowserRouter>
  );
};

export default App;
