import { useEffect, useState } from 'react';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

import LogoutIcon from '@mui/icons-material/Logout';

import { useAuthContext } from '../hooks/useAuthContext';

const SignOut = ({ open, onClose, showSnackbar }) => {
  // context
  const { dispatch: authDispatch } = useAuthContext();

  // dialog states
  const [loading, setLoading] = useState(false);

  // reset when opened
  useEffect(() => {
    if (open) {
      setLoading(false);
    }
  }, [open]);

  const handleSignOut = () => {
    setLoading(true);

    setTimeout(() => {
      localStorage.removeItem('user');
      authDispatch({ type: 'SIGNOUT' });
      showSnackbar('success', "You've successfully signed out!");
      onClose();
    }, 900);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          <LogoutIcon />
          <Box>Sign out</Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          Are you sure you want to sign out? You'll need to sign in again to access your account.
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>

        <Button loading={loading} variant="contained" disableElevation onClick={handleSignOut}>
          Sign out
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignOut;
