import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material';

import AbcIcon from '@mui/icons-material/Abc';

import { jwtDecode } from 'jwt-decode';

import { useAuthContext } from '../hooks/useAuthContext';

const ChangeName = ({ open, onClose, showSnackbar }) => {
  // context
  const { user, dispatch: authDispatch } = useAuthContext();

  // dialog states
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // field states
  const [name, setName] = useState('');

  // reset when opened
  useEffect(() => {
    if (open) {
      setLoading(false);
      setAlert(null);

      setName('');
    }
  }, [open]);

  const handleChangeName = async event => {
    event.preventDefault();

    setLoading(true);
    setAlert(null);

    const response = await fetch('/api/user/account/name', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      const decodedToken = jwtDecode(json.token);
      localStorage.setItem('user', JSON.stringify(json));
      authDispatch({
        type: 'SIGNIN',
        payload: { ...json, isAdmin: decodedToken.isAdmin }
      });
      showSnackbar('success', 'Your name has been updated!');
      onClose();
    } else {
      setLoading(false);
      setAlert({ severity: 'error', message: json.error });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          <AbcIcon />
          <Box>Change name</Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
        <form id="change-name-form" onSubmit={handleChangeName}>
          <DialogContentText>
            Update your name as you'd like it to appear in your account and across the app.
          </DialogContentText>

          <TextField
            variant="outlined"
            label="New name"
            type="text"
            slotProps={{ htmlInput: { maxLength: 128 } }}
            value={name}
            onChange={e => {
              setAlert(null);
              setName(e.target.value);
            }}
            required
          />
        </form>
      </DialogContent>

      {alert && (
        <DialogContent className="alert-container">
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </DialogContent>
      )}

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>

        <Button loading={loading} variant="contained" disableElevation type="submit" form="change-name-form">
          Change name
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeName;
