import { useState } from 'react';

export const useSnackbarAlert = () => {
  const [snackbar, setSnackbar] = useState({ open: false, severity: '', message: '' });

  const showSnackbar = (severity, message) => {
    if (snackbar.open) {
      setSnackbar(currentSnackbar => ({ ...currentSnackbar, open: false }));

      setTimeout(() => {
        setSnackbar({ open: true, severity, message });
      }, 225);
    } else {
      setSnackbar({ open: true, severity, message });
    }
  };

  const hideSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  return { snackbar, showSnackbar, hideSnackbar };
};
