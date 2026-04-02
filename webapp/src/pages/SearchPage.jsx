import { Container } from '@mui/material';

import Search from '../components/Search.component';

const SearchPage = () => {
  return (
    <Container disableGutters maxWidth={false} className="page-container">
      <Search />
    </Container>
  );
};

export default SearchPage;
