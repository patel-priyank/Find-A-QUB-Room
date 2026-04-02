import { useContext } from 'react';

import { MapContext } from '../contexts/MapContext';

export const useMapContext = () => {
  const context = useContext(MapContext);

  if (!context) {
    throw Error('useMapContext must be used inside an MapContextProvider');
  }

  return context;
};
