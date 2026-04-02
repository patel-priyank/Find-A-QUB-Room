import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  AppBar,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
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
  ListSubheader,
  Menu,
  MenuItem,
  Skeleton,
  TextField,
  Toolbar,
  Typography
} from '@mui/material';
import { MobileDatePicker } from '@mui/x-date-pickers';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DeleteIcon from '@mui/icons-material/Delete';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import EventIcon from '@mui/icons-material/Event';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import MapIcon from '@mui/icons-material/Map';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SearchIcon from '@mui/icons-material/Search';

import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';

import AddEvent from './AddEvent.component';
import ApproveEvent from './ApproveEvent.component';
import EditEvent from './EditEvent.component';
import RemoveEvent from './RemoveEvent.component';
import SnackbarAlert from './SnackbarAlert.component';
import Switch from './Switch.component';

import { useAuthContext } from '../hooks/useAuthContext';
import { useLocationsContext } from '../hooks/useLocationsContext';
import { useMapContext } from '../hooks/useMapContext';
import { useSnackbarAlert } from '../hooks/useSnackbarAlert';

import { EM_DASH, LOCATION_TYPES } from '../utils/constants';
import { dateAvatar, highlightMatch, sleep } from '../utils/functions';

const Events = () => {
  // dayjs config
  dayjs.extend(updateLocale);
  dayjs.updateLocale('en', {
    weekStart: 1
  });

  const navigate = useNavigate();

  // context
  const { user } = useAuthContext();
  const { locations } = useLocationsContext();
  const { dispatch: mapDispatch } = useMapContext();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbarAlert();

  // page states
  const [menuAnchorElement, setMenuAnchorElement] = useState(null);
  const [eventMenuAnchorElement, setEventMenuAnchorElement] = useState(null);
  const [menuEvent, setMenuEvent] = useState(null);
  const [viewSuggestedEventsEnabled, setViewSuggestedEventsEnabled] = useState(false);
  const [filtersVisibility, setFiltersVisibility] = useState(false);
  const [fromDateFilter, setFromDateFilter] = useState(dayjs().startOf('day'));
  const [toDateFilter, setToDateFilter] = useState(dayjs().add(13, 'day').endOf('day'));
  const [locationsFilter, setLocationsFilter] = useState(
    locations
      ? locations
          .filter(loc => LOCATION_TYPES.find(type => type.key === loc.type).allowEvents)
          .map(loc => ({ id: loc._id, checked: true }))
      : []
  );
  const [searchContainerHeight, setSearchContainerHeight] = useState(0);
  const [events, setEvents] = useState(null);
  const [dialogEvent, setDialogEvent] = useState(null);

  // field states
  const [searchQuery, setSearchQuery] = useState('');

  // dialog open states
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [dateRangeFilterDialogOpen, setDateRangeFilterDialogOpen] = useState(false);
  const [locationsFilterDialogOpen, setLocationsFilterDialogOpen] = useState(false);
  const [approveEventDialogOpen, setApproveEventDialogOpen] = useState(false);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [removeEventDialogOpen, setRemoveEventDialogOpen] = useState(false);

  // references
  const eventsControllerRef = useRef(null); // for aborting fetchEvents
  const searchContainerRef = useRef(null); // for adjusting results container height

  // on component mount
  useEffect(() => {
    // fetch events
    fetchEvents();
  }, []);

  // calculate search container height when window is resized or filters are toggled
  useEffect(() => {
    const calcSearchContainerHeight = async () => {
      if (searchContainerRef.current) {
        await sleep();
        setSearchContainerHeight(searchContainerRef.current.offsetHeight);
      }
    };

    calcSearchContainerHeight();
    window.addEventListener('resize', calcSearchContainerHeight);

    return () => window.removeEventListener('resize', calcSearchContainerHeight);
  }, [filtersVisibility, searchQuery]);

  // close snackbar when dialog is opened
  useEffect(() => {
    if (
      addEventDialogOpen ||
      dateRangeFilterDialogOpen ||
      locationsFilterDialogOpen ||
      approveEventDialogOpen ||
      editEventDialogOpen ||
      removeEventDialogOpen
    ) {
      hideSnackbar();
    }
  }, [
    addEventDialogOpen,
    dateRangeFilterDialogOpen,
    locationsFilterDialogOpen,
    approveEventDialogOpen,
    editEventDialogOpen,
    removeEventDialogOpen
  ]);

  // abort request when dialog is opened and fetch when closed
  useEffect(() => {
    if (
      addEventDialogOpen ||
      dateRangeFilterDialogOpen ||
      locationsFilterDialogOpen ||
      approveEventDialogOpen ||
      editEventDialogOpen ||
      removeEventDialogOpen
    ) {
      if (eventsControllerRef.current) {
        eventsControllerRef.current.abort();
      }
    } else {
      if (!events) {
        fetchEvents();
      }
    }
  }, [
    addEventDialogOpen,
    dateRangeFilterDialogOpen,
    locationsFilterDialogOpen,
    approveEventDialogOpen,
    editEventDialogOpen,
    removeEventDialogOpen
  ]);

  // fetch events when filters are changed
  useEffect(() => {
    fetchEvents();
  }, [fromDateFilter, toDateFilter, locationsFilter]);

  // fetch events when suggested locations is toggled
  useEffect(() => {
    fetchEvents();
  }, [viewSuggestedEventsEnabled]);

  const fetchEvents = async () => {
    if (locations.length === 0) {
      return;
    }

    // abort previous request
    if (eventsControllerRef.current) {
      eventsControllerRef.current.abort();
    }

    setEvents(null);

    const fromDate = Number(fromDateFilter.toDate());
    const toDate = Number(toDateFilter.toDate());
    const locationIds = locationsFilter
      .filter(location => location.checked)
      .map(location => location.id)
      .join(',');
    const isSuggested = viewSuggestedEventsEnabled;

    eventsControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `/api/events?from=${fromDate}&to=${toDate}&locationIds=${locationIds}&isSuggested=${isSuggested}`,
        { signal: eventsControllerRef.current.signal }
      );

      const json = await response.json();

      if (response.ok) {
        setEvents(json);
      } else {
        showSnackbar('error', json.error);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    }
  };

  const matchesSearch = event => {
    const query = searchQuery.toLowerCase().trim();
    return event.title.toLowerCase().includes(query) || event.description.toLowerCase().includes(query);
  };

  const handleCloseMenu = () => {
    setEventMenuAnchorElement(null);
    setMenuEvent(null);
  };

  const DateRangeFilterDialog = () => {
    // temp states to avoid flickering
    const [tempFromDateFilter, setTempFromDateFilter] = useState(fromDateFilter);
    const [tempToDateFilter, setTempToDateFilter] = useState(toDateFilter);

    const [alert, setAlert] = useState(null);

    // reset when opened
    useEffect(() => {
      if (dateRangeFilterDialogOpen) {
        setTempFromDateFilter(fromDateFilter);
        setTempToDateFilter(toDateFilter);
        setAlert(null);
      }
    }, [dateRangeFilterDialogOpen]);

    const handleClose = () => setDateRangeFilterDialogOpen(false);

    const handleSave = () => {
      // check start date validity
      if (!dayjs.isDayjs(tempFromDateFilter) || !dayjs(tempFromDateFilter, 'DD MMM YYYY', true).isValid()) {
        setAlert({ severity: 'error', message: 'From date is invalid.' });
        return;
      }

      // check end date validity
      if (!dayjs.isDayjs(tempToDateFilter) || !dayjs(tempToDateFilter, 'DD MMM YYYY', true).isValid()) {
        setAlert({ severity: 'error', message: 'To date is invalid.' });
        return;
      }

      // check if start date is less than or equal to end date
      if (tempFromDateFilter.isAfter(tempToDateFilter)) {
        setAlert({ severity: 'error', message: 'To date must be later than the from date.' });
        return;
      }

      if (!tempFromDateFilter.isSame(fromDateFilter, 'day')) {
        setFromDateFilter(tempFromDateFilter);
      }

      if (!tempToDateFilter.isSame(toDateFilter, 'day')) {
        setToDateFilter(tempToDateFilter);
      }

      setDateRangeFilterDialogOpen(false);
    };

    return (
      <Dialog open={dateRangeFilterDialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box className="dialog-title-text-container">
            <DateRangeIcon />
            <Box>Filter date range</Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
          <form>
            <DialogContentText>Select a date range to view the events starting during that period.</DialogContentText>

            <MobileDatePicker
              closeOnSelect
              label="From"
              value={tempFromDateFilter}
              onChange={value => {
                setAlert(null);
                setTempFromDateFilter(value);
              }}
              slotProps={{
                calendarHeader: { startofweek: 1 }
              }}
              format="DD MMM YYYY"
            />

            <MobileDatePicker
              closeOnSelect
              label="To"
              value={tempToDateFilter}
              onChange={value => {
                setAlert(null);
                setTempToDateFilter(value);
              }}
              slotProps={{
                calendarHeader: { startofweek: 1 }
              }}
              format="DD MMM YYYY"
            />
          </form>
        </DialogContent>

        {alert && (
          <DialogContent className="alert-container">
            <Alert severity={alert.severity}>{alert.message}</Alert>
          </DialogContent>
        )}

        <DialogActions>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>

          <Button variant="contained" disableElevation onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const LocationsFilterDialog = () => {
    // temp states to avoid flickering
    const [tempLocationsFilter, setTempLocationsFilter] = useState([...locationsFilter]);

    const [menuAnchorElement, setMenuAnchorElement] = useState(null);
    const [alert, setAlert] = useState(null);
    const [filtersVisibility, setFiltersVisibility] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleTypes, setVisibleTypes] = useState(
      Object.fromEntries(LOCATION_TYPES.filter(type => type.allowEvents).map(type => [type.key, true]))
    );

    // reset when opened
    useEffect(() => {
      if (locationsFilterDialogOpen) {
        setTempLocationsFilter([...locationsFilter]);
        setAlert(null);
        setFiltersVisibility(false);
        setSearchQuery('');
        setVisibleTypes(
          Object.fromEntries(LOCATION_TYPES.filter(type => type.allowEvents).map(type => [type.key, true]))
        );
      }
    }, [locationsFilterDialogOpen]);

    const matchesSearch = location => {
      const query = searchQuery.toLowerCase().trim();
      return location.title.toLowerCase().includes(query) || location.building.toLowerCase().includes(query);
    };

    const handleChange = locationId => {
      setAlert(null);
      setTempLocationsFilter(prevFilter =>
        prevFilter.map(loc => (loc.id === locationId ? { ...loc, checked: !loc.checked } : loc))
      );
    };

    const handleClose = () => setLocationsFilterDialogOpen(false);

    const handleSave = () => {
      if (tempLocationsFilter.every(location => !location.checked)) {
        setAlert({ severity: 'warning', message: 'At least one location needs to selected.' });
        return;
      }

      if (JSON.stringify(tempLocationsFilter) !== JSON.stringify(locationsFilter)) {
        setLocationsFilter([...tempLocationsFilter]);
      }

      setLocationsFilterDialogOpen(false);
    };

    return (
      <Dialog open={locationsFilterDialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box className="dialog-title-text-container">
            <FmdGoodIcon />
            <Box>Filter locations</Box>
          </Box>

          <IconButton
            title="Options"
            color="inherit"
            onClick={e => setMenuAnchorElement(e.currentTarget)}
            sx={{ marginRight: '-8px' }}
          >
            <MoreVertIcon />
          </IconButton>
        </DialogTitle>

        <Menu
          anchorEl={menuAnchorElement}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={Boolean(menuAnchorElement)}
          onClose={() => setMenuAnchorElement(null)}
        >
          <MenuItem
            disabled={(() => {
              const visibleLocations = locations
                .filter(location => matchesSearch(location) && visibleTypes[location.type])
                .map(location => location._id);

              return (
                visibleLocations.length === 0 ||
                visibleLocations.every(id => tempLocationsFilter.find(loc => loc.id === id).checked === true)
              );
            })()}
            onClick={() => {
              setMenuAnchorElement(null);
              setTempLocationsFilter(prevFilter =>
                prevFilter.map(loc =>
                  locations
                    .filter(location => matchesSearch(location) && visibleTypes[location.type])
                    .map(location => location._id)
                    .includes(loc.id)
                    ? { ...loc, checked: true }
                    : loc
                )
              );
            }}
          >
            <ListItemIcon>
              <PlaylistAddCheckIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Select all shown" />
          </MenuItem>

          <MenuItem
            disabled={(() => {
              const visibleLocations = locations
                .filter(location => matchesSearch(location) && visibleTypes[location.type])
                .map(location => location._id);

              return (
                visibleLocations.length === 0 ||
                visibleLocations.every(id => tempLocationsFilter.find(loc => loc.id === id).checked === false)
              );
            })()}
            onClick={() => {
              setMenuAnchorElement(null);
              setTempLocationsFilter(prevFilter =>
                prevFilter.map(loc =>
                  locations
                    .filter(location => matchesSearch(location) && visibleTypes[location.type])
                    .map(location => location._id)
                    .includes(loc.id)
                    ? { ...loc, checked: false }
                    : loc
                )
              );
            }}
          >
            <ListItemIcon>
              <PlaylistRemoveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Deselect all shown" />
          </MenuItem>
        </Menu>

        <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
          <FormGroup sx={{ gap: '16px' }}>
            <DialogContentText>
              Choose locations where you want to see events. You can filter the locations by type for ease.
            </DialogContentText>

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
                    <FormGroup>
                      {locations
                        .filter(loc => matchesSearch(loc) && visibleTypes[loc.type])
                        .map(loc => {
                          const type = LOCATION_TYPES.find(type => type.key === loc.type);

                          return (
                            <FormControlLabel
                              key={loc._id}
                              control={
                                <Checkbox
                                  checked={tempLocationsFilter.find(l => l.id === loc._id).checked}
                                  onChange={() => handleChange(loc._id)}
                                  sx={{ marginRight: '6px' }}
                                />
                              }
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
                    </FormGroup>
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
        </DialogContent>

        {alert && (
          <DialogContent className="alert-container">
            <Alert severity={alert.severity}>{alert.message}</Alert>
          </DialogContent>
        )}

        <DialogActions>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>

          <Button variant="contained" disableElevation onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <>
      <AppBar>
        <Toolbar>
          <Typography noWrap variant="h6" component="div">
            Events
          </Typography>

          {!viewSuggestedEventsEnabled && (
            <IconButton
              title="Options"
              color="inherit"
              onClick={e => setMenuAnchorElement(e.currentTarget)}
              sx={{ marginRight: '-8px' }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Toolbar>

        {user && viewSuggestedEventsEnabled && (
          <Toolbar className="secondary-toolbar">
            <Typography variant="body2" noWrap>
              Viewing suggested events
            </Typography>

            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setViewSuggestedEventsEnabled(false);
              }}
            >
              Cancel
            </Button>
          </Toolbar>
        )}
      </AppBar>

      <Menu
        anchorEl={menuAnchorElement}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(menuAnchorElement)}
        onClose={() => setMenuAnchorElement(null)}
      >
        {!user && (
          <MenuItem
            onClick={() => {
              setMenuAnchorElement(null);
              showSnackbar('warning', 'You need to sign in to suggest events.');
            }}
          >
            <ListItemIcon>
              <EventIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Suggest event" />
          </MenuItem>
        )}

        {user && (
          <MenuItem
            onClick={() => {
              setMenuAnchorElement(null);
              if (locations.length === 0) {
                showSnackbar(
                  'warning',
                  user.isAdmin
                    ? 'Events can be added once locations are created.'
                    : 'Events can be suggested once locations are created.'
                );
              } else {
                setAddEventDialogOpen(true);
              }
            }}
          >
            <ListItemIcon>
              <EventIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={user.isAdmin ? 'Add event' : 'Suggest event'} />
          </MenuItem>
        )}

        {user && user.isAdmin && (
          <MenuItem
            onClick={async () => {
              setMenuAnchorElement(null);
              if (locations.length === 0) {
                showSnackbar('warning', 'Suggested events can be viewed once locations are created.');
              } else {
                setViewSuggestedEventsEnabled(true);
              }
            }}
          >
            <ListItemIcon>
              <CalendarTodayIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="View suggested events" />
          </MenuItem>
        )}
      </Menu>

      <AddEvent
        open={addEventDialogOpen}
        onClose={() => setAddEventDialogOpen(false)}
        showSnackbar={showSnackbar}
        fetchEvents={fetchEvents}
      />

      <DateRangeFilterDialog />

      <LocationsFilterDialog />

      <ApproveEvent
        open={approveEventDialogOpen}
        onClose={async () => {
          setApproveEventDialogOpen(false);
          await sleep();
          setDialogEvent(null);
        }}
        showSnackbar={showSnackbar}
        event={dialogEvent}
        fetchEvents={fetchEvents}
      />

      <EditEvent
        open={editEventDialogOpen}
        onClose={async () => {
          setEditEventDialogOpen(false);
          await sleep();
          setDialogEvent(null);
        }}
        showSnackbar={showSnackbar}
        event={dialogEvent}
        fetchEvents={fetchEvents}
      />

      <RemoveEvent
        open={removeEventDialogOpen}
        onClose={async () => {
          setRemoveEventDialogOpen(false);
          await sleep();
          setDialogEvent(null);
        }}
        showSnackbar={showSnackbar}
        event={dialogEvent}
        fetchEvents={fetchEvents}
      />

      <Box className="page-contents-container" sx={{ marginTop: viewSuggestedEventsEnabled ? '40px' : '' }}>
        {locations.length === 0 && (
          <Box className="page-contents">
            <Container className="page-layout" maxWidth="md">
              <Alert severity="warning">
                No locations available. Events can be added once locations are created, and will then appear here.
              </Alert>
            </Container>
          </Box>
        )}

        {locations.length > 0 && (
          <>
            <Container className="page-layout" maxWidth="md">
              <Box className="search-container" ref={searchContainerRef}>
                <TextField
                  variant="outlined"
                  type="text"
                  fullWidth
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
                  helperText="Search with event title or description"
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
                      <Chip
                        variant="filled"
                        icon={<DateRangeIcon fontSize="small" />}
                        color="primary"
                        label={`${fromDateFilter.format('DD MMM YYYY')} - ${toDateFilter.format('DD MMM YYYY')}`}
                        onClick={() => setDateRangeFilterDialogOpen(true)}
                      />

                      <Chip
                        variant="filled"
                        icon={<FmdGoodIcon fontSize="small" />}
                        color="primary"
                        label={(() => {
                          const checkedLocationIds = locationsFilter.filter(loc => loc.checked).map(loc => loc.id);
                          const firstCheckedLocationTitle = locations.find(l => l._id === checkedLocationIds[0]).title;

                          return checkedLocationIds.length > 1
                            ? `${firstCheckedLocationTitle} (+${checkedLocationIds.length - 1})`
                            : firstCheckedLocationTitle;
                        })()}
                        onClick={() => setLocationsFilterDialogOpen(true)}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            </Container>

            <Box
              className="page-contents"
              sx={{
                paddingTop: '8px',
                height: `calc(100% - ${searchContainerHeight}px)`
              }}
            >
              <Container className="page-layout" maxWidth="md">
                {!events && (
                  <>
                    {Array.from({ length: 3 }, (value, index) => index).map(item => (
                      <Box key={item} className="event">
                        <Box className="event-details">
                          <Skeleton variant="rounded" width={40} height={40} />

                          <Box sx={{ flexGrow: 1, margin: '6px 0' }}>
                            <Skeleton width="50%" />
                            <Skeleton width="30%" />
                            <Skeleton width="30%" />
                          </Box>
                        </Box>

                        <Skeleton variant="rounded" height={50} sx={{ marginLeft: '56px' }} />

                        <Box className="event-location-details" sx={{ gap: '8px' }}>
                          <Skeleton variant="circular" width={26} height={26} />

                          <Box width="100%">
                            <Skeleton width="60%" />
                            <Skeleton width="30%" />
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </>
                )}

                {events && events.length === 0 && (
                  <Typography className="search-message" color="text.primary">
                    No events found for the selected filters.
                  </Typography>
                )}

                {events && events.length > 0 && events.filter(event => matchesSearch(event)).length === 0 && (
                  <Typography className="search-message" color="text.primary">
                    No events match your search.
                  </Typography>
                )}

                {events && events.length > 0 && events.filter(event => matchesSearch(event)).length > 0 && (
                  <>
                    {events
                      .filter(event => matchesSearch(event))
                      .map(event => {
                        const locationType = LOCATION_TYPES.find(loc => loc.key === event.location.type);

                        return (
                          <Box key={event._id} className="event">
                            <Box className="event-details">
                              {dateAvatar(new Date(event.startDateTime))}

                              <Box sx={{ flexGrow: 1, margin: '6px 0' }}>
                                <Typography>{highlightMatch(event.title, searchQuery)}</Typography>

                                <Typography variant="body2" color="text.secondary">
                                  Starts at {dayjs(event.startDateTime).format('HH:mm (DD MMM YYYY)')}
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                  Ends at {dayjs(event.endDateTime).format('HH:mm (DD MMM YYYY)')}
                                </Typography>
                              </Box>

                              <IconButton
                                title="Options"
                                sx={{ marginRight: '-16px' }}
                                onClick={e => {
                                  setEventMenuAnchorElement(e.currentTarget);
                                  setMenuEvent(event);
                                }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Box>

                            <Typography variant="body2" sx={{ marginLeft: '56px' }}>
                              {highlightMatch(event.description, searchQuery)}
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
                        );
                      })}
                  </>
                )}
              </Container>
            </Box>
          </>
        )}

        {menuEvent && (
          <Menu
            anchorEl={eventMenuAnchorElement}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            className="disable-top-padding"
            open={Boolean(eventMenuAnchorElement)}
            onClose={handleCloseMenu}
          >
            {user && user.isAdmin && (
              <ListSubheader>
                {menuEvent.title.length > 24 ? `${menuEvent.title.substring(0, 24)}...` : menuEvent.title}
              </ListSubheader>
            )}

            {user && user.isAdmin && menuEvent.isSuggested && (
              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  setDialogEvent(menuEvent);
                  setApproveEventDialogOpen(true);
                }}
              >
                <ListItemIcon>
                  <EventIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Approve" />
              </MenuItem>
            )}

            {user && user.isAdmin && (
              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  setDialogEvent(menuEvent);
                  setEditEventDialogOpen(true);
                }}
              >
                <ListItemIcon>
                  <EditCalendarIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Edit" />
              </MenuItem>
            )}

            {user && user.isAdmin && (
              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  setDialogEvent(menuEvent);
                  setRemoveEventDialogOpen(true);
                }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Remove" />
              </MenuItem>
            )}

            <ListSubheader>{menuEvent.location.title}</ListSubheader>

            <MenuItem
              onClick={() => {
                handleCloseMenu();
                mapDispatch({
                  type: 'SET_LOCATION',
                  payload: menuEvent.location._id
                });
                navigate('/');
              }}
            >
              <ListItemIcon>
                <MapIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Locate on Map" />
            </MenuItem>
          </Menu>
        )}
      </Box>

      <SnackbarAlert snackbar={snackbar} handleSnackbarClose={hideSnackbar} />
    </>
  );
};

export default Events;
