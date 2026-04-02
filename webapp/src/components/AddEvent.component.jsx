import { useEffect, useRef, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  darken,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemIcon,
  ListItemText,
  MobileStepper,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material';
import { MobileDateTimePicker } from '@mui/x-date-pickers';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SearchIcon from '@mui/icons-material/Search';

import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';

import Switch from './Switch.component';

import { useAuthContext } from '../hooks/useAuthContext';
import { useLocationsContext } from '../hooks/useLocationsContext';

import { EM_DASH, LOCATION_TYPES } from '../utils/constants';
import { highlightMatch } from '../utils/functions';

const AddEvent = ({ open, onClose, showSnackbar, fetchEvents }) => {
  // dayjs config
  dayjs.extend(updateLocale);
  dayjs.updateLocale('en', {
    weekStart: 1
  });

  // context
  const { user } = useAuthContext();
  const { locations } = useLocationsContext();

  // constants
  const DEFAULT_START_DATE_TIME = dayjs().add(1, 'day').hour(12).minute(0);
  const DEFAULT_END_DATE_TIME = dayjs().add(1, 'day').hour(15).minute(0);
  const TOMORROW = dayjs().add(1, 'day').startOf('day');

  // dialog states
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [filtersVisibility, setFiltersVisibility] = useState(false);
  const [visibleTypes, setVisibleTypes] = useState(
    Object.fromEntries(LOCATION_TYPES.filter(type => type.allowEvents).map(type => [type.key, true]))
  );
  const [activeStep, setActiveStep] = useState(0);

  // field states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [startDateTime, setStartDateTime] = useState(DEFAULT_START_DATE_TIME);
  const [endDateTime, setEndDateTime] = useState(DEFAULT_END_DATE_TIME);
  const [searchQuery, setSearchQuery] = useState('');

  // references
  const eventFormRef = useRef(null);

  const matchesSearch = location => {
    const query = searchQuery.toLowerCase().trim();
    return location.title.toLowerCase().includes(query) || location.building.toLowerCase().includes(query);
  };

  const STEPS = [
    {
      content: (
        <form ref={eventFormRef}>
          <DialogContentText>Fill in the basic information about the event.</DialogContentText>

          <TextField
            variant="outlined"
            label="Name"
            type="text"
            slotProps={{ htmlInput: { maxLength: 64 } }}
            value={title}
            onChange={e => {
              setAlert(null);
              setTitle(e.target.value);
            }}
            required
          />

          <TextField
            variant="outlined"
            label="Description"
            placeholder="Share what makes this event special, including activities and must-know tips."
            type="text"
            slotProps={{ htmlInput: { maxLength: 512 } }}
            multiline
            rows={4}
            value={description}
            onChange={e => {
              setAlert(null);
              setDescription(e.target.value);
            }}
            required
          />

          <MobileDateTimePicker
            closeOnSelect
            ampm={false}
            label="Start time"
            value={startDateTime}
            onChange={value => {
              setAlert(null);
              setStartDateTime(value);
            }}
            format="DD MMM YYYY HH:mm"
            slotProps={{ textField: { required: true } }}
          />

          <MobileDateTimePicker
            closeOnSelect
            ampm={false}
            label="End time"
            value={endDateTime}
            onChange={value => {
              setAlert(null);
              setEndDateTime(value);
            }}
            format="DD MMM YYYY HH:mm"
            slotProps={{ textField: { required: true } }}
          />
        </form>
      )
    },
    {
      content: (
        <FormGroup sx={{ gap: '16px' }}>
          <DialogContentText>Select where the event will take place.</DialogContentText>

          <TextField
            variant="outlined"
            fullWidth
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      title="Clear"
                      onClick={() => setSearchQuery('')}
                      onMouseDown={e => e.preventDefault()}
                      onMouseUp={e => e.preventDefault()}
                      edge="end"
                    >
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
            helperText="Search with location name or building"
          />

          <Box className="filters-container">
            <FormControlLabel
              control={
                <Switch checked={filtersVisibility} onChange={() => setFiltersVisibility(current => !current)} />
              }
              label="Show filters"
              labelPlacement="start"
            />

            {filtersVisibility && (
              <Box className="chip-container">
                {LOCATION_TYPES.filter(type => type.allowEvents).map(locationType => (
                  <Chip
                    key={locationType.key}
                    variant="outlined"
                    label={`${locationType.label} (${
                      locations.filter(loc => matchesSearch(loc) && loc.type === locationType.key).length
                    })`}
                    deleteIcon={visibleTypes[locationType.key] ? <RemoveCircleIcon /> : <AddCircleIcon />}
                    sx={{
                      border: `1px solid ${darken(locationType.color, 0.2)}`,
                      background: visibleTypes[locationType.key] ? `${locationType.color}` : ''
                    }}
                    onDelete={() => {
                      setVisibleTypes(types => ({
                        ...types,
                        [locationType.key]: !types[locationType.key]
                      }));
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box>
            {locations.filter(loc => matchesSearch(loc)).length > 0 && (
              <>
                {locations.filter(loc => matchesSearch(loc) && visibleTypes[loc.type]).length > 0 ? (
                  <RadioGroup
                    value={location}
                    onChange={e => {
                      setAlert(null);
                      setLocation(e.target.value);
                    }}
                  >
                    {locations
                      .filter(loc => matchesSearch(loc) && visibleTypes[loc.type])
                      .map(loc => {
                        const type = LOCATION_TYPES.find(type => type.key === loc.type);

                        return (
                          <FormControlLabel
                            key={loc._id}
                            value={loc._id}
                            control={<Radio sx={{ marginRight: '6px' }} />}
                            label={
                              <ListItem disableGutters>
                                <ListItemIcon>
                                  <img
                                    src={type.listIcon}
                                    className="location-icon"
                                    style={{
                                      background: type.color,
                                      border: `1px solid ${darken(type.color, 0.2)}`
                                    }}
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={highlightMatch(loc.title, searchQuery)}
                                  secondary={loc.building ? highlightMatch(loc.building, searchQuery) : EM_DASH}
                                />
                              </ListItem>
                            }
                          />
                        );
                      })}
                  </RadioGroup>
                ) : (
                  <Typography color="text.primary">
                    Some locations are not shown due to current filters. Modify the filters to see them.
                  </Typography>
                )}
              </>
            )}

            {locations.filter(loc => matchesSearch(loc)).length === 0 && (
              <Typography color="text.primary">No locations match your search.</Typography>
            )}
          </Box>
        </FormGroup>
      )
    }
  ];

  // reset when opened
  useEffect(() => {
    if (open) {
      setLoading(false);
      setAlert(null);
      setFiltersVisibility(false);
      setVisibleTypes(
        Object.fromEntries(LOCATION_TYPES.filter(type => type.allowEvents).map(type => [type.key, true]))
      );
      setActiveStep(0);

      setTitle('');
      setDescription('');
      setLocation(null);
      setStartDateTime(DEFAULT_START_DATE_TIME);
      setEndDateTime(DEFAULT_END_DATE_TIME);
      setSearchQuery('');
    }
  }, [open]);

  const addEvent = async () => {
    setAlert(null);

    const requiredFields = Array.from(eventFormRef.current.querySelectorAll('[required]'));

    if (requiredFields.some(field => field.value === '')) {
      const fieldLabels = requiredFields
        .filter(field => field.value === '')
        .map(field => field.closest('.MuiFormControl-root').querySelector('label').innerText.replaceAll('*', '').trim())
        .join(', ');

      setAlert({ severity: 'warning', message: `Please fill in all the required fields: ${fieldLabels}.` });
      return;
    }

    if (!location) {
      setAlert({ severity: 'warning', message: `Please select a location.` });
      return;
    }

    if (!dayjs.isDayjs(startDateTime) || !dayjs(startDateTime, 'DD MMM YYYY HH:mm', true).isValid()) {
      setAlert({ severity: 'error', message: 'Start time is invalid.' });
      return;
    }

    if (!dayjs.isDayjs(endDateTime) || !dayjs(endDateTime, 'DD MMM YYYY HH:mm', true).isValid()) {
      setAlert({ severity: 'error', message: 'End time is invalid' });
      return;
    }

    if (!startDateTime.isBefore(endDateTime)) {
      setAlert({ severity: 'error', message: 'End time must be later than the start time.' });
      return;
    }

    if (startDateTime.isBefore(TOMORROW)) {
      setAlert({ severity: 'error', message: 'Events can only be scheduled starting tomorrow.' });
      return;
    }

    setLoading(true);

    // body for api
    const event = {
      title,
      description,
      location,
      startDateTime: startDateTime.toDate(),
      endDateTime: endDateTime.toDate(),
      isSuggested: !(user && user.isAdmin)
    };

    const response = await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      showSnackbar('success', user && user.isAdmin ? 'Event added successfully!' : 'Event suggested successfully!');
      onClose();

      if (user && user.isAdmin) {
        fetchEvents();
      }
    } else {
      setLoading(false);
      setAlert({ severity: 'error', message: json.error });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          <EventIcon />
          <Box>{user && user.isAdmin ? 'Add event' : 'Suggest event'}</Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: 0 }}>
        <Box>
          <DialogContentText sx={{ paddingBottom: '16px' }}>
            {user && user.isAdmin
              ? 'Add a new event. It will appear in the Events list for all users, and will be searchable.'
              : "Suggest an event you'd like to be added. Admins will review it and may edit the details before approving it for everyone to see."}
          </DialogContentText>

          {STEPS.map((step, index) => (
            <Box key={index} sx={{ display: index === activeStep ? '' : 'none' }}>
              {step.content}
            </Box>
          ))}
        </Box>
      </DialogContent>

      {alert && (
        <DialogContent className="alert-container">
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </DialogContent>
      )}

      <DialogContent sx={{ paddingTop: alert ? 0 : '', paddingBottom: 0, overflowY: 'visible' }}>
        <MobileStepper
          variant="dots"
          steps={STEPS.length}
          position="static"
          activeStep={activeStep}
          backButton={
            <Button
              onClick={() => {
                setAlert(null);
                setActiveStep(prev => prev - 1);
              }}
              disabled={activeStep === 0}
            >
              Back
            </Button>
          }
          nextButton={
            <Button
              onClick={() => {
                setAlert(null);
                setActiveStep(prev => prev + 1);
              }}
              disabled={activeStep === STEPS.length - 1}
            >
              Next
            </Button>
          }
          sx={{ padding: 0 }}
        />
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>

        <Button loading={loading} variant="contained" disableElevation onClick={addEvent}>
          {user && user.isAdmin ? 'Add event' : 'Suggest event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEvent;
