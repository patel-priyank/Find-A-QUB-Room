import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Alert,
  AppBar,
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  darken,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Toolbar,
  Typography
} from '@mui/material';

import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import DirectionsIcon from '@mui/icons-material/Directions';
import DirectionsOffIcon from '@mui/icons-material/DirectionsOff';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import InfoIcon from '@mui/icons-material/Info';
import LayersIcon from '@mui/icons-material/Layers';
import LegendToggleIcon from '@mui/icons-material/LegendToggle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NearMeIcon from '@mui/icons-material/NearMe';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import '@luomus/leaflet-smooth-wheel-zoom';

import AddLocation from './AddLocation.component';
import EditLocation from './EditLocation.component';
import LocationDetails from './LocationDetails.component';
import SnackbarAlert from './SnackbarAlert.component';

import { useSnackbarAlert } from '../hooks/useSnackbarAlert';
import { useAuthContext } from '../hooks/useAuthContext';
import { useLocationsContext } from '../hooks/useLocationsContext';
import { useMapContext } from '../hooks/useMapContext';

import { DEFAULT_COORDINATES, EM_DASH, LOCATION_TYPES, MAP_ZOOM } from '../utils/constants';
import { fetchDistanceAndTime, sleep } from '../utils/functions';

import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet/dist/leaflet.css';

