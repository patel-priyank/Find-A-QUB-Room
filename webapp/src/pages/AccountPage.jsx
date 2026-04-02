import { Container } from '@mui/material';

import Account from '../components/Account.component';

const AccountPage = () => {
  return (
    <Container disableGutters maxWidth={false} className="page-container">
      <Account />
    </Container>
  );
};

export default AccountPage;
