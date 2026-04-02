import { Container } from '@mui/material';

import Map from '../components/Map.component';

const MapPage = () => {
  return (
    <Container disableGutters maxWidth={false} className="page-container">
      <Map />
    </Container>
  );
};

export default MapPage;
