import { useEffect, useState } from 'react';

import {
  AppBar,
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material';

import AbcIcon from '@mui/icons-material/Abc';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import CommentIcon from '@mui/icons-material/Comment';
import HelpIcon from '@mui/icons-material/Help';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PasswordIcon from '@mui/icons-material/Password';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SecurityIcon from '@mui/icons-material/Security';

import confetti from 'canvas-confetti';

import ChangeName from './ChangeName.component';
import ChangePassword from './ChangePassword.component';
import ConfigureAdmins from './ConfigureAdmins.component';
import LocationFeedback from './LocationFeedback.component';
import Onboarding from './Onboarding.component';
import SavedLocations from './SavedLocations.component';
import SignIn from './SignIn.component';
import SignOut from './SignOut.component';
import SignUp from './SignUp.component';
import SnackbarAlert from './SnackbarAlert.component';
import Statistics from './Statistics.component';

import { useAuthContext } from '../hooks/useAuthContext';
import { useSnackbarAlert } from '../hooks/useSnackbarAlert';

import { sleep } from '../utils/functions';

const Account = () => {
  // context
  const { user } = useAuthContext();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbarAlert();

  // dialog open states
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const [signUpDialogOpen, setSignUpDialogOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [changeNameDialogOpen, setChangeNameDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [savedLocationsDialogOpen, setSavedLocationsDialogOpen] = useState(false);
  const [configureAdminsDialogOpen, setConfigureAdminsDialogOpen] = useState(false);
  const [locationFeedbackDialogOpen, setLocationFeedbackDialogOpen] = useState(false);
  const [statisticsDialogOpen, setStatisticsDialogOpen] = useState(false);
  const [bookRoomDialogOpen, setBookRoomDialogOpen] = useState(false);
  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);

  // close snackbar when dialog is opened
  useEffect(() => {
    if (
      signInDialogOpen ||
      signUpDialogOpen ||
      signOutDialogOpen ||
      changeNameDialogOpen ||
      changePasswordDialogOpen ||
      savedLocationsDialogOpen ||
      configureAdminsDialogOpen ||
      locationFeedbackDialogOpen ||
      statisticsDialogOpen ||
      bookRoomDialogOpen ||
      onboardingDialogOpen
    ) {
      hideSnackbar();
    }
  }, [
    signInDialogOpen,
    signUpDialogOpen,
    signOutDialogOpen,
    changeNameDialogOpen,
    changePasswordDialogOpen,
    savedLocationsDialogOpen,
    configureAdminsDialogOpen,
    locationFeedbackDialogOpen,
    statisticsDialogOpen,
    bookRoomDialogOpen,
    onboardingDialogOpen
  ]);

  // sub-component for book a room confirmation dialog
  const BookRoomDialog = () => {
    const handleContinue = () => {
      setBookRoomDialogOpen(false);
      window.open('https://home.qol.qub.ac.uk/');
    };

    const handleClose = () => setBookRoomDialogOpen(false);

    return (
      <Dialog open={bookRoomDialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box className="dialog-title-text-container">
            <MeetingRoomIcon />
            <Box>Book a room</Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            You will be redirected to Queen's Online in a new tab, where you can sign in with your Queen's credentials
            to book a room.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>

          <Button variant="contained" disableElevation onClick={handleContinue}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <>
      <AppBar>
        <Toolbar>
          <Typography noWrap variant="h6" component="div">
            Account
          </Typography>
        </Toolbar>
      </AppBar>

      <SignIn open={signInDialogOpen} onClose={() => setSignInDialogOpen(false)} showSnackbar={showSnackbar} />

      <SignUp
        open={signUpDialogOpen}
        onClose={async () => {
          setSignUpDialogOpen(false);

          await sleep(450);

          if (JSON.parse(localStorage.getItem('user'))) {
            setOnboardingDialogOpen(true);
          }
        }}
      />

      <SignOut open={signOutDialogOpen} onClose={() => setSignOutDialogOpen(false)} showSnackbar={showSnackbar} />

      <ChangeName
        open={changeNameDialogOpen}
        onClose={() => setChangeNameDialogOpen(false)}
        showSnackbar={showSnackbar}
      />

      <ChangePassword
        open={changePasswordDialogOpen}
        onClose={() => setChangePasswordDialogOpen(false)}
        showSnackbar={showSnackbar}
      />

      <SavedLocations
        open={savedLocationsDialogOpen}
        onClose={() => setSavedLocationsDialogOpen(false)}
        showSnackbar={showSnackbar}
      />

      <ConfigureAdmins
        open={configureAdminsDialogOpen}
        onClose={() => setConfigureAdminsDialogOpen(false)}
        showSnackbar={showSnackbar}
      />

      <LocationFeedback
        open={locationFeedbackDialogOpen}
        onClose={() => setLocationFeedbackDialogOpen(false)}
        showSnackbar={showSnackbar}
      />

      <Statistics
        open={statisticsDialogOpen}
        onClose={() => setStatisticsDialogOpen(false)}
        showSnackbar={showSnackbar}
      />

      <BookRoomDialog />

      <Onboarding open={onboardingDialogOpen} onClose={() => setOnboardingDialogOpen(false)} />

      <Box className="page-contents-container">
        <Box className="page-contents">
          <Container className="page-layout" maxWidth="md">
            <Card variant="outlined" sx={{ display: 'flex' }}>
              <Box className="account-picture">
                <img
                  src={`https://robohash.org/${user ? user.email : null}?set=set4&size=96x96`}
                  onClick={() => showSnackbar('info', 'Say hello to your navigation buddy!')}
                />
              </Box>

              <Box className="account-details">
                <Typography
                  variant="h5"
                  component="div"
                  noWrap
                  onClick={() => showSnackbar('info', user ? user.name : 'Guest')}
                >
                  {user ? user.name : 'Guest'}
                </Typography>

                {user && (
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary' }}
                    noWrap
                    onClick={() => showSnackbar('info', user.email)}
                  >
                    {user.email}
                  </Typography>
                )}
              </Box>
            </Card>

            {user && (
              <>
                <Card variant="outlined">
                  <List disablePadding>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => setChangeNameDialogOpen(true)}>
                        <ListItemIcon>
                          <AbcIcon />
                        </ListItemIcon>
                        <ListItemText primary="Change name" />
                      </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                      <ListItemButton onClick={() => setChangePasswordDialogOpen(true)}>
                        <ListItemIcon>
                          <PasswordIcon />
                        </ListItemIcon>
                        <ListItemText primary="Change password" />
                      </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                      <ListItemButton onClick={() => setSignOutDialogOpen(true)}>
                        <ListItemIcon>
                          <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Sign out" />
                      </ListItemButton>
                    </ListItem>
                  </List>
                </Card>

                <Card variant="outlined">
                  <List disablePadding>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => setSavedLocationsDialogOpen(true)}>
                        <ListItemIcon>
                          <BookmarksIcon />
                        </ListItemIcon>
                        <ListItemText primary="Saved locations" />
                      </ListItemButton>
                    </ListItem>
                  </List>
                </Card>

                {user.isAdmin && (
                  <Card variant="outlined">
                    <List disablePadding>
                      <ListItem disablePadding>
                        <ListItemButton onClick={() => setConfigureAdminsDialogOpen(true)}>
                          <ListItemIcon>
                            <SecurityIcon />
                          </ListItemIcon>
                          <ListItemText primary="Configure admins" />
                        </ListItemButton>
                      </ListItem>

                      <ListItem disablePadding>
                        <ListItemButton onClick={() => setLocationFeedbackDialogOpen(true)}>
                          <ListItemIcon>
                            <CommentIcon />
                          </ListItemIcon>
                          <ListItemText primary="View location feedback" />
                        </ListItemButton>
                      </ListItem>

                      <ListItem disablePadding>
                        <ListItemButton onClick={() => setStatisticsDialogOpen(true)}>
                          <ListItemIcon>
                            <AnalyticsIcon />
                          </ListItemIcon>
                          <ListItemText primary="Statistics" />
                        </ListItemButton>
                      </ListItem>
                    </List>
                  </Card>
                )}
              </>
            )}

            {!user && (
              <Card variant="outlined">
                <List disablePadding>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => setSignInDialogOpen(true)}>
                      <ListItemIcon>
                        <LoginIcon />
                      </ListItemIcon>
                      <ListItemText primary="Sign in" />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding>
                    <ListItemButton onClick={() => setSignUpDialogOpen(true)}>
                      <ListItemIcon>
                        <PersonAddIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Register"
                        secondary="Create an account to save locations and provide feedback on them"
                      />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Card>
            )}

            <Card variant="outlined">
              <List disablePadding>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => setBookRoomDialogOpen(true)}>
                    <ListItemIcon>
                      <MeetingRoomIcon />
                    </ListItemIcon>
                    <ListItemText primary="Book a room" secondary="Via QOL for Queen's staff and students" />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton onClick={() => setOnboardingDialogOpen(true)}>
                    <ListItemIcon>
                      <HelpIcon />
                    </ListItemIcon>
                    <ListItemText primary="Onboarding" />
                  </ListItemButton>
                </ListItem>
              </List>
            </Card>

            <Box className="footer">
              <img src="../../favicon.png" width={100} />

              <Typography variant="h6" color="text.primary">
                Find a QUB Room
              </Typography>

              <Typography color="text.secondary">
                A dissertation project by Priyank Patel — built with love and too many console logs
              </Typography>

              <Typography color="text.secondary">
                P.S.{' '}
                <Box
                  component="span"
                  color="primary.main"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    confetti({
                      particleCount: 200,
                      spread: 100,
                      origin: { x: 0.5, y: 1 }
                    });
                  }}
                >
                  Confetti!
                </Box>
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>

      <SnackbarAlert snackbar={snackbar} handleSnackbarClose={hideSnackbar} />
    </>
  );
};

export default Account;
