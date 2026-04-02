import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Chip,
  darken,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Skeleton,
  Typography
} from '@mui/material';

import AnalyticsIcon from '@mui/icons-material/Analytics';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlagIcon from '@mui/icons-material/Flag';
import MapIcon from '@mui/icons-material/Map';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import { useAuthContext } from '../hooks/useAuthContext';
import { useMapContext } from '../hooks/useMapContext';

import { EM_DASH, LOCATION_TYPES } from '../utils/constants';

const Statistics = ({ open, onClose, showSnackbar }) => {
  const navigate = useNavigate();

  // context
  const { user } = useAuthContext();
  const { dispatch: mapDispatch } = useMapContext();

  // dialog states
  const [menuAnchorElement, setMenuAnchorElement] = useState(null);
  const [menuLocation, setMenuLocation] = useState(null);

  // data states
  const [statistics, setStatistics] = useState({});

  const ACCORDIONS = [
    {
      key: 'app-metrics',
      label: 'App Metrics',
      content: (
        <List disablePadding>
          <ListItem
            disableGutters
            secondaryAction={
              statistics.appVisits ? <Chip label={Math.ceil(statistics.appVisits / 2)} color="secondary" /> : null
            }
          >
            <ListItemIcon>
              {statistics.appVisits ? (
                <Avatar sx={{ background: '#51793f' }}>
                  <FlagIcon sx={{ fontSize: '22px' }} />
                </Avatar>
              ) : (
                <Skeleton variant="circular" width={40} height={40} />
              )}
            </ListItemIcon>
            <ListItemText primary={statistics.appVisits ? 'App visits' : <Skeleton width={150} />} />
          </ListItem>

          <ListItem
            disableGutters
            secondaryAction={statistics.admins ? <Chip label={statistics.admins} color="secondary" /> : null}
          >
            <ListItemIcon>
              {statistics.admins ? (
                <Avatar sx={{ background: '#795548' }}>
                  <VerifiedUserIcon sx={{ fontSize: '22px' }} />
                </Avatar>
              ) : (
                <Skeleton variant="circular" width={40} height={40} />
              )}
            </ListItemIcon>
            <ListItemText primary={statistics.admins ? 'Admin accounts' : <Skeleton width={150} />} />
          </ListItem>

          <ListItem
            disableGutters
            secondaryAction={statistics.users ? <Chip label={statistics.users} color="secondary" /> : null}
          >
            <ListItemIcon>
              {statistics.users ? (
                <Avatar sx={{ background: '#757575' }}>
                  <PeopleAltIcon sx={{ fontSize: '22px' }} />
                </Avatar>
              ) : (
                <Skeleton variant="circular" width={40} height={40} />
              )}
            </ListItemIcon>
            <ListItemText primary={statistics.users ? 'User accounts' : <Skeleton width={150} />} />
          </ListItem>
        </List>
      )
    },
    {
      key: 'most-viewed-locations',
      label: 'Most Viewed Locations',
      content: (
        <>
          {statistics.mostViewedLocations && statistics.mostViewedLocations.length === 0 && (
            <Typography color="text.secondary">
              Not enough view data yet to display the most viewed locations.
            </Typography>
          )}

          {statistics.mostViewedLocations && statistics.mostViewedLocations.length > 0 && (
            <>
              <Typography color="text.secondary" sx={{ paddingBottom: '12px' }}>
                Only the top 5 most viewed locations are displayed.
              </Typography>

              <List disablePadding>
                {statistics.mostViewedLocations.map(location => {
                  const type = LOCATION_TYPES.find(type => type.key === location.type);

                  return (
                    <ListItem
                      disableGutters
                      key={location._id}
                      secondaryAction={
                        <>
                          <Chip label={location.viewCount} color="secondary" />

                          <IconButton
                            title="Options"
                            sx={{ marginRight: '-8px' }}
                            onClick={e => {
                              setMenuAnchorElement(e.currentTarget);
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
                      <ListItemText primary={location.title} secondary={location.building || EM_DASH} />
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}

          {!statistics.mostViewedLocations && (
            <List disablePadding>
              {Array.from({ length: 5 }, (value, index) => index).map(item => (
                <ListItem disableGutters key={item}>
                  <ListItemIcon>
                    <Skeleton variant="circular" width={40} height={40} />
                  </ListItemIcon>
                  <ListItemText primary={<Skeleton width="50%" />} secondary={<Skeleton />} />
                </ListItem>
              ))}
            </List>
          )}
        </>
      )
    },
    {
      key: 'most-saved-locations',
      label: 'Most Saved Locations',
      content: (
        <>
          {statistics.mostSavedLocations && statistics.mostSavedLocations.length === 0 && (
            <Typography color="text.secondary">
              Not enough save data yet to display the most saved locations.
            </Typography>
          )}

          {statistics.mostSavedLocations && statistics.mostSavedLocations.length > 0 && (
            <>
              <Typography color="text.secondary" sx={{ paddingBottom: '12px' }}>
                Only the top 5 most saved locations are displayed.
              </Typography>

              <List disablePadding>
                {statistics.mostSavedLocations.map(location => {
                  const type = LOCATION_TYPES.find(type => type.key === location.type);

                  return (
                    <ListItem
                      disableGutters
                      key={location._id}
                      secondaryAction={
                        <>
                          <Chip label={location.count} color="secondary" />

                          <IconButton
                            title="Options"
                            sx={{ marginRight: '-8px' }}
                            onClick={e => {
                              setMenuAnchorElement(e.currentTarget);
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
                      <ListItemText primary={location.title} secondary={location.building || EM_DASH} />
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}

          {!statistics.mostSavedLocations && (
            <List disablePadding>
              {Array.from({ length: 5 }, (value, index) => index).map(item => (
                <ListItem disableGutters key={item}>
                  <ListItemIcon>
                    <Skeleton variant="circular" width={40} height={40} />
                  </ListItemIcon>
                  <ListItemText primary={<Skeleton width="50%" />} secondary={<Skeleton />} />
                </ListItem>
              ))}
            </List>
          )}
        </>
      )
    },
    {
      key: 'locations-by-type',
      label: 'Locations by Type',
      content: (
        <>
          {statistics.locationsByType && (
            <List disablePadding>
              {LOCATION_TYPES.filter(type => type.isInteractive).map(locationType => (
                <ListItem
                  disableGutters
                  key={locationType.key}
                  secondaryAction={
                    <Chip
                      label={(() => {
                        const locType = statistics.locationsByType.find(type => locationType.key === type.type);
                        return locType ? locType.count : 0;
                      })()}
                      color="secondary"
                    />
                  }
                >
                  <ListItemIcon>
                    <img
                      src={locationType.listIcon}
                      className="location-icon"
                      style={{
                        background: locationType.color,
                        border: `1px solid ${darken(locationType.color, 0.2)}`
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={locationType.label} />
                </ListItem>
              ))}
            </List>
          )}

          {!statistics.locationsByType && (
            <List disablePadding>
              {Array.from(
                { length: LOCATION_TYPES.filter(type => type.isInteractive).length },
                (value, index) => index
              ).map(item => (
                <ListItem disableGutters key={item}>
                  <ListItemIcon>
                    <Skeleton variant="circular" width={40} height={40} />
                  </ListItemIcon>
                  <ListItemText primary={<Skeleton width="50%" />} />
                </ListItem>
              ))}
            </List>
          )}
        </>
      )
    }
  ];

  // dialog states
  const [expandedPanel, setExpandedPanel] = useState(ACCORDIONS[0].key);

  // reset when opened
  useEffect(() => {
    if (open) {
      setMenuAnchorElement(null);
      setMenuLocation(null);
      setExpandedPanel(ACCORDIONS[0].key);

      setStatistics({});

      fetchMetrics();
    }
  }, [open]);

  const handleAccordionChange = panel => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : '');
  };

  const fetchMetrics = async () => {
    const response = await fetch('/api/statistics', {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      setStatistics(json);
    } else {
      showSnackbar('error', json.error);
      onClose();
    }
  };

  const handleCloseMenu = () => {
    setMenuAnchorElement(null);
    setMenuLocation(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          <AnalyticsIcon />
          <Box>Statistics</Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ paddingBottom: '20px' }}>
          These statistics offer a snapshot of overall application usage and user interaction patterns.
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

              <AccordionDetails>{accordion.content}</AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </DialogContent>

      {menuLocation && (
        <Menu
          anchorEl={menuAnchorElement}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          className="disable-top-padding"
          open={Boolean(menuAnchorElement)}
          onClose={handleCloseMenu}
        >
          <ListSubheader>{menuLocation.title}</ListSubheader>

          <MenuItem
            onClick={() => {
              handleCloseMenu();
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
        </Menu>
      )}

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Statistics;
