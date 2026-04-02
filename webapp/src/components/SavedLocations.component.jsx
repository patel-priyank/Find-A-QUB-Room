import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
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

import AddCircleIcon from '@mui/icons-material/AddCircle';
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SearchIcon from '@mui/icons-material/Search';

import Switch from './Switch.component';

import { useAuthContext } from '../hooks/useAuthContext';
import { useMapContext } from '../hooks/useMapContext';

import { EM_DASH, LOCATION_TYPES } from '../utils/constants';
import { highlightMatch } from '../utils/functions';

const SavedLocations = ({ open, onClose, showSnackbar }) => {
  const navigate = useNavigate();

  // context
  const { user } = useAuthContext();
  const { dispatch: mapDispatch } = useMapContext();

  // dialog states
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [filtersVisibility, setFiltersVisibility] = useState(false);
  const [menuAnchorElement, setMenuAnchorElement] = useState(null);
  const [menuLocation, setMenuLocation] = useState(null);
  const [visibleTypes, setVisibleTypes] = useState(
    Object.fromEntries(LOCATION_TYPES.filter(type => type.isInteractive).map(type => [type.key, true]))
  );

  // field states
  const [searchQuery, setSearchQuery] = useState('');

  // data states
  const [savedLocations, setSavedLocations] = useState(null);

  // reset when opened
  useEffect(() => {
    if (open) {
      setLoading(false);
      setAlert(null);
      setFiltersVisibility(false);
      setMenuAnchorElement(null);
      setMenuLocation(null);
      setVisibleTypes(
        Object.fromEntries(LOCATION_TYPES.filter(type => type.isInteractive).map(type => [type.key, true]))
      );

      setSearchQuery('');

      setSavedLocations(null);

      fetchSavedLocations();
    }
  }, [open]);

  const fetchSavedLocations = async () => {
    const response = await fetch('/api/user/saved-locations', {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      handleCloseMenu(); // close menu
      setSavedLocations(json); // set/overwrite saved locations
      setLoading(false); // clear loading (after overwriting)
    } else {
      showSnackbar('error', json.error);
      onClose();
    }
  };

  const unsaveLocation = async id => {
    setLoading(true);
    setAlert(null);

    handleCloseMenu();

    const response = await fetch(`/api/user/saved-locations/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (!response.ok) {
      setLoading(false);
      setAlert({ severity: 'error', message: json.error });
      return;
    }

    // fetch and overwrite if dialog is open
    if (open) {
      fetchSavedLocations();
    }
  };

  const matchesSearch = location => {
    const query = searchQuery.toLowerCase().trim();
    return location.title.toLowerCase().includes(query) || location.building.toLowerCase().includes(query);
  };

  const handleCloseMenu = () => {
    setMenuAnchorElement(null);
    setMenuLocation(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          {loading ? <CircularProgress /> : <BookmarksIcon />}
          <Box>Saved locations</Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
        {savedLocations && savedLocations.length > 0 && (
          <>
            <DialogContentText gutterBottom>
              You've saved these locations for easy access. Locate any in Map to view details.
            </DialogContentText>

            <TextField
              variant="outlined"
              fullWidth
              type="text"
              placeholder="Search"
              sx={{ margin: '16px 0' }}
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
                        savedLocations
                          ? `(${savedLocations.filter(l => matchesSearch(l) && l.type === locationType.key).length})`
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

            {savedLocations.filter(location => matchesSearch(location)).length > 0 && (
              <>
                {savedLocations.filter(location => matchesSearch(location) && visibleTypes[location.type]).length >
                0 ? (
                  <List disablePadding>
                    {savedLocations
                      .filter(location => matchesSearch(location) && visibleTypes[location.type])
                      .map(location => {
                        const type = LOCATION_TYPES.find(type => type.key === location.type);

                        return (
                          <ListItem
                            disableGutters
                            key={location._id}
                            secondaryAction={
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
                              secondary={location.building ? highlightMatch(location.building, searchQuery) : EM_DASH}
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

            {savedLocations.filter(location => matchesSearch(location)).length === 0 && (
              <Typography color="text.primary">No saved locations match your search.</Typography>
            )}
          </>
        )}

        {savedLocations && savedLocations.length === 0 && (
          <DialogContentText>
            You haven't saved any locations yet. When you save one, it will appear here for quick access.
          </DialogContentText>
        )}

        {!savedLocations && (
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
            disabled={loading}
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

          <MenuItem disabled={loading} onClick={() => unsaveLocation(menuLocation._id)}>
            <ListItemIcon>
              <BookmarkRemoveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Unsave" />
          </MenuItem>
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

export default SavedLocations;
