import { useContext } from 'react';

import { LocationsContext } from '../contexts/LocationsContext';

export const useLocationsContext = () => {
  const context = useContext(LocationsContext);

  if (!context) {
    throw Error('useLocationsContext must be used inside LocationsContextProvider');
  }

  return context;
};
