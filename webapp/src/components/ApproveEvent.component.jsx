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

import EventIcon from '@mui/icons-material/Event';

import dayjs from 'dayjs';

import { useAuthContext } from '../hooks/useAuthContext';

import { LOCATION_TYPES } from '../utils/constants';
import { dateAvatar } from '../utils/functions';

const ApproveEvent = ({ open, onClose, showSnackbar, event, fetchEvents }) => {
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

  const handleApprove = async () => {
    setLoading(true);
    setAlert(null);

    const response = await fetch(`/api/events/${event._id}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      showSnackbar('success', 'Event approved successfully!');
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
          <EventIcon />
          <Box>Approve event</Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
        <DialogContentText sx={{ paddingBottom: '16px' }}>
          Review the event details before approving. Once approved, the event will appear in the Events list for all
          users, and will be searchable.
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

        <Button loading={loading} variant="contained" disableElevation onClick={handleApprove}>
          Approve event
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApproveEvent;
