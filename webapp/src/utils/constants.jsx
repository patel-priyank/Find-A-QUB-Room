export const DEFAULT_COORDINATES = {
  lat: 54.584609,
  lng: -5.936428
};

export const MAP_ZOOM = {
  default: 16,
  minLeaflet: 0,
  maxLeaflet: 21,
  minUI: 9, // needs to be higher than minLeaflet for tile rerendering
  maxUI: 21
};

export const LOCATION_TYPES = [
  {
    key: 'currentLocation', // for actions
    label: 'Current Location', // for legend
    markerIcon: '../../src/assets/icons/marker/currentLocation.png',
    listIcon: '../../src/assets/icons/list/currentLocation.png',
    color: '#6ab7ff', // background color for list icons and text
    isInteractive: false, // show in map filter and allow adding
    allowEvents: false // allow adding events
  },
  {
    key: 'room',
    label: 'Venue',
    markerIcon: '../../src/assets/icons/marker/room.png',
    listIcon: '../../src/assets/icons/list/room.png',
    color: '#ff9095',
    isInteractive: true,
    allowEvents: true
  },
  {
    key: 'toilet',
    label: 'Toilet',
    markerIcon: '../../src/assets/icons/marker/toilet.png',
    listIcon: '../../src/assets/icons/list/toilet.png',
    color: '#fff788',
    isInteractive: true,
    allowEvents: false
  },
  {
    key: 'refreshment',
    label: 'Food and Drink',
    markerIcon: '../../src/assets/icons/marker/refreshment.png',
    listIcon: '../../src/assets/icons/list/refreshment.png',
    color: '#4dffa9',
    isInteractive: true,
    allowEvents: true
  },
  {
    key: 'attraction',
    label: 'Point of Interest',
    markerIcon: '../../src/assets/icons/marker/attraction.png',
    listIcon: '../../src/assets/icons/list/attraction.png',
    color: '#d9a5ff',
    isInteractive: true,
    allowEvents: true
  },
  {
    key: 'origin',
    label: 'Origin (for plotted route)',
    markerIcon: '../../src/assets/icons/marker/origin.png',
    listIcon: '../../src/assets/icons/list/origin.png',
    color: '#ff8766',
    isInteractive: false,
    allowEvents: false
  },
  {
    key: 'destination',
    label: 'Destination (for plotted route)',
    markerIcon: '../../src/assets/icons/marker/destination.png',
    listIcon: '../../src/assets/icons/list/destination.png',
    color: '#ff73c9',
    isInteractive: false,
    allowEvents: false
  }
];

export const ACCESSIBILITY_VALUES = [{ unknown: 'Unknown' }, { yes: 'Yes' }, { no: 'No' }];

export const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

export const EM_DASH = '—';
