import { createRoot } from 'react-dom/client';
import { cloneElement, forwardRef, StrictMode } from 'react';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { AuthContextProvider } from './contexts/AuthContext.jsx';
import { LocationsContextProvider } from './contexts/LocationsContext.jsx';
import { MapContextProvider } from './contexts/MapContext.jsx';

import App from './App.jsx';

import 'animate.css';
import './index.css';

const NoTransition = forwardRef(function NoTransition(props, ref) {
  const {
    children,
    in: _in,
    appear: _appear,
    timeout: _timeout,
    easing: _easing,
    mountOnEnter: _mountOnEnter,
    unmountOnExit: _unmountOnExit,
    onEnter: _onEnter,
    onEntered: _onEntered,
    onEntering: _onEntering,
    onExit: _onExit,
    onExited: _onExited,
    onExiting: _onExiting,
    ...rest
  } = props;

  return cloneElement(children, { ref, ...rest });
});

const theme = createTheme({
  components: {
    MuiDialog: {
      defaultProps: {
        slots: {
          transition: NoTransition
        },
        slotProps: {
          paper: {
            tabIndex: -1
          }
        }
      }
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <AuthContextProvider>
        <LocationsContextProvider>
          <MapContextProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <App />
            </LocalizationProvider>
          </MapContextProvider>
        </LocationsContextProvider>
      </AuthContextProvider>
    </ThemeProvider>
  </StrictMode>
);
