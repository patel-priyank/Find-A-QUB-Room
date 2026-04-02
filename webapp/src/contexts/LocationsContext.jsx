import { createContext, useReducer } from 'react';

export const LocationsContext = createContext();

export const locationsReducer = (state, action) => {
  const { _id, title, type, building, coordinates } = action.payload;

  switch (action.type) {
    case 'SET_LOCATIONS':
      return {
        locations: action.payload
      };

    case 'CREATE_LOCATION':
      return {
        locations: [{ _id, title, type, building, coordinates }, ...state.locations].sort(
          (a, b) =>
            a.title.localeCompare(b.title) || a.building.localeCompare(b.building) || a.type.localeCompare(b.type)
        )
      };

    case 'UPDATE_LOCATION':
      return {
        locations: state.locations
          .map(location =>
            location._id === action.payload._id ? { _id, title, type, building, coordinates } : location
          )
          .sort(
            (a, b) =>
              a.title.localeCompare(b.title) || a.building.localeCompare(b.building) || a.type.localeCompare(b.type)
          )
      };

    case 'DELETE_LOCATION':
      return {
        locations: state.locations.filter(location => location._id !== action.payload._id)
      };

    default:
      return state;
  }
};

export const LocationsContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(locationsReducer, {
    locations: []
  });

  return <LocationsContext.Provider value={{ ...state, dispatch }}>{children}</LocationsContext.Provider>;
};
