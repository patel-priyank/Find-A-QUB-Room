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
  IconButton,
  InputAdornment,
  TextField
} from '@mui/material';

import LoginIcon from '@mui/icons-material/Login';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { jwtDecode } from 'jwt-decode';

import { useAuthContext } from '../hooks/useAuthContext';

const SignIn = ({ open, onClose, showSnackbar }) => {
  // context
  const { dispatch: authDispatch } = useAuthContext();

  // dialog states
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // field states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // reset when opened
  useEffect(() => {
    if (open) {
      setLoading(false);
      setAlert(null);

      setEmail('');
      setPassword('');
      setShowPassword(false);
    }
  }, [open]);

  const handleSignIn = async event => {
    event.preventDefault();

    setLoading(true);
    setAlert(null);

    const response = await fetch('/api/user/signin', {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase(), password }),
      headers: {
        'Content-Type': 'application/json'
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
      showSnackbar('success', "You're now signed in!");
      onClose();
    } else {
      setAlert({ severity: 'error', message: json.error });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          <LoginIcon />
          <Box>Sign in</Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
        <form id="sign-in-form" onSubmit={handleSignIn}>
          <DialogContentText>
            Sign in using your registered credentials to access personalised features and settings.
          </DialogContentText>

          <TextField
            variant="outlined"
            label="Email"
            type="email"
            slotProps={{ htmlInput: { maxLength: 128 } }}
            value={email}
            onChange={e => {
              setAlert(null);
              setEmail(e.target.value);
            }}
            helperText="Max 128 characters."
            required
          />

          <TextField
            variant="outlined"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            slotProps={{
              htmlInput: { minLength: 8, maxLength: 128 },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      title={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(current => !current)}
                      onMouseDown={e => e.preventDefault()}
                      onMouseUp={e => e.preventDefault()}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
            value={password}
            onChange={e => {
              setAlert(null);
              setPassword(e.target.value);
            }}
            helperText="8-128 characters. Case sensitive."
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

        <Button loading={loading} variant="contained" disableElevation type="submit" form="sign-in-form">
          Sign in
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignIn;
