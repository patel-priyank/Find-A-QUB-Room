import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  darken,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';

import dayjs from 'dayjs';

import { useAuthContext } from '../hooks/useAuthContext';

import { LOCATION_TYPES } from '../utils/constants';
import { dateAvatar } from '../utils/functions';

const RemoveEvent = ({ open, onClose, showSnackbar, event, fetchEvents }) => {
  const locationType = event ? LOCATION_TYPES.find(type => type.key === event.location.type) : null;

  // context
  const { user } = useAuthContext();

  // dialog states
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // reset when opened
  useEffect(() => {
    if (open) {
      setLoading(false);
      setAlert(null);
    }
  }, [open]);

  const handleRemove = async () => {
    setLoading(true);
    setAlert(null);

    const response = await fetch(`/api/events/${event._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      showSnackbar('success', event.isSuggested ? 'Suggestion removed successfully!' : 'Event removed successfully!');
      onClose();
      fetchEvents();
    } else {
      setAlert({ severity: 'error', message: json.error });
      setLoading(false);
    }
  };

  // return if event not present
  if (!event) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          <DeleteIcon />
          <Box>{event.isSuggested ? 'Remove suggestion' : 'Remove event'}</Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
        <DialogContentText sx={{ paddingBottom: '16px' }}>
          {event.isSuggested
            ? 'Review the event details before removing. Removing this suggestion is permanent. It will be deleted immediately and will no longer be visible to admins. The suggesting user will not be notified.'
            : 'Review the event details before removing. Removing this event is permanent. Once removed, it will no longer appear in the Events list, and will not be searchable.'}
        </DialogContentText>

        <Box className="event">
          <Box className="event-details">
            {dateAvatar(new Date(event.startDateTime))}

            <Box sx={{ flexGrow: 1, margin: '6px 0' }}>
              <Typography>{event.title}</Typography>

              <Typography variant="body2" color="text.secondary">
                Starts at {dayjs(event.startDateTime).format('HH:mm (DD MMM YYYY)')}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Ends at {dayjs(event.endDateTime).format('HH:mm (DD MMM YYYY)')}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ marginLeft: '56px' }}>
            {event.description}
          </Typography>

          <Box className="event-location-details">
            <img
              src={locationType.listIcon}
              className="location-icon"
              style={{
                background: locationType.color,
                border: `1px solid ${darken(locationType.color, 0.2)}`,
                scale: 0.65
              }}
            />

            <Box>
              <Typography variant="body2">{event.location.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {event.location.building ? event.location.building : EM_DASH}
              </Typography>
            </Box>
          </Box>
        </Box>
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

        <Button loading={loading} variant="contained" color="error" disableElevation onClick={handleRemove}>
          {event.isSuggested ? 'Remove suggestion' : 'Remove event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveEvent;
