import { Container } from '@mui/material';

import Events from '../components/Events.component';

const EventsPage = () => {
  return (
    <Container disableGutters maxWidth={false} className="page-container">
      <Events />
    </Container>
  );
};

export default EventsPage;
