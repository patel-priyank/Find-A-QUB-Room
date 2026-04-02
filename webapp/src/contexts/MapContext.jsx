import { createContext, useReducer } from 'react';

export const MapContext = createContext();

export const mapReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MAP_VIEW':
      return {
        initialMapView: {
          center: action.payload.center,
          zoom: action.payload.zoom,
          view: action.payload.view,
          visibleTypes: action.payload.visibleTypes
        },
        initialLocation: state.initialLocation,
        initialRoute: state.initialRoute,
        initialUserLocation: state.initialUserLocation
      };

    case 'SET_LOCATION':
      return {
        initialMapView: state.initialMapView,
        initialLocation: action.payload,
        initialRoute: false,
        initialUserLocation: state.initialUserLocation
      };

    case 'SET_ROUTE':
      return {
        initialMapView: state.initialMapView,
        initialLocation: action.payload,
        initialRoute: true,
        initialUserLocation: state.initialUserLocation
      };

    case 'SET_USER_LOCATION':
      return {
        initialMapView: state.initialMapView,
        initialLocation: state.initialLocation,
        initialRoute: state.initialRoute,
        initialUserLocation: action.payload
      };

    default:
      return state;
  }
};

export const MapContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(mapReducer, {
    initialMapView: null,
    initialLocation: null,
    initialRoute: null,
    initialUserLocation: null
  });

  return <MapContext.Provider value={{ ...state, dispatch }}>{children}</MapContext.Provider>;
};
