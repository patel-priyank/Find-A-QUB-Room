import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  AppBar,
  Box,
  Chip,
  Container,
  darken,
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
  TextField,
  Toolbar,
  Typography
} from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import MapIcon from '@mui/icons-material/Map';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SearchIcon from '@mui/icons-material/Search';

import EditLocation from './EditLocation.component';
import LocationDetails from './LocationDetails.component';
import SnackbarAlert from './SnackbarAlert.component';
import Switch from './Switch.component';

import { useSnackbarAlert } from '../hooks/useSnackbarAlert';
import { useLocationsContext } from '../hooks/useLocationsContext';
import { useMapContext } from '../hooks/useMapContext';

import { EM_DASH, LOCATION_TYPES } from '../utils/constants';
import { highlightMatch, sleep } from '../utils/functions';

const Search = () => {
  const navigate = useNavigate();

  // context
  const { locations } = useLocationsContext();
  const { dispatch: mapDispatch } = useMapContext();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbarAlert();

  // page states
  const [menuAnchorElement, setMenuAnchorElement] = useState(null);
  const [menuLocation, setMenuLocation] = useState(null);
  const [filtersVisibility, setFiltersVisibility] = useState(false);
  const [dialogLocation, setDialogLocation] = useState(null);
  const [visibleTypes, setVisibleTypes] = useState(
    Object.fromEntries(LOCATION_TYPES.filter(type => type.isInteractive).map(type => [type.key, true]))
  );
  const [searchContainerHeight, setSearchContainerHeight] = useState(0);

  // field states
  const [searchQuery, setSearchQuery] = useState('');

  // dialog open states
  const [locationDetailsDialogOpen, setLocationDetailsDialogOpen] = useState(false);
  const [editLocationDialogOpen, setEditLocationDialogOpen] = useState(false);

  // references
  const searchContainerRef = useRef(null); // for adjusting results container height

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
    if (locationDetailsDialogOpen || editLocationDialogOpen) {
      hideSnackbar();
    }
  }, [locationDetailsDialogOpen, editLocationDialogOpen]);

  const matchesSearch = location => {
    const query = searchQuery.toLowerCase().trim();
    return location.title.toLowerCase().includes(query) || location.building.toLowerCase().includes(query);
  };

  const handleCloseMenu = () => {
    setMenuAnchorElement(null);
    setMenuLocation(null);
  };

  return (
    <>
      <AppBar>
        <Toolbar>
          <Typography noWrap variant="h6" component="div">
            Search
          </Typography>
        </Toolbar>
      </AppBar>

      <LocationDetails
        open={locationDetailsDialogOpen}
        onClose={async () => {
          setLocationDetailsDialogOpen(false);
          await sleep();
          setDialogLocation(null);
        }}
        selectedLocation={dialogLocation}
        showSnackbar={showSnackbar}
        setEditLocationDialogOpen={setEditLocationDialogOpen}
        setDialogLocation={setDialogLocation}
      />

      <EditLocation
        open={editLocationDialogOpen}
        onClose={async () => {
          setEditLocationDialogOpen(false);
          await sleep();
          setDialogLocation(null);
        }}
        location={dialogLocation}
        showSnackbar={showSnackbar}
      />

      <Box className="page-contents-container">
        {locations.length === 0 && (
          <Box className="page-contents">
            <Container className="page-layout" maxWidth="md">
              <Alert severity="warning">
                There are no locations to show at the moment. They will appear here once added.
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
                      {LOCATION_TYPES.filter(type => type.isInteractive).map(type => (
                        <Chip
                          key={type.key}
                          variant="outlined"
                          label={`${type.label} (${
                            locations.filter(l => matchesSearch(l) && l.type === type.key).length
                          })`}
                          deleteIcon={visibleTypes[type.key] ? <RemoveCircleIcon /> : <AddCircleIcon />}
                          sx={{
                            border: `1px solid ${darken(type.color, 0.2)}`,
                            background: visibleTypes[type.key] ? `${type.color}` : ''
                          }}
                          onDelete={() => {
                            setVisibleTypes(types => ({
                              ...types,
                              [type.key]: !types[type.key]
                            }));
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Container>

            <Box
              className="page-contents"
              sx={{
                paddingTop: 0,
                height: `calc(100% - ${searchContainerHeight}px)`
              }}
            >
              <Container className="page-layout" maxWidth="md">
                {locations.filter(location => matchesSearch(location)).length === 0 && (
                  <Typography className="search-message" color="text.primary" sx={{ paddingTop: '8px' }}>
                    No locations match your search.
                  </Typography>
                )}

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
                                  <IconButton
                                    title="Options"
                                    sx={{ marginRight: '-16px' }}
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
                                  secondary={
                                    location.building ? highlightMatch(location.building, searchQuery) : EM_DASH
                                  }
                                />
                              </ListItem>
                            );
                          })}
                      </List>
                    ) : (
                      <Typography className="search-message" color="text.primary" sx={{ paddingTop: '8px' }}>
                        Some locations are not shown due to current filters. Modify the filters to see them.
                      </Typography>
                    )}
                  </>
                )}
              </Container>
            </Box>
          </>
        )}

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

            <MenuItem
              onClick={() => {
                handleCloseMenu();
                setDialogLocation(menuLocation);
                setLocationDetailsDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <InfoIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="View details" />
            </MenuItem>
          </Menu>
        )}
      </Box>

      <SnackbarAlert snackbar={snackbar} handleSnackbarClose={hideSnackbar} />
    </>
  );
};

export default Search;
