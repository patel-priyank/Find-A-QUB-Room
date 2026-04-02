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

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { jwtDecode } from 'jwt-decode';

import { useAuthContext } from '../hooks/useAuthContext';

const SignUp = ({ open, onClose }) => {
  // context
  const { dispatch: authDispatch } = useAuthContext();

  // dialog states
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // field states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // reset when opened
  useEffect(() => {
    if (open) {
      setLoading(false);
      setAlert(null);

      setName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setConfirmPassword('');
      setShowConfirmPassword(false);
    }
  }, [open]);

  const handleSignUp = async event => {
    event.preventDefault();

    setLoading(true);
    setAlert(null);

    const response = await fetch('/api/user/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email: email.toLowerCase(), password, confirmPassword }),
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
          <PersonAddIcon />
          <Box>Register</Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
        <form id="sign-up-form" onSubmit={handleSignUp}>
          <DialogContentText>
            Fill out your name, email, and create a secure password to register your account.
          </DialogContentText>

          <TextField
            variant="outlined"
            label="Name"
            type="text"
            slotProps={{ htmlInput: { maxLength: 128 } }}
            value={name}
            onChange={e => {
              setAlert(null);
              setName(e.target.value);
            }}
            required
          />

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
            helperText="8-128 characters. Must include uppercase and lowercase letters, numbers, and symbols."
            required
          />

          <TextField
            variant="outlined"
            label="Confirm password"
            type={showConfirmPassword ? 'text' : 'password'}
            slotProps={{
              htmlInput: { minLength: 8, maxLength: 128 },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword(current => !current)}
                      onMouseDown={e => e.preventDefault()}
                      onMouseUp={e => e.preventDefault()}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
            value={confirmPassword}
            onChange={e => {
              setAlert(null);
              setConfirmPassword(e.target.value);
            }}
            helperText="Re-enter your password to confirm."
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

        <Button loading={loading} variant="contained" disableElevation type="submit" form="sign-up-form">
          Register
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignUp;
