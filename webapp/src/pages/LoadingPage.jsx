import { AppBar, Box, Container, LinearProgress, Toolbar, Typography } from '@mui/material';

const LoadingPage = () => {
  return (
    <Container className="app-loader-container">
      <AppBar>
        <Toolbar>
          <Typography noWrap variant="h6" component="div">
            Find a QUB Room
          </Typography>
        </Toolbar>
      </AppBar>

      <Box className="app-loader">
        <img src="/favicon.png" width={100} />

        <Typography variant="h6" color="text.primary">
          Find a QUB Room
        </Typography>

        <LinearProgress sx={{ width: '150px' }} />
      </Box>
    </Container>
  );
};

export default LoadingPage;
