import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormGroup,
  IconButton,
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
import AddCommentIcon from '@mui/icons-material/AddComment';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import DirectionsIcon from '@mui/icons-material/Directions';
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NearMeIcon from '@mui/icons-material/NearMe';

import dayjs from 'dayjs';

import { useAuthContext } from '../hooks/useAuthContext';
import { useLocationsContext } from '../hooks/useLocationsContext';
import { useMapContext } from '../hooks/useMapContext';

import { ACCESSIBILITY_VALUES, EM_DASH, LOCATION_TYPES } from '../utils/constants';
import { dateAvatar, getFeedbackTime, sleep, stringAvatar } from '../utils/functions';

const LocationDetails = ({
  open,
  onClose,
  selectedLocation,
  showSnackbar,
  setEditLocationDialogOpen,
  setDialogLocation,
  plotRoute
}) => {
  const navigate = useNavigate();

  // context
  const { user } = useAuthContext();
  const { dispatch: locationsDispatch } = useLocationsContext();
  const { dispatch: mapDispatch } = useMapContext();

  // dialog states
  const [imageIndex, setImageIndex] = useState(0); // for location images
  const [actionLoading, setActionLoading] = useState(false); // for location actions
  const [menuLoading, setMenuLoading] = useState(false); // for menu items
  const [alert, setAlert] = useState(null);
  const [menuAnchorElement, setMenuAnchorElement] = useState(null); // menu anchor for dialog
  const [feedbackMenuAnchorElement, setFeedbackMenuAnchorElement] = useState(null); // menu anchor for feedback item
  const [menuFeedback, setMenuFeedback] = useState(null); // menu for feedback item
  const [feedbackVisibility, setFeedbackVisibility] = useState(false);
  const [eventsVisibility, setEventsVisibility] = useState(false);
  const [approveSuggestionVisibility, setApproveSuggestionVisibility] = useState(false); // approve suggestion confirmation visibility
  const [removeLocationVisibility, setRemoveLocationVisibility] = useState(false); // remove location confirmation visibility
  const [addFeedbackVisibility, setAddFeedbackVisibility] = useState(false); // add feedback visibility

  // field states
  const [feedbackMessage, setFeedbackMessage] = useState(''); // message field for add feedback

  // data states
  const [location, setLocation] = useState(null);
  const [locationFeedback, setLocationFeedback] = useState(null);
  const [locationEvents, setLocationEvents] = useState(null);

  const FEEDBACK_ACCORDIONS = [
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
  const [feedbackExpandedPanel, setFeedbackExpandedPanel] = useState(FEEDBACK_ACCORDIONS[0].key);

  // references
  const feedbackControllerRef = useRef(null); // for aborting fetchLocationFeedback
  const eventsControllerRef = useRef(null); // for aborting fetchLocationEvents
  const detailsFormRef = useRef(null); // for details form scrolling
  const feedbackFormRef = useRef(null); // for feedback form scrolling
  const eventsFormRef = useRef(null); // for events form scrolling

  // update open days to store only days when location is open
  const openDays = location ? location.openDays.filter(day => day.openOnDay) : [];

  // reset when opened
  useEffect(() => {
    if (open && selectedLocation) {
      setImageIndex(0);
      setActionLoading(false);
      setMenuLoading(false);
      setAlert(null);
      setMenuAnchorElement(null);
      setFeedbackMenuAnchorElement(null);
      setMenuFeedback(null);
      setFeedbackVisibility(false);
      setEventsVisibility(false);

      setFeedbackMessage('');

      setLocation(null);
      setLocationFeedback(null);
      setLocationEvents(null);

      hideLocationActions();
      incrementViewCount();
      fetchLocationDetails();
    }
  }, [open, selectedLocation]);

  // scroll to top when view changes
  useEffect(() => {
    if (!feedbackVisibility && !eventsVisibility && detailsFormRef.current) {
      detailsFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    if (feedbackVisibility && !eventsVisibility && feedbackFormRef.current) {
      feedbackFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    if (!feedbackVisibility && eventsVisibility && eventsFormRef.current) {
      eventsFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [feedbackVisibility, eventsVisibility]);

  const handleAccordionChange = panel => (event, isExpanded) => {
    setFeedbackExpandedPanel(isExpanded ? panel : '');
  };

  const incrementViewCount = async () => {
    const response = await fetch(`/api/locations/${selectedLocation._id}/increment-views`, {
      method: 'PATCH'
    });

    const json = await response.json();

    if (!response.ok) {
      console.error(json.error);
    }
  };

  const fetchLocationDetails = async () => {
    const response = await fetch(
      `/api/locations/${selectedLocation._id}/data`,
      user ? { headers: { Authorization: `Bearer ${user.token}` } } : {}
    );

    const json = await response.json();

    if (response.ok) {
      setLocation(json);
    } else {
      showSnackbar('error', json.error);
      onClose();
    }
  };

  const fetchLocationFeedback = async () => {
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
        if (json.length === 0) {
          setAlert({ severity: 'warning', message: 'No feedback has been shared for this location yet.' });
          setFeedbackVisibility(false);
          return;
        }

        handleCloseFeedbackMenu(); // close menu
        setLocationFeedback(json); // set/overwrite location feedback
        setMenuLoading(false); // clear loading (after overwriting)
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

  const fetchLocationEvents = async () => {
    // abort previous request
    if (eventsControllerRef.current) {
      eventsControllerRef.current.abort();
    }

    const fromDate = Number(dayjs().startOf('day').toDate());
    const toDate = Number(dayjs().add(13, 'day').endOf('day').toDate());
    const locationIds = location._id;

    eventsControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `/api/events?from=${fromDate}&to=${toDate}&locationIds=${locationIds}&isSuggested=false`,
        { signal: eventsControllerRef.current.signal }
      );

      const json = await response.json();

      if (response.ok) {
        if (json.length === 0) {
          setAlert({
            severity: 'warning',
            message:
              'No events are scheduled at this location in the next two weeks. More options are available on the Events page.'
          });
          setEventsVisibility(false);
          return;
        }

        setLocationEvents(json); // set location events
      } else {
        setAlert({ severity: 'error', message: json.error });
        setEventsVisibility(false);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    }
  };

  const addFeedback = async event => {
    event.preventDefault();

    setActionLoading(true);
    setAlert(null);

    const response = await fetch(`/api/locations/${location._id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ message: feedbackMessage }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (!response.ok) {
      setAlert({ severity: 'error', message: json.error });
      setActionLoading(false);
    }

    showSnackbar('success', 'Feedback submitted successfully!');
    onClose();
  };

  // remove location
  const removeLocation = async () => {
    setActionLoading(true);
    setAlert(null);

    const response = await fetch(`/api/locations/${location._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      showSnackbar(
        'success',
        location.isSuggested ? 'Suggestion removed successfully!' : 'Location removed successfully!'
      );

      if (location.isSuggested) {
        onClose(location._id);
      } else {
        onClose();
        locationsDispatch({ type: 'DELETE_LOCATION', payload: json });
      }
    } else {
      setActionLoading(false);
      setAlert({ severity: 'error', message: json.error });
    }
  };

  // save location for user
  const saveLocation = async () => {
    setMenuLoading(true);
    setAlert(null);

    setMenuAnchorElement(null);

    const response = await fetch(`/api/user/saved-locations/${location._id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      // update frontend object
      location.saved = true;
    } else {
      setAlert({ severity: 'error', message: json.error });
    }

    setMenuLoading(false);
  };

  // remove saved location for user
  const unsaveLocation = async () => {
    setMenuLoading(true);
    setAlert(null);

    setMenuAnchorElement(null);

    const response = await fetch(`/api/user/saved-locations/${location._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      // update frontend object
      location.saved = false;
    } else {
      setAlert({ severity: 'error', message: json.error });
    }

    setMenuLoading(false);
  };

  // approve suggested location
  const approveSuggestion = async () => {
    setActionLoading(true);
    setAlert(null);

    const response = await fetch(`/api/locations/${location._id}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      showSnackbar('success', 'Location approved successfully!');
      onClose(location._id);
      locationsDispatch({ type: 'CREATE_LOCATION', payload: location });
    } else {
      setActionLoading(false);
      setAlert({ severity: 'error', message: json.error });
    }
  };

  // update resolved status for feedback
  const updateFeedbackResolvedStatus = async (feedbackId, status) => {
    setMenuLoading(true);
    setAlert(null);

    handleCloseFeedbackMenu();

    const response = await fetch(`/api/locations/${location._id}/feedback/${feedbackId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ resolved: status }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (!response.ok) {
      setMenuLoading(false);
      setAlert({ severity: 'error', message: json.error });
      return;
    }

    // fetch and overwrite if dialog is open and feedback is shown
    if (open && feedbackVisibility) {
      fetchLocationFeedback();
    }
  };

  const hideLocationActions = () => {
    setAlert(null);
    setApproveSuggestionVisibility(false);
    setRemoveLocationVisibility(false);
    setAddFeedbackVisibility(false);
  };

  const handleCloseFeedbackMenu = () => {
    setFeedbackMenuAnchorElement(null);
    setMenuFeedback(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          {menuLoading ? <CircularProgress /> : <InfoIcon />}
          <Box>{selectedLocation ? selectedLocation.title : ''}</Box>
        </Box>

        {location && !feedbackVisibility && !eventsVisibility && (
          <IconButton
            title="Options"
            onClick={e => {
              setAlert(null);
              setMenuAnchorElement(e.currentTarget);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
        {!feedbackVisibility && !eventsVisibility && (
          <FormGroup sx={{ gap: '16px' }} ref={detailsFormRef}>
            <FormGroup className="location-detail">
              <Typography variant="subtitle2">Type</Typography>
              <Typography>
                {location ? LOCATION_TYPES.find(type => type.key === location.type).label : <Skeleton width="20%" />}
              </Typography>
            </FormGroup>

            <FormGroup className="location-detail">
              <Typography variant="subtitle2">Building</Typography>
              <Typography>{location ? location.building || EM_DASH : <Skeleton width="30%" />}</Typography>
            </FormGroup>

            <FormGroup className="location-detail">
              <Typography variant="subtitle2">Floor</Typography>
              <Typography>{location ? location.floor || EM_DASH : <Skeleton width="10%" />}</Typography>
            </FormGroup>

            <FormGroup className="location-detail">
              <Typography variant="subtitle2">Directions within building</Typography>
              <Typography>
                {location ? location.directions || EM_DASH : <Skeleton variant="rounded" height={75} />}
              </Typography>
            </FormGroup>

            <FormGroup className="location-detail">
              <Typography variant="subtitle2">Additional information</Typography>
              <Typography>
                {location ? location.additionalInfo || EM_DASH : <Skeleton variant="rounded" height={75} />}
              </Typography>
            </FormGroup>

            <FormGroup className="location-detail">
              <Typography variant="subtitle2">Accessible</Typography>
              <Typography>
                {location ? (
                  ACCESSIBILITY_VALUES.find(value => Object.keys(value)[0] === location.isAccessible)[
                    location.isAccessible
                  ]
                ) : (
                  <Skeleton width="10%" />
                )}
              </Typography>
            </FormGroup>

            <FormGroup className="location-detail">
              <Typography variant="subtitle2">Open hours</Typography>

              {location && openDays.length > 0 && (
                <FormGroup className="open-hours-location-detail">
                  {openDays.map(day => (
                    <Box key={day.key}>
                      <Typography variant="body2">{day.label}</Typography>
                      <Typography>
                        {day.openingTime} - {day.closingTime}
                      </Typography>
                    </Box>
                  ))}
                </FormGroup>
              )}

              {location && openDays.length === 0 && <Typography>{EM_DASH}</Typography>}

              {!location && <Skeleton variant="rounded" height={100} width="50%" />}
            </FormGroup>

            {location && location.imageData.length > 0 && (
              <Box className="carousel-wrapper">
                <Box className="carousel-container">
                  <IconButton
                    onClick={() => {
                      setAlert(null);
                      setImageIndex(prev => prev - 1);
                    }}
                    disabled={imageIndex === 0}
                    sx={{ marginLeft: '-8px' }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>

                  <Box className="carousel-image-container">
                    {location.imageData.map((image, imgIndex) => (
                      <Box
                        key={imgIndex}
                        className="carousel-image"
                        sx={{ display: imgIndex === imageIndex ? '' : 'none' }}
                      >
                        <img src={image.url} />
                      </Box>
                    ))}
                  </Box>

                  <IconButton
                    onClick={() => {
                      setAlert(null);
                      setImageIndex(prev => prev + 1);
                    }}
                    disabled={imageIndex === location.imageData.length - 1}
                    sx={{ marginRight: '-8px' }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>

                <Typography color="text.primary">
                  Photo {imageIndex + 1} of {location.imageData.length}
                </Typography>
              </Box>
            )}

            {location && location.isSuggested && (
              <Alert severity="warning" variant="outlined">
                This location was suggested by a user and is visible only to admins until it's approved.
              </Alert>
            )}
          </FormGroup>
        )}

        {feedbackVisibility && !eventsVisibility && (
          <FormGroup sx={{ gap: '16px' }} ref={feedbackFormRef}>
            <Button
              variant="outlined"
              disabled={menuLoading}
              onClick={() => {
                setAlert(null);
                setLocationFeedback(null);
                setFeedbackVisibility(false);

                if (feedbackControllerRef.current) {
                  feedbackControllerRef.current.abort();
                }
              }}
              sx={{ alignSelf: 'flex-start', marginBottom: '8px' }}
            >
              Back to details
            </Button>

            <DialogContentText>
              Manage the feedback submitted for this location by updating the status as needed. Feedback status are only
              visible to admins.
            </DialogContentText>

            <Box className="accordion-container">
              {FEEDBACK_ACCORDIONS.map(accordion => (
                <Accordion
                  key={accordion.key}
                  expanded={feedbackExpandedPanel === accordion.key}
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

        {!feedbackVisibility && eventsVisibility && (
          <FormGroup sx={{ gap: '16px' }} ref={eventsFormRef}>
            <Button
              variant="outlined"
              onClick={() => {
                setAlert(null);
                setLocationEvents(null);
                setEventsVisibility(false);

                if (eventsControllerRef.current) {
                  eventsControllerRef.current.abort();
                }
              }}
              sx={{ alignSelf: 'flex-start', marginBottom: '8px' }}
            >
              Back to details
            </Button>

            <DialogContentText>
              View events scheduled at this location in the next two weeks. More options are available on the Events
              page.
            </DialogContentText>

            {!locationEvents &&
              Array.from({ length: 3 }, (value, index) => index).map(item => (
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
                </Box>
              ))}

            {locationEvents &&
              locationEvents.map(event => (
                <Box key={event._id} className="event">
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
                </Box>
              ))}
          </FormGroup>
        )}
      </DialogContent>

      {/* menu for details view */}
      {location && !feedbackVisibility && !eventsVisibility && (
        <Menu
          anchorEl={menuAnchorElement}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={Boolean(menuAnchorElement)}
          onClose={() => setMenuAnchorElement(null)}
        >
          {!user && (
            <MenuItem
              disabled={menuLoading || actionLoading}
              onClick={() => {
                setMenuAnchorElement(null);
                setAlert({ severity: 'warning', message: 'You need to sign in to save locations.' });
              }}
            >
              <ListItemIcon>
                <BookmarkBorderOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Save" />
            </MenuItem>
          )}

          {user && !location.isSuggested && !location.saved && (
            <MenuItem disabled={menuLoading || actionLoading} onClick={saveLocation}>
              <ListItemIcon>
                <BookmarkBorderOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Save" />
            </MenuItem>
          )}

          {user && !location.isSuggested && location.saved && (
            <MenuItem disabled={menuLoading || actionLoading} onClick={unsaveLocation}>
              <ListItemIcon>
                <BookmarkIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Unsave" />
            </MenuItem>
          )}

          {!location.isSuggested && (
            <MenuItem
              disabled={menuLoading || actionLoading}
              onClick={() => {
                setAlert(null);
                setMenuAnchorElement(null);
                hideLocationActions();
                setEventsVisibility(true);
                fetchLocationEvents();
              }}
            >
              <ListItemIcon>
                <CalendarMonthIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="View events" />
            </MenuItem>
          )}

          {!user && !location.isSuggested && (
            <MenuItem
              disabled={menuLoading || actionLoading}
              onClick={() => {
                setMenuAnchorElement(null);
                setAlert({ severity: 'warning', message: 'You need to sign in to add feedback.' });
              }}
            >
              <ListItemIcon>
                <AddCommentIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add feedback" />
            </MenuItem>
          )}

          {user && !location.isSuggested && (
            <MenuItem
              disabled={menuLoading || actionLoading}
              onClick={() => {
                setMenuAnchorElement(null);
                hideLocationActions();
                setFeedbackMessage('');
                setAddFeedbackVisibility(true);
              }}
            >
              <ListItemIcon>
                <AddCommentIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add feedback" />
            </MenuItem>
          )}

          {!location.isSuggested && <Divider />}

          {!location.isSuggested && !plotRoute && (
            <MenuItem
              disabled={menuLoading || actionLoading}
              onClick={() => {
                setMenuAnchorElement(null);
                mapDispatch({
                  type: 'SET_ROUTE',
                  payload: location._id
                });
                navigate('/');
              }}
            >
              <ListItemIcon>
                <DirectionsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Plot route" />
            </MenuItem>
          )}

          {!location.isSuggested && plotRoute && (
            <MenuItem
              disabled={menuLoading || actionLoading}
              onClick={async () => {
                onClose();
                await sleep();
                plotRoute(location.coordinates);
              }}
            >
              <ListItemIcon>
                <DirectionsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Plot route" />
            </MenuItem>
          )}

          {!location.isSuggested && (
            <MenuItem
              disabled={menuLoading || actionLoading}
              onClick={() => {
                onClose();
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.coordinates}`);
              }}
            >
              <ListItemIcon>
                <NearMeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Navigate" />
            </MenuItem>
          )}

          {user && user.isAdmin && !location.isSuggested && <Divider />}

          {user && user.isAdmin && !location.isSuggested && (
            <MenuItem
              disabled={menuLoading || actionLoading}
              onClick={() => {
                setAlert(null);
                setMenuAnchorElement(null);
                hideLocationActions();
                setFeedbackVisibility(true);
                fetchLocationFeedback();
                setFeedbackExpandedPanel(FEEDBACK_ACCORDIONS[0].key);
              }}
            >
              <ListItemIcon>
                <CommentIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="View feedback" />
            </MenuItem>
          )}

          {user && user.isAdmin && location.isSuggested && (
            <MenuItem
              disabled={menuLoading || actionLoading}
              onClick={() => {
                setAlert(null);
                setMenuAnchorElement(null);
                hideLocationActions();
                setApproveSuggestionVisibility(true);
              }}
            >
              <ListItemIcon>
                <AddLocationAltIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Approve" />
            </MenuItem>
          )}

          {user && user.isAdmin && (
            <MenuItem
              disabled={menuLoading || actionLoading}
              onClick={async () => {
                setMenuAnchorElement(null);
                onClose();
                await sleep();
                setEditLocationDialogOpen(true);
                setDialogLocation(location);
              }}
            >
              <ListItemIcon>
                <EditLocationAltIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Edit" />
            </MenuItem>
          )}

          {user && user.isAdmin && (
            <MenuItem
              disabled={menuLoading || actionLoading}
              onClick={() => {
                setAlert(null);
                setMenuAnchorElement(null);
                hideLocationActions();
                setRemoveLocationVisibility(true);
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Remove" />
            </MenuItem>
          )}
        </Menu>
      )}

      {/* menu for feedback items */}
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
            <MenuItem disabled={menuLoading} onClick={() => updateFeedbackResolvedStatus(menuFeedback._id, false)}>
              <ListItemIcon>
                <AccessTimeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Mark as Pending" />
            </MenuItem>
          )}

          {!menuFeedback.resolved && (
            <MenuItem disabled={menuLoading} onClick={() => updateFeedbackResolvedStatus(menuFeedback._id, true)}>
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

      {approveSuggestionVisibility && (
        <Box className="location-action-confirm-container">
          <Typography>
            Approving this location will make it visible to all users when they browse or search, and they'll be able to
            save it or leave feedback.
          </Typography>

          <Box className="location-action-confirm-buttons">
            <Button
              variant="contained"
              disableElevation
              disabled={menuLoading || actionLoading}
              loading={actionLoading}
              onClick={approveSuggestion}
            >
              Approve location
            </Button>

            <Button variant="outlined" onClick={hideLocationActions}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {removeLocationVisibility && (
        <Box className="location-action-confirm-container">
          {location && location.isSuggested && (
            <Typography>
              Removing this suggestion is permanent. It will be deleted immediately and will no longer be visible to
              admins. The suggesting user will not be notified.
            </Typography>
          )}

          {location && !location.isSuggested && (
            <Typography>
              Removing this location is permanent. All feedback submitted for it will be deleted, and it will be removed
              from the saved locations of any user. All events linked to this location, including past ones, will also
              be removed. Once removed, it will no longer appear when users browse or search.
            </Typography>
          )}

          <Box className="location-action-confirm-buttons">
            <Button
              variant="contained"
              disableElevation
              color="error"
              disabled={menuLoading || actionLoading}
              loading={actionLoading}
              onClick={removeLocation}
            >
              {location && location.isSuggested ? 'Remove suggestion' : 'Remove location'}
            </Button>

            <Button variant="outlined" onClick={hideLocationActions}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {addFeedbackVisibility && (
        <Box className="location-action-confirm-container">
          <Typography>
            Notice something incorrect or missing? Share your feedback. Admins can review it and take appropriate
            action. Your name and email will be shared.
          </Typography>

          <form id="add-feedback-form" onSubmit={addFeedback}>
            <TextField
              variant="outlined"
              label="Message"
              type="text"
              fullWidth
              slotProps={{ htmlInput: { maxLength: 256 } }}
              multiline
              rows={2}
              value={feedbackMessage}
              onChange={e => setFeedbackMessage(e.target.value)}
              required
            />
          </form>

          <Box className="location-action-confirm-buttons">
            <Button
              variant="contained"
              disableElevation
              disabled={menuLoading || actionLoading}
              loading={actionLoading}
              type="submit"
              form="add-feedback-form"
            >
              Add feedback
            </Button>

            <Button variant="outlined" onClick={hideLocationActions}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

export default LocationDetails;