const Map = () => {
  // context
  const { user } = useAuthContext();
  const { locations } = useLocationsContext();
  const { initialMapView, initialLocation, initialRoute, initialUserLocation, dispatch: mapDispatch } = useMapContext();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbarAlert();

  const mapViewsMapTiler = [
    {
      key: 'standard',
      label: 'Standard',
      layer: (
        <TileLayer
          url={`https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
          tileSize={512}
          zoomOffset={-1}
          keepBuffer={4}
          opacity={1.0}
          maxNativeZoom={MAP_ZOOM.maxUI}
          maxZoom={MAP_ZOOM.maxUI}
        />
      )
    },
    {
      key: 'satellite',
      label: 'Satellite',
      layer: (
        <TileLayer
          url={`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
          tileSize={512}
          zoomOffset={-1}
          keepBuffer={4}
          opacity={0.7}
          maxNativeZoom={MAP_ZOOM.maxUI}
          maxZoom={MAP_ZOOM.maxUI}
        />
      )
    }
  ];

  const mapViewsGoogle = [
    {
      key: 'standard',
      label: 'Standard',
      layer: (
        <TileLayer
          url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          attribution='&copy; <a href="https://www.google.com/permissions/geoguidelines/">Google</a>'
          keepBuffer={4}
          maxNativeZoom={MAP_ZOOM.maxUI}
          maxZoom={MAP_ZOOM.maxUI}
        />
      )
    },
    {
      key: 'satellite',
      label: 'Satellite',
      layer: (
        <TileLayer
          url="http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          attribution='&copy; <a href="https://www.google.com/permissions/geoguidelines/">Google</a>'
          keepBuffer={4}
          maxNativeZoom={MAP_ZOOM.maxUI}
          maxZoom={MAP_ZOOM.maxUI}
        />
      )
    }
  ];

  const mapViews = [...mapViewsMapTiler];

  // page states
  const [menuAnchorElement, setMenuAnchorElement] = useState(null); // menu anchor element for app bar
  const [addLocationEnabled, setAddLocationEnabled] = useState(false); // enable add location
  const [viewSuggestedLocationsEnabled, setViewSuggestedLocationsEnabled] = useState(false); // view suggested locations
  const [routePlotted, setRoutePlotted] = useState(false); // flag for checking if route is plotted
  const [drawerLocation, setDrawerLocation] = useState(null); // location for drawer
  const [dialogLocation, setDialogLocation] = useState(null); // location for dialog

  // dialog open states
  const [geolocationErrorDialogOpen, setGeolocationErrorDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [mapViewDialogOpen, setMapViewDialogOpen] = useState(false);
  const [legendDialogOpen, setLegendDialogOpen] = useState(false);
  const [locationDetailsDialogOpen, setLocationDetailsDialogOpen] = useState(false);
  const [editLocationDialogOpen, setEditLocationDialogOpen] = useState(false);
  const [addLocationDialogOpen, setAddLocationDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // map states
  const [mapView, setMapView] = useState(initialMapView ? initialMapView.view : mapViews[0].key); // map view
  const [visibleLocationTypes, setVisibleLocationTypes] = useState(
    initialMapView
      ? initialMapView.visibleTypes
      : Object.fromEntries(LOCATION_TYPES.filter(type => type.isInteractive).map(type => [type.key, true]))
  );
  const [clickedCoordinates, setClickedCoordinates] = useState({ lat: null, lng: null }); // coordinates of clicked point in map
  const [userLocation, setUserLocation] = useState(initialUserLocation ? initialUserLocation : null); // current location of user
  const [routeOrigin, setRouteOrigin] = useState(null); // origin for plotting route
  const [routeDestination, setRouteDestination] = useState(null); // destination for plotting route

  // data states
  const [suggestedLocations, setSuggestedLocations] = useState(null); // suggested locations

  // references
  const mapRef = useRef(null); // map reference
  const markerRefs = useRef({}); // references for markers
  const routeControlRef = useRef(null); // route control reference
  const flyToRouteBoundsRef = useRef(true); // flag for flying to plotted route bounds
  const watchLocationIdRef = useRef(null); // flag for watching location
  const mapViewRef = useRef(mapView); // map view reference for when unmounting
  const userLocationRef = useRef(null); // user location reference when unmounting
  const visibleLocationTypesRef = useRef(visibleLocationTypes); // visible location types reference for when unmounting
  const drawerOpenedRef = useRef(false); // to check if drawer is opened at least once
  const suggestedLocationsControllerRef = useRef(null); // for aborting fetchSuggestedLocations

  // on component mount
  useEffect(() => {
    // start watching current location
    watchCurrentLocation();

    // show info about no locations
    if (locations.length === 0) {
      showSnackbar('warning', 'There are no locations to show at the moment. They will appear here once added.');
    }

    // programmatically click on marker if navigated from another page
    if (initialLocation) {
      setTimeout(async () => {
        const marker = markerRefs.current[initialLocation];

        if (marker) {
          if (initialRoute) {
            plotRoute([marker._latlng.lat, marker._latlng.lng]);
          } else {
            mapRef.current.setZoom(MAP_ZOOM.default);
            await sleep(15);
            marker.fire?.('click');
          }
        }
      }, 15);
    }

    // cleanup on component unmount
    return () => {
      // clear geolocation watcher if active
      if (watchLocationIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchLocationIdRef.current);
        watchLocationIdRef.current = null;
      }

      if (mapRef.current !== null) {
        const center = mapRef.current.getCenter();

        // set map view
        mapDispatch({
          type: 'SET_MAP_VIEW',
          payload: {
            center: [center.lat, center.lng],
            zoom: mapRef.current.getZoom(),
            view: mapViewRef.current,
            visibleTypes: visibleLocationTypesRef.current
          }
        });

        // set user location
        mapDispatch({
          type: 'SET_USER_LOCATION',
          payload: userLocationRef.current
        });
      }
    };
  }, []);

  // set map view on component mount
  useEffect(() => {
    setMapView(initialMapView ? initialMapView.view : mapViews[0].key);
  }, [initialMapView]);

  // update reference when map view changes
  useEffect(() => {
    mapViewRef.current = mapView;
  }, [mapView]);

  // update reference when user location changes
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // update reference when visible location types filter changes
  useEffect(() => {
    visibleLocationTypesRef.current = visibleLocationTypes;
  }, [visibleLocationTypes]);

  // clear fly to route bounds when dialog is opened
  useEffect(() => {
    if (legendDialogOpen || filterDialogOpen || mapViewDialogOpen) {
      flyToRouteBoundsRef.current = false;
    }
  }, [legendDialogOpen, filterDialogOpen, mapViewDialogOpen]);

  // close snackbar when dialog is opened
  useEffect(() => {
    if (
      legendDialogOpen ||
      geolocationErrorDialogOpen ||
      filterDialogOpen ||
      mapViewDialogOpen ||
      locationDetailsDialogOpen ||
      editLocationDialogOpen ||
      addLocationDialogOpen ||
      drawerOpen
    ) {
      hideSnackbar();
    }
  }, [
    legendDialogOpen,
    geolocationErrorDialogOpen,
    filterDialogOpen,
    mapViewDialogOpen,
    locationDetailsDialogOpen,
    editLocationDialogOpen,
    addLocationDialogOpen,
    drawerOpen
  ]);

  // stop watching location when dialog is opened and start watching again when closed
  useEffect(() => {
    if (
      legendDialogOpen ||
      geolocationErrorDialogOpen ||
      filterDialogOpen ||
      mapViewDialogOpen ||
      locationDetailsDialogOpen ||
      editLocationDialogOpen ||
      addLocationDialogOpen ||
      drawerOpen
    ) {
      if (watchLocationIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchLocationIdRef.current);
        watchLocationIdRef.current = null;
      }
    } else {
      watchCurrentLocation();
    }
  }, [
    legendDialogOpen,
    geolocationErrorDialogOpen,
    filterDialogOpen,
    mapViewDialogOpen,
    locationDetailsDialogOpen,
    editLocationDialogOpen,
    addLocationDialogOpen,
    drawerOpen
  ]);

  // update reference when opening drawer programmatically
  useEffect(() => {
    if (
      legendDialogOpen ||
      geolocationErrorDialogOpen ||
      filterDialogOpen ||
      mapViewDialogOpen ||
      locationDetailsDialogOpen ||
      editLocationDialogOpen ||
      addLocationDialogOpen ||
      drawerOpen
    ) {
      drawerOpenedRef.current = true;
    }

    // if drawer opened at least once and then closed, clear initialLocation
    if (drawerOpenedRef.current && !drawerOpen) {
      mapDispatch({
        type: 'SET_LOCATION',
        payload: null
      });
    }
  }, [
    legendDialogOpen,
    geolocationErrorDialogOpen,
    filterDialogOpen,
    mapViewDialogOpen,
    locationDetailsDialogOpen,
    editLocationDialogOpen,
    addLocationDialogOpen,
    drawerOpen
  ]);

  // open add location dialog when mode is enabled and user clicks on map
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.off('click', getCoordinates);
      mapRef.current.getContainer().classList.remove('location-add-enabled');

      if (addLocationEnabled) {
        mapRef.current.on('click', getCoordinates);
        mapRef.current.getContainer().classList.add('location-add-enabled');
      }
    }
  }, [addLocationEnabled]);

  // show plotted route
  useEffect(() => {
    if (!routeOrigin || !routeDestination || !mapRef.current) return;

    // remove route if already exists
    if (routeControlRef.current) {
      routeControlRef.current.remove();
      routeControlRef.current = null;
    }

    // configure route markers
    const routeMarker = (waypoint, icon, text) =>
      L.marker(waypoint.latLng, { icon }).bindPopup(text, {
        className: 'marker-popup',
        closeButton: false
      });

    const routeControl = L.Routing.control({
      waypoints: [routeOrigin, routeDestination],
      createMarker: (i, wp, n) => {
        if (i === 0) return routeMarker(wp, getMarkerIcon('origin'), 'Origin');
        if (i === n - 1) return routeMarker(wp, getMarkerIcon('destination'), 'Destination');
        return null;
      },
      lineOptions: {
        addWaypoints: false, // disable route line dragging
        styles: [
          { color: '#fcfcfc', weight: 8 },
          { color: '#ff305a', weight: 6 }
        ]
      },
      router: new L.Routing.OSRMv1({
        profile: 'walking',
        serviceUrl: import.meta.env.VITE_OSRM_BASE_URL
      })
    });

    // set route control reference
    routeControlRef.current = routeControl;
    routeControl.addTo(mapRef.current);

    // fly to bounds when route is plotted
    routeControl.on('routesfound', event => {
      if (flyToRouteBoundsRef.current) {
        mapRef.current.flyToBounds(
          L.latLngBounds(event.routes[0].coordinates),
          window.innerWidth < 600
            ? {
                paddingTopLeft: [0, window.innerHeight * 0.125],
                paddingBottomRight: [0, window.innerHeight * 0.125]
              }
            : {
                paddingTopLeft: [0, window.innerHeight * 0.0625],
                paddingBottomRight: [0, window.innerHeight * 0.0625]
              }
        );
      }
    });
  }, [routeOrigin, routeDestination]);

  // get marker icon
  const getMarkerIcon = (type, selected = false) => {
    const DEFAULT_MARKER_SIZE = 36;

    const locationType = LOCATION_TYPES.find(lt => lt.key === type);
    const size = selected ? 1.5 * DEFAULT_MARKER_SIZE : DEFAULT_MARKER_SIZE; // change size if selected

    if (locationType) {
      return L.divIcon({
        iconUrl: locationType.markerIcon,
        className: `map-marker ${selected ? 'selected' : ''}`,
        html: `<div class="map-marker-content ${locationType.key}"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size]
      });
    }

    return null;
  };

  // fetch suggested locations to display on map
  const fetchSuggestedLocations = async () => {
    // abort previous request
    if (suggestedLocationsControllerRef.current) {
      suggestedLocationsControllerRef.current.abort();
    }

    suggestedLocationsControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/locations/suggested', {
        headers: {
          Authorization: `Bearer ${user.token}`
        },
        signal: suggestedLocationsControllerRef.current.signal
      });

      const json = await response.json();

      if (response.ok) {
        setSuggestedLocations(json);

        if (json.length === 0) {
          showSnackbar('warning', 'There are no suggested locations to show.');
          setViewSuggestedLocationsEnabled(false);
          setSuggestedLocations(null);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    }
  };

  // get rounded value for clicked coordinates
  const getRoundedValue = val => {
    const precision = 7;
    return Math.round((val + Number.EPSILON) * Math.pow(10, precision)) / Math.pow(10, precision);
  };

  // get coordinates when user clicks on map and open add location dialog
  const getCoordinates = useCallback(e => {
    setClickedCoordinates({ lat: getRoundedValue(e.latlng.lat), lng: getRoundedValue(e.latlng.lng) });
    setAddLocationDialogOpen(true);
  }, []);

  const closeDrawer = async () => {
    setDrawerOpen(false);
    await sleep();
    setDrawerLocation(null);
  };

  const watchCurrentLocation = () => {
    // prevent duplicate watchers
    if (watchLocationIdRef.current !== null) return;

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser.');
      return;
    }

    watchLocationIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
      },
      err => {
        console.error(err);
      }
    );
  };

  const plotRoute = coordinates => {
    // if user location not present, cannot plot route
    if (!userLocation) {
      setGeolocationErrorDialogOpen(true);
      return;
    }

    flyToRouteBoundsRef.current = true; // fly to bounds when plotting route

    setRouteOrigin(userLocation);
    setRouteDestination(coordinates);
    setRoutePlotted(true);

    showSnackbar('info', fetchDistanceAndTime(userLocation, coordinates));
  };

  const clearPlottedRoute = () => {
    if (routeControlRef.current) {
      routeControlRef.current.remove(); // remove reference from map
      routeControlRef.current = null; // clear reference
      setRouteOrigin(null); // clear origin
      setRouteDestination(null); // clear destination
      setRoutePlotted(false); // set route plotted to false
      hideSnackbar(); // hide distance and time info snackbar
    }
  };

  // render tile layer based on selected map view
  const renderTileLayer = layerName => mapViews.find(view => view.key === layerName).layer;

  // sub-component to set map reference
  const MapRefHelper = () => {
    const map = useMap();
    mapRef.current = map;

    // clear fly to route bounds when map is moved
    mapRef.current.on('move', () => {
      flyToRouteBoundsRef.current = false;
    });

    return null;
  };

  // sub-component for geolocation error dialog
  const GeolocationErrorDialog = () => {
    const handleClose = () => setGeolocationErrorDialogOpen(false);

    return (
      <Dialog open={geolocationErrorDialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box className="dialog-title-text-container">
            <GpsNotFixedIcon />
            <Box>Location unavailable</Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            Unable to retrieve your location. It could be due to missing permissions, unsupported browser features, or
            other issues. Without location access, we cannot get your current location, plot routes, or show distances
            and travel times.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // sub-component for legend dialog
  const LegendDialog = () => {
    const handleClose = () => setLegendDialogOpen(false);

    return (
      <Dialog open={legendDialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box className="dialog-title-text-container">
            <LegendToggleIcon />
            <Box>Legend</Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ marginBottom: '16px' }}>
            Each icon corresponds to a different location type. Use this legend as a reference.
          </DialogContentText>

          <List disablePadding>
            {LOCATION_TYPES.map(type => (
              <ListItem disableGutters key={type.key}>
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
                <ListItemText primary={type.label} />
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // sub-component for legend button
  const LegendButton = () => {
    const handleClick = () => setLegendDialogOpen(true);

    return (
      <button onClick={handleClick} className="map-control-button" title="Show legend">
        <LegendToggleIcon />
      </button>
    );
  };

  // sub-component for filter dialog
  const FilterDialog = () => {
    // temp state to avoid flickering
    const [tempVisibleLocationTypes, setTempVisibleLocationTypes] = useState({ ...visibleLocationTypes });

    const [menuAnchorElement, setMenuAnchorElement] = useState(null);
    const [alert, setAlert] = useState(null);

    // reset when opened
    useEffect(() => {
      if (filterDialogOpen) {
        setTempVisibleLocationTypes({ ...visibleLocationTypes });
        setMenuAnchorElement(null);
        setAlert(null);
      }
    }, [filterDialogOpen]);

    const handleChange = locationType => {
      setAlert(null);
      setTempVisibleLocationTypes(locationTypes => ({
        ...locationTypes,
        [locationType]: !locationTypes[locationType]
      }));
    };

    const handleClose = () => setFilterDialogOpen(false);

    const handleSave = () => {
      if (Object.keys(tempVisibleLocationTypes).every(type => !tempVisibleLocationTypes[type])) {
        setAlert({ severity: 'warning', message: 'At least one location type needs to selected.' });
        return;
      }

      setVisibleLocationTypes({ ...tempVisibleLocationTypes });
      setFilterDialogOpen(false);
    };

    return (
      <Dialog open={filterDialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box className="dialog-title-text-container">
            <FilterAltIcon />
            <Box>Filter location types</Box>
          </Box>

          <IconButton
            title="Options"
            onClick={e => {
              setAlert(null);
              setMenuAnchorElement(e.currentTarget);
            }}
            sx={{ alignSelf: 'flex-start', marginRight: '-8px' }}
          >
            <MoreVertIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
          <DialogContentText sx={{ marginBottom: '16px' }}>
            Select which types of locations you want to display on the map. Unchecking a type will hide those locations.
          </DialogContentText>

          <FormGroup>
            {LOCATION_TYPES.filter(type => type.isInteractive).map(type => (
              <FormControlLabel
                key={type.key}
                control={
                  <Checkbox checked={tempVisibleLocationTypes[type.key]} onChange={() => handleChange(type.key)} />
                }
                label={type.label}
              />
            ))}
          </FormGroup>
        </DialogContent>

        {alert && (
          <DialogContent className="alert-container">
            <Alert severity={alert.severity}>{alert.message}</Alert>
          </DialogContent>
        )}

        <Menu
          anchorEl={menuAnchorElement}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={Boolean(menuAnchorElement)}
          onClose={() => setMenuAnchorElement(null)}
        >
          <MenuItem
            disabled={Object.values(tempVisibleLocationTypes).every(value => value === true)}
            onClick={() => {
              setMenuAnchorElement(null);
              setTempVisibleLocationTypes(
                Object.fromEntries(Object.keys(tempVisibleLocationTypes).map(key => [key, true]))
              );
            }}
          >
            <ListItemIcon>
              <PlaylistAddCheckIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Select all" />
          </MenuItem>
        </Menu>

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

  // sub-component for filter button
  const FilterButton = () => {
    const handleClick = () => setFilterDialogOpen(true);

    return (
      <button onClick={handleClick} className="map-control-button" title="Filter location types">
        <FilterAltIcon />
      </button>
    );
  };

  // sub-component for map view dialog
  const MapViewDialog = () => {
    const handleChange = async event => {
      setMapView(event.target.value);
      setMapViewDialogOpen(false);

      // change zoom level for triggering tile layer refresh
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.setZoom(MAP_ZOOM.minLeaflet);
      await sleep(15);
      mapRef.current.setZoom(currentZoom);
    };

    const handleClose = () => setMapViewDialogOpen(false);

    return (
      <Dialog open={mapViewDialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box className="dialog-title-text-container">
            <LayersIcon />
            <Box>Map view</Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ marginBottom: '16px' }}>
            Select a map style that best suits your preference or use case.
          </DialogContentText>

          <RadioGroup onChange={handleChange}>
            {mapViews.map(view => (
              <FormControlLabel
                key={view.key}
                value={view.key}
                control={<Radio checked={view.key === mapView} />}
                label={view.label}
                onClick={() => {
                  if (view.key === mapView) {
                    handleClose();
                  }
                }}
              />
            ))}
          </RadioGroup>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // sub-component for map view button
  const MapViewButton = () => {
    const handleClick = () => setMapViewDialogOpen(true);

    return (
      <button onClick={handleClick} className="map-control-button" title="Change map view">
        <LayersIcon />
      </button>
    );
  };

  // sub-component for locate button
  const LocateButton = () => {
    const handleClick = () => {
      if (!userLocation) {
        setGeolocationErrorDialogOpen(true);
        return;
      }

      flyToRouteBoundsRef.current = false; // clear fly to route bounds when moving to current location
      mapRef.current.flyTo(userLocation, MAP_ZOOM.default);
    };

    return (
      <button onClick={handleClick} className="map-control-button" title="Go to current location">
        {userLocation ? <GpsFixedIcon /> : <GpsNotFixedIcon />}
      </button>
    );
  };

  // sub-component for clear route button
  const ClearRouteButton = () => {
    // show only if route is plotted
    if (routePlotted) {
      return (
        <button onClick={clearPlottedRoute} className="map-control-button" title="Clear plotted route">
          <DirectionsOffIcon />
        </button>
      );
    }

    return null;
  };

  return (
    <>
      {/* background styles for marker icons */}
      <style>
        {`
          ${LOCATION_TYPES.map(
            type => `.map-marker-content.${type.key} {
              background-image: url(${type.markerIcon});
            }`
          ).join('\n')}
        `}
      </style>

      <AppBar>
        <Toolbar>
          <Typography noWrap variant="h6" component="div">
            Map
          </Typography>

          {!addLocationEnabled && !viewSuggestedLocationsEnabled && (
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

        {user && (addLocationEnabled || viewSuggestedLocationsEnabled) && (
          <Toolbar className="secondary-toolbar">
            {addLocationEnabled && (
              <Typography noWrap variant="body2">
                {user.isAdmin ? 'Adding location' : 'Suggesting location'}
              </Typography>
            )}

            {viewSuggestedLocationsEnabled && (
              <Typography noWrap variant="body2">
                Viewing suggested locations
              </Typography>
            )}

            <Button
              color="inherit"
              size="small"
              onClick={() => {
                hideSnackbar();

                // clear states for adding location or viewing suggested locations
                setAddLocationEnabled(false);
                setClickedCoordinates({ lat: null, lng: null });
                setViewSuggestedLocationsEnabled(false);
                setSuggestedLocations(null);

                if (suggestedLocationsControllerRef.current) {
                  suggestedLocationsControllerRef.current.abort();
                }
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
              showSnackbar('warning', 'You need to sign in to suggest locations.');
            }}
          >
            <ListItemIcon>
              <AddLocationAltIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Suggest location" />
          </MenuItem>
        )}

        {user && (
          <MenuItem
            onClick={() => {
              setMenuAnchorElement(null);
              clearPlottedRoute();
              setAddLocationEnabled(true);
              showSnackbar(
                'info',
                user.isAdmin
                  ? 'Click anywhere on the map to add a location.'
                  : 'Click anywhere on the map to suggest a location.'
              );
            }}
          >
            <ListItemIcon>
              <AddLocationAltIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={user.isAdmin ? 'Add location' : 'Suggest location'} />
          </MenuItem>
        )}

        {user && user.isAdmin && (
          <MenuItem
            onClick={async () => {
              hideSnackbar();
              setMenuAnchorElement(null);
              clearPlottedRoute();
              setViewSuggestedLocationsEnabled(true);
              await fetchSuggestedLocations();
            }}
          >
            <ListItemIcon>
              <FmdGoodOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="View suggested locations" />
          </MenuItem>
        )}
      </Menu>

      <Box
        className="page-contents-container"
        sx={{ marginTop: addLocationEnabled || viewSuggestedLocationsEnabled ? '40px' : '' }}
      >
        <MapContainer
          center={initialMapView ? initialMapView.center : [DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lng]}
          minZoom={MAP_ZOOM.minUI}
          maxZoom={MAP_ZOOM.maxUI}
          zoom={initialMapView ? initialMapView.zoom : MAP_ZOOM.default}
          zoomControl={false}
          scrollWheelZoom={false}
          smoothWheelZoom={true}
          smoothSensitivity={1}
          fadeAnimation={true}
          style={{ height: '100%' }}
        >
          <MapRefHelper />

          <Box className="map-controls">
            {!addLocationEnabled && (
              <>
                <LegendButton />
                <FilterButton />
                <MapViewButton />
              </>
            )}

            {!addLocationEnabled && !viewSuggestedLocationsEnabled && <LocateButton />}

            <ClearRouteButton />
          </Box>

          <LegendDialog />
          <FilterDialog />
          <MapViewDialog />
          <GeolocationErrorDialog />

          <AddLocation
            open={addLocationDialogOpen}
            onClose={() => {
              setAddLocationDialogOpen(false);
            }}
            locationLat={clickedCoordinates.lat}
            locationLng={clickedCoordinates.lng}
            showSnackbar={showSnackbar}
          />

          <LocationDetails
            open={locationDetailsDialogOpen}
            onClose={async param => {
              const locationId = param ? (param.nativeEvent ? undefined : param) : undefined;

              if (locationId !== undefined && viewSuggestedLocationsEnabled && suggestedLocations) {
                setSuggestedLocations(suggestedLocations.filter(loc => loc._id !== locationId));
              }

              setLocationDetailsDialogOpen(false);
              await sleep();
              setDialogLocation(null);
            }}
            selectedLocation={dialogLocation}
            showSnackbar={showSnackbar}
            setEditLocationDialogOpen={setEditLocationDialogOpen}
            setDialogLocation={setDialogLocation}
            plotRoute={plotRoute}
          />

          <EditLocation
            open={editLocationDialogOpen}
            onClose={async param => {
              const locationId = param ? (param.nativeEvent ? undefined : param) : undefined;

              if (locationId !== undefined && viewSuggestedLocationsEnabled && suggestedLocations) {
                setSuggestedLocations(suggestedLocations.filter(loc => loc._id !== locationId));
              }

              setEditLocationDialogOpen(false);
              await sleep();
              setDialogLocation(null);
            }}
            location={dialogLocation}
            showSnackbar={showSnackbar}
          />

          {renderTileLayer(mapView)}

          {!routePlotted &&
            (viewSuggestedLocationsEnabled ? suggestedLocations || [] : addLocationEnabled ? [] : locations)
              .filter(
                location => visibleLocationTypes[location.type] || (initialLocation && initialLocation === location._id)
              )
              .map(location => (
                <Marker
                  key={location._id}
                  position={location.coordinates}
                  icon={
                    drawerLocation && drawerLocation._id === location._id
                      ? getMarkerIcon(location.type, true)
                      : getMarkerIcon(location.type)
                  }
                  opacity={drawerLocation && drawerLocation._id !== location._id ? 0.25 : 1}
                  zIndexOffset={drawerLocation && drawerLocation._id === location._id ? 15000 : ''}
                  keyboard={false}
                  ref={ref => {
                    if (ref) {
                      markerRefs.current[location._id] = ref;
                    }
                  }}
                  eventHandlers={{
                    popupopen: async function () {
                      // close popup immediately
                      this.closePopup();

                      // more left padding to accommodate drawer in desktop view
                      const desktopPaddingConfig = {
                        paddingTopLeft: [600, 0],
                        paddingBottomRight: [0, 0]
                      };

                      // zoom out slightly
                      mapRef.current.flyToBounds([location.coordinates], {
                        maxZoom: mapRef.current.getZoom() - 0.0005,
                        duration: 0.225,
                        ...(window.innerWidth < 600 ? {} : desktopPaddingConfig)
                      });

                      await sleep();

                      // zoom in slightly to reach zoom level before zooming out
                      mapRef.current.flyToBounds([location.coordinates], {
                        maxZoom: mapRef.current.getZoom() + 0.0005,
                        duration: 0.225,
                        ...(window.innerWidth < 600 ? {} : desktopPaddingConfig)
                      });

                      // set location for drawer and open
                      setDrawerLocation(location);
                      setDrawerOpen(true);
                    }
                  }}
                >
                  <Popup></Popup>
                </Marker>
              ))}

          {/* marker for current location */}
          {!addLocationEnabled && !viewSuggestedLocationsEnabled && userLocation && (
            <Marker
              position={userLocation}
              icon={getMarkerIcon('currentLocation')}
              keyboard={false}
              zIndexOffset={10000}
            >
              <Popup className="marker-popup" closeButton={false}>
                You are here
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </Box>

      <Drawer anchor="bottom" open={drawerOpen} onClose={closeDrawer} className="map-drawer-container">
        <Box className="map-drawer">
          {drawerLocation && (
            <>
              <Box className="map-drawer-title-container">
                {(() => {
                  const type = LOCATION_TYPES.find(type => type.key === drawerLocation.type);

                  return (
                    <img
                      src={type.listIcon}
                      className="location-icon"
                      style={{
                        background: type.color,
                        border: `1px solid ${darken(type.color, 0.2)}`
                      }}
                    />
                  );
                })()}

                <Box className="map-drawer-title">
                  <Typography variant="h6">{drawerLocation.title}</Typography>
                  <Typography color="text.secondary">{drawerLocation.building || EM_DASH}</Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                disableElevation
                startIcon={<InfoIcon />}
                onClick={async () => {
                  closeDrawer();
                  await sleep();
                  setLocationDetailsDialogOpen(true);
                  setDialogLocation(drawerLocation);
                }}
              >
                View details
              </Button>

              {viewSuggestedLocationsEnabled && (
                <Alert severity="warning" variant="outlined">
                  This location was suggested by a user and is visible only to admins until it's approved.
                </Alert>
              )}

              {!viewSuggestedLocationsEnabled && (
                <Box className="map-drawer-action">
                  <Typography color="text.secondary">
                    Plot a walking route from your current location to this place. It will appear directly on the map
                    for easy reference.
                  </Typography>

                  <Button
                    variant="outlined"
                    startIcon={<DirectionsIcon />}
                    onClick={async () => {
                      closeDrawer();
                      await sleep();
                      plotRoute(drawerLocation.coordinates);
                    }}
                  >
                    Plot route
                  </Button>
                </Box>
              )}

              {!viewSuggestedLocationsEnabled && (
                <Box className="map-drawer-action">
                  <Typography color="text.secondary">
                    Navigate with Google Maps to adjust arrival or departure times, view real-time traffic, and explore
                    alternative routes.
                  </Typography>

                  <Button
                    variant="outlined"
                    startIcon={<NearMeIcon />}
                    onClick={() => {
                      closeDrawer();
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${drawerLocation.coordinates}`);
                    }}
                  >
                    Navigate
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Drawer>

      <Backdrop className="map-backdrop" open={viewSuggestedLocationsEnabled && !suggestedLocations}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <SnackbarAlert snackbar={snackbar} handleSnackbarClose={hideSnackbar} />
    </>
  );
};

export default Map;
