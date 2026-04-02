import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Skeleton,
  TextField,
  Typography
} from '@mui/material';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MapIcon from '@mui/icons-material/Map';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SearchIcon from '@mui/icons-material/Search';

import Switch from './Switch.component';

import { useAuthContext } from '../hooks/useAuthContext';
import { useMapContext } from '../hooks/useMapContext';

import { EM_DASH, LOCATION_TYPES } from '../utils/constants';
import { getFeedbackTime, highlightMatch, stringAvatar } from '../utils/functions';

const LocationFeedback = ({ open, onClose, showSnackbar }) => {
  const navigate = useNavigate();

  // context
  const { user } = useAuthContext();
  const { dispatch: mapDispatch } = useMapContext();

  // dialog states
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [filtersVisibility, setFiltersVisibility] = useState(false);
  const [feedbackMenuAnchorElement, setFeedbackMenuAnchorElement] = useState(null); // menu anchor element for feedback item
  const [menuFeedback, setMenuFeedback] = useState(null); // menu for specific feedback
  const [locationMenuAnchorElement, setLocationMenuAnchorElement] = useState(null); // menu anchor element for location
  const [menuLocation, setMenuLocation] = useState(null); // menu for specific location
  const [feedbackVisibility, setFeedbackVisibility] = useState(false); // feedback visibility
  const [selectedLocation, setSelectedLocation] = useState(null); // selected location for feedback
  const [visibleTypes, setVisibleTypes] = useState(
    Object.fromEntries(LOCATION_TYPES.filter(type => type.isInteractive).map(type => [type.key, true]))
  );

  // field states
  const [searchQuery, setSearchQuery] = useState('');

  // data states
  const [locations, setLocations] = useState(null); // list of locations with feedback
  const [locationFeedback, setLocationFeedback] = useState(null); // feedback for location

  const ACCORDIONS = [
    {
      key: 'pending',
      label: `Pending feedback ${locationFeedback ? `(${locationFeedback.filter(fb => !fb.resolved).length})` : ''}`
    },
    {
      key: 'resolved',
      label: `Resolved feedback ${locationFeedback ? `(${locationFeedback.filter(fb => fb.resolved).length})` : ''}`
    }
  ];

  // dialog states
  const [expandedPanel, setExpandedPanel] = useState(ACCORDIONS[0].key);

  // references
  const feedbackControllerRef = useRef(null); // for aborting fetchLocationFeedback
  const locationsFormRef = useRef(null); // for locations form scrolling
  const feedbackFormRef = useRef(null); // for feedback form scrolling

  // reset when opened
  useEffect(() => {
    if (open) {
      setLoading(false);
      setAlert(null);
      setFiltersVisibility(false);
      setFeedbackMenuAnchorElement(null);
      setMenuFeedback(null);
      setLocationMenuAnchorElement(null);
      setMenuLocation(null);
      setFeedbackVisibility(false);
      setSelectedLocation(null);
      setVisibleTypes(
        Object.fromEntries(LOCATION_TYPES.filter(type => type.isInteractive).map(type => [type.key, true]))
      );
      setExpandedPanel(ACCORDIONS[0].key);

      setSearchQuery('');

      setLocations(null);
      setLocationFeedback(null);

      fetchLocations();
    }
  }, [open]);

  // scroll to top when view changes
  useEffect(() => {
    if (!feedbackVisibility && locationsFormRef.current) {
      locationsFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    if (feedbackVisibility && feedbackFormRef.current) {
      feedbackFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [feedbackVisibility]);

  const handleAccordionChange = panel => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : '');
  };

  const fetchLocations = async () => {
    const response = await fetch('/api/locations/with-feedback', {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      setLocations(json);
    } else {
      showSnackbar('error', json.error);
      onClose();
    }
  };

  const fetchLocationFeedback = async location => {
    // abort previous request
    if (feedbackControllerRef.current) {
      feedbackControllerRef.current.abort();
    }

    feedbackControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/locations/${location._id}/feedback`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        },
        signal: feedbackControllerRef.current.signal
      });

      const json = await response.json();

      if (response.ok) {
        handleCloseFeedbackMenu(); // close menu
        setLocationFeedback(json); // set/overwrite location feedback
        setLoading(false); // clear loading (after overwriting)
      } else {
        setAlert({ severity: 'error', message: json.error });
        setFeedbackVisibility(false);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    }
  };

  const updateFeedbackStatus = async (feedbackId, status) => {
    setLoading(true);
    setAlert(null);

    handleCloseFeedbackMenu();

    const response = await fetch(`/api/locations/${selectedLocation._id}/feedback/${feedbackId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ resolved: status }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (!response.ok) {
      setLoading(false);
      setAlert({ severity: 'error', message: json.error });
      return;
    }

    // fetch and overwrite if dialog is open and feedback is shown
    if (open && feedbackVisibility) {
      fetchLocationFeedback(selectedLocation);
    }
  };

  const matchesSearch = location => {
    const query = searchQuery.toLowerCase().trim();
    return location.title.toLowerCase().includes(query) || location.building.toLowerCase().includes(query);
  };

  const handleCloseLocationMenu = () => {
    setLocationMenuAnchorElement(null);
    setMenuLocation(null);
  };

  const handleCloseFeedbackMenu = () => {
    setFeedbackMenuAnchorElement(null);
    setMenuFeedback(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          {feedbackVisibility && loading ? <CircularProgress /> : <CommentIcon />}
          <Box>Location feedback</Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
        {!feedbackVisibility && (
          <Box ref={locationsFormRef}>
            {locations && locations.length > 0 && (
              <>
                <DialogContentText gutterBottom>
                  Pending feedback is available for these locations. Use the menu to access the feedback or locate on
                  Map to view details.
                </DialogContentText>

                <TextField
                  variant="outlined"
                  fullWidth
                  type="text"
                  placeholder="Search"
                  sx={{ margin: '16px 0' }}
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                  }}
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

                <Box className="filters-container" sx={{ paddingBottom: '16px' }}>
                  <FormControlLabel
                    control={
                      <Switch checked={filtersVisibility} onChange={() => setFiltersVisibility(current => !current)} />
                    }
                    label="Show filters"
                    labelPlacement="start"
                  />

                  {filtersVisibility && (
                    <Box className="chip-container">
                      {LOCATION_TYPES.filter(type => type.isInteractive).map(locationType => (
                        <Chip
                          key={locationType.key}
                          variant="outlined"
                          label={`${locationType.label} ${
                            locations
                              ? `(${locations.filter(l => matchesSearch(l) && l.type === locationType.key).length})`
                              : ''
                          }`}
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

                {locations.filter(location => matchesSearch(location)).length > 0 && (
                  <>
                    {locations.filter(location => matchesSearch(location) && visibleTypes[location.type]).length > 0 ? (
                      <List disablePadding>
                        {locations
                          .filter(location => matchesSearch(location) && visibleTypes[location.type])
                          .map(location => {
                            const type = LOCATION_TYPES.find(type => type.key === location.type);

                            return (
                              <ListItem
                                disableGutters
                                key={location._id}
                                secondaryAction={
                                  <>
                                    <Chip label={location.feedbackCount} color="secondary" />

                                    <IconButton
                                      title="Options"
                                      sx={{ marginRight: '-8px' }}
                                      onClick={e => {
                                        setAlert(null);
                                        setLocationMenuAnchorElement(e.currentTarget);
                                        setMenuLocation(location);
                                      }}
                                    >
                                      <MoreVertIcon />
                                    </IconButton>
                                  </>
                                }
                              >
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
                                  primary={highlightMatch(location.title, searchQuery)}
                                  secondary={
                                    location.building ? highlightMatch(location.building, searchQuery) : EM_DASH
                                  }
                                />
                              </ListItem>
                            );
                          })}
                      </List>
                    ) : (
                      <Typography color="text.primary">
                        Some locations are not shown due to current filters. Modify the filters to see them.
                      </Typography>
                    )}
                  </>
                )}

                {locations.filter(location => matchesSearch(location)).length === 0 && (
                  <Typography color="text.primary">No locations match your search.</Typography>
                )}
              </>
            )}

            {locations && locations.length === 0 && (
              <DialogContentText>
                No locations have received feedback yet. Once users begin submitting feedback, it will be displayed
                here.
              </DialogContentText>
            )}

            {!locations && (
              <List disablePadding>
                {Array.from({ length: 3 }, (value, index) => index).map(item => (
                  <ListItem disableGutters key={item}>
                    <ListItemIcon>
                      <Skeleton variant="circular" width={40} height={40} />
                    </ListItemIcon>
                    <ListItemText primary={<Skeleton />} secondary={<Skeleton width="30%" />} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {feedbackVisibility && (
          <FormGroup sx={{ gap: '16px' }} ref={feedbackFormRef}>
            <Button
              variant="outlined"
              disabled={loading}
              onClick={() => {
                setAlert(null);
                setSelectedLocation(null);
                setLocationFeedback(null);
                setFeedbackVisibility(false);

                if (feedbackControllerRef.current) {
                  feedbackControllerRef.current.abort();
                }
              }}
              sx={{ alignSelf: 'flex-start', marginBottom: '8px' }}
            >
              Back to locations
            </Button>

            <DialogContentText>
              Manage the feedback submitted for{' '}
              <Box component="span" sx={{ fontWeight: 700 }}>
                {selectedLocation.title}
              </Box>{' '}
              by updating the status as needed. Feedback status are only visible to admins.
            </DialogContentText>

            <Box className="accordion-container">
              {ACCORDIONS.map(accordion => (
                <Accordion
                  key={accordion.key}
                  expanded={expandedPanel === accordion.key}
                  onChange={handleAccordionChange(accordion.key)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography component="span">{accordion.label}</Typography>
                  </AccordionSummary>

                  <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {accordion.key === 'pending' && (
                      <>
                        {!locationFeedback &&
                          Array.from({ length: 3 }, (value, index) => index).map(item => (
                            <Box key={item} className="feedback">
                              <Box className="feedback-user-details">
                                <Skeleton variant="circular" width={40} height={40} />
                                <Box sx={{ flexGrow: 1, margin: '6px 0' }}>
                                  <Skeleton width="50%" />
                                  <Skeleton />
                                  <Skeleton width="30%" />
                                </Box>
                              </Box>

                              <Skeleton variant="rounded" height={75} sx={{ marginLeft: '56px' }} />
                            </Box>
                          ))}

                        {locationFeedback && locationFeedback.filter(fb => !fb.resolved).length === 0 && (
                          <Typography color="text.secondary">No pending feedback present.</Typography>
                        )}

                        {locationFeedback &&
                          locationFeedback.filter(fb => !fb.resolved).length > 0 &&
                          locationFeedback
                            .filter(fb => !fb.resolved)
                            .map(fb => (
                              <Box key={fb._id} className="feedback">
                                <Box className="feedback-user-details">
                                  {stringAvatar(fb.user.name)}

                                  <Box sx={{ flexGrow: 1, margin: '6px 0' }}>
                                    <Typography>{fb.user.name}</Typography>

                                    <Typography variant="body2" color="text.secondary">
                                      {fb.user.email}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                      {getFeedbackTime(fb.time)}
                                    </Typography>
                                  </Box>

                                  <IconButton
                                    title="Options"
                                    sx={{ marginRight: '-8px' }}
                                    onClick={e => {
                                      setAlert(null);
                                      setFeedbackMenuAnchorElement(e.currentTarget);
                                      setMenuFeedback(fb);
                                    }}
                                  >
                                    <MoreVertIcon />
                                  </IconButton>
                                </Box>

                                <Typography variant="body2" sx={{ marginLeft: '56px' }}>
                                  {fb.message}
                                </Typography>
                              </Box>
                            ))}
                      </>
                    )}

                    {accordion.key === 'resolved' && (
                      <>
                        {!locationFeedback &&
                          Array.from({ length: 3 }, (value, index) => index).map(item => (
                            <Box key={item} className="feedback">
                              <Box className="feedback-user-details">
                                <Skeleton variant="circular" width={40} height={40} />
                                <Box sx={{ flexGrow: 1, margin: '6px 0' }}>
                                  <Skeleton width="50%" />
                                  <Skeleton />
                                  <Skeleton width="30%" />
                                </Box>
                              </Box>

                              <Skeleton variant="rounded" height={75} sx={{ marginLeft: '56px' }} />
                            </Box>
                          ))}

                        {locationFeedback && locationFeedback.filter(fb => fb.resolved).length === 0 && (
                          <Typography color="text.secondary">No resolved feedback present.</Typography>
                        )}

                        {locationFeedback &&
                          locationFeedback.filter(fb => fb.resolved).length > 0 &&
                          locationFeedback
                            .filter(fb => fb.resolved)
                            .map(fb => (
                              <Box key={fb._id} className="feedback">
                                <Box className="feedback-user-details">
                                  {stringAvatar(fb.user.name)}

                                  <Box sx={{ flexGrow: 1, margin: '6px 0' }}>
                                    <Typography>{fb.user.name}</Typography>

                                    <Typography variant="body2" color="text.secondary">
                                      {fb.user.email}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                      {getFeedbackTime(fb.time)}
                                    </Typography>
                                  </Box>

                                  <IconButton
                                    title="Options"
                                    sx={{ marginRight: '-8px' }}
                                    onClick={e => {
                                      setAlert(null);
                                      setFeedbackMenuAnchorElement(e.currentTarget);
                                      setMenuFeedback(fb);
                                    }}
                                  >
                                    <MoreVertIcon />
                                  </IconButton>
                                </Box>

                                <Typography variant="body2" sx={{ marginLeft: '56px' }}>
                                  {fb.message}
                                </Typography>
                              </Box>
                            ))}
                      </>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </FormGroup>
        )}
      </DialogContent>

      {menuLocation && (
        <Menu
          anchorEl={locationMenuAnchorElement}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          className="disable-top-padding"
          open={Boolean(locationMenuAnchorElement)}
          onClose={handleCloseLocationMenu}
        >
          <ListSubheader>{menuLocation.title}</ListSubheader>

          <MenuItem
            onClick={() => {
              handleCloseLocationMenu();
              mapDispatch({
                type: 'SET_LOCATION',
                payload: menuLocation._id
              });
              navigate('/');
            }}
          >
            <ListItemIcon>
              <MapIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Locate on Map" />
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleCloseLocationMenu();
              setSelectedLocation(menuLocation);
              fetchLocationFeedback(menuLocation);
              setFeedbackVisibility(true);
              setExpandedPanel(ACCORDIONS[0].key);
            }}
          >
            <ListItemIcon>
              <CommentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="View feedback" />
          </MenuItem>
        </Menu>
      )}

      {menuFeedback && (
        <Menu
          anchorEl={feedbackMenuAnchorElement}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          className="disable-top-padding"
          open={Boolean(feedbackMenuAnchorElement)}
          onClose={handleCloseFeedbackMenu}
        >
          <ListSubheader>{getFeedbackTime(menuFeedback.time, menuFeedback.user)}</ListSubheader>

          {menuFeedback.resolved && (
            <MenuItem disabled={loading} onClick={() => updateFeedbackStatus(menuFeedback._id, false)}>
              <ListItemIcon>
                <AccessTimeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Mark as Pending" />
            </MenuItem>
          )}

          {!menuFeedback.resolved && (
            <MenuItem disabled={loading} onClick={() => updateFeedbackStatus(menuFeedback._id, true)}>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Mark as Resolved" />
            </MenuItem>
          )}
        </Menu>
      )}

      {alert && (
        <DialogContent className="alert-container">
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </DialogContent>
      )}

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationFeedback;
