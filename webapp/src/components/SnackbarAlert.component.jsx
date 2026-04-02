import { Alert, Snackbar } from '@mui/material';

const SnackbarAlert = props => {
  const { snackbar, handleSnackbarClose } = props;

  return (
    <Snackbar open={snackbar.open} onClose={handleSnackbarClose} autoHideDuration={5000}>
      <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled">
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default SnackbarAlert;
