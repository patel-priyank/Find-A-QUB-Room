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

import PasswordIcon from '@mui/icons-material/Password';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { jwtDecode } from 'jwt-decode';

import { useAuthContext } from '../hooks/useAuthContext';

const ChangePassword = ({ open, onClose, showSnackbar }) => {
  // context
  const { user, dispatch: authDispatch } = useAuthContext();

  // dialog states
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // field states
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // reset when opened
  useEffect(() => {
    setLoading(false);
    setAlert(null);

    setOldPassword('');
    setShowOldPassword(false);
    setNewPassword('');
    setShowNewPassword(false);
    setConfirmPassword('');
    setShowConfirmPassword(false);
  }, [open]);

  const handleChangePassword = async event => {
    event.preventDefault();

    setLoading(true);
    setAlert(null);

    const response = await fetch('/api/user/account/password', {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
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
      showSnackbar('success', 'Your password has been updated!');
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
          <PasswordIcon />
          <Box>Change password</Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
        <form id="change-password-form" onSubmit={handleChangePassword}>
          <DialogContentText>
            Keep your account secure by updating your password regularly. A strong password helps protect your personal
            information and access.
          </DialogContentText>

          <TextField
            variant="outlined"
            label="Old password"
            type={showOldPassword ? 'text' : 'password'}
            slotProps={{
              htmlInput: { minLength: 8, maxLength: 128 },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      title={showOldPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowOldPassword(current => !current)}
                      onMouseDown={e => e.preventDefault()}
                      onMouseUp={e => e.preventDefault()}
                      edge="end"
                    >
                      {showOldPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
            value={oldPassword}
            onChange={e => {
              setAlert(null);
              setOldPassword(e.target.value);
            }}
            helperText="Your existing password is needed to proceed."
            required
          />

          <TextField
            variant="outlined"
            label="New password"
            type={showNewPassword ? 'text' : 'password'}
            slotProps={{
              htmlInput: { minLength: 8, maxLength: 128 },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowNewPassword(current => !current)}
                      onMouseDown={e => e.preventDefault()}
                      onMouseUp={e => e.preventDefault()}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
            value={newPassword}
            onChange={e => {
              setAlert(null);
              setNewPassword(e.target.value);
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
            helperText="Re-enter your new password to confirm."
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

        <Button loading={loading} variant="contained" disableElevation type="submit" form="change-password-form">
          Change password
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePassword;
