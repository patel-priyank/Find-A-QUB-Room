import { useEffect, useState } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Skeleton,
  TextField,
  Typography
} from '@mui/material';

import AddModeratorIcon from '@mui/icons-material/AddModerator';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RemoveModeratorIcon from '@mui/icons-material/RemoveModerator';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';

import { useAuthContext } from '../hooks/useAuthContext';

import { highlightMatch, stringAvatar } from '../utils/functions';

const ConfigureAdmins = ({ open, onClose, showSnackbar }) => {
  // context
  const { user } = useAuthContext();

  // dialog states
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [menuAnchorElement, setMenuAnchorElement] = useState(null);
  const [menuUser, setMenuUser] = useState(null);

  // field states
  const [searchQuery, setSearchQuery] = useState('');

  // data states
  const [users, setUsers] = useState(null);

  const matchesSearch = user => {
    const query = searchQuery.toLowerCase().trim();
    return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
  };

  const ACCORDIONS = [
    {
      key: 'admins',
      label: `Admin accounts ${users ? `(${users.filter(u => matchesSearch(u) && u.isAdmin).length})` : ''}`
    },
    {
      key: 'users',
      label: `User accounts ${users ? `(${users.filter(u => matchesSearch(u) && !u.isAdmin).length})` : ''}`
    }
  ];

  // dialog states
  const [expandedPanel, setExpandedPanel] = useState(ACCORDIONS[0].key);

  // reset when opened
  useEffect(() => {
    if (open) {
      setLoading(false);
      setAlert(null);
      setMenuAnchorElement(null);
      setMenuUser(null);
      setExpandedPanel(ACCORDIONS[0].key);

      setSearchQuery('');

      setUsers(null);

      fetchUsers();
    }
  }, [open]);

  const handleAccordionChange = panel => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : '');
  };

  const fetchUsers = async () => {
    const response = await fetch('/api/user', {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      handleCloseMenu();
      setUsers(json);
      setLoading(false);
    } else {
      showSnackbar('error', json.error);
      onClose();
    }
  };

  const handleAdminAccess = async (action, id) => {
    setLoading(true);
    setAlert(null);

    handleCloseMenu();

    const response = await fetch(`/api/user/admin-access/${action}/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (!response.ok) {
      setLoading(false);
      setAlert({ severity: 'error', message: json.error });
      return;
    }

    // fetch and overwrite if dialog is open
    if (open) {
      fetchUsers();
    }
  };

  const handleCloseMenu = () => {
    setMenuAnchorElement(null);
    setMenuUser(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          {loading ? <CircularProgress /> : <SecurityIcon />}
          <Box>Configure admins</Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: alert ? 0 : '' }}>
        {users && (
          <>
            <DialogContentText gutterBottom>
              Manage admin access for users. Users are grouped by access type and sorted alphabetically within each
              group.
            </DialogContentText>

            <TextField
              variant="outlined"
              fullWidth
              type="text"
              placeholder="Search"
              sx={{ margin: '16px 0' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        title="Clear"
                        onClick={() => setSearchQuery('')}
                        onMouseDown={e => e.preventDefault()}
                        onMouseUp={e => e.preventDefault()}
                        edge="end"
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
              helperText="Search with name or email"
            />

            <Box className="accordion-container">
              {ACCORDIONS.map(accordion => (
                <Accordion
                  key={accordion.key}
                  expanded={expandedPanel === accordion.key}
                  onChange={handleAccordionChange(accordion.key)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography component="span">{accordion.label}</Typography>
                  </AccordionSummary>

                  <AccordionDetails>
                    {accordion.key === 'admins' && (
                      <>
                        {users.filter(u => u.isAdmin).length === 0 && (
                          <Typography color="text.secondary">No admin accounts present.</Typography>
                        )}

                        {users.filter(u => u.isAdmin).length > 0 && (
                          <>
                            {users.filter(u => matchesSearch(u) && u.isAdmin).length === 0 && (
                              <Typography color="text.secondary">No admin accounts match your search.</Typography>
                            )}

                            {users.filter(u => matchesSearch(u) && u.isAdmin).length > 0 && (
                              <List disablePadding>
                                {users
                                  .filter(u => matchesSearch(u) && u.isAdmin)
                                  .map(listUser => (
                                    <ListItem
                                      disableGutters
                                      key={listUser._id}
                                      secondaryAction={
                                        user && listUser.email === user.email ? (
                                          <Chip label="You" color="secondary" />
                                        ) : (
                                          <IconButton
                                            title="Options"
                                            sx={{ marginRight: '-8px' }}
                                            onClick={e => {
                                              setMenuAnchorElement(e.currentTarget);
                                              setMenuUser(listUser);
                                            }}
                                          >
                                            <MoreVertIcon />
                                          </IconButton>
                                        )
                                      }
                                    >
                                      <ListItemAvatar>{stringAvatar(listUser.name)}</ListItemAvatar>
                                      <ListItemText
                                        primary={highlightMatch(listUser.name, searchQuery)}
                                        secondary={highlightMatch(listUser.email, searchQuery)}
                                      />
                                    </ListItem>
                                  ))}
                              </List>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {accordion.key === 'users' && (
                      <>
                        {users.filter(u => !u.isAdmin).length === 0 && (
                          <Typography color="text.secondary">No user accounts present.</Typography>
                        )}

                        {users.filter(u => !u.isAdmin).length > 0 && (
                          <>
                            {users.filter(u => matchesSearch(u) && !u.isAdmin).length === 0 && (
                              <Typography color="text.secondary">No user accounts match your search.</Typography>
                            )}

                            {users.filter(u => matchesSearch(u) && !u.isAdmin).length > 0 && (
                              <List disablePadding>
                                {users
                                  .filter(u => matchesSearch(u) && !u.isAdmin)
                                  .map(listUser => (
                                    <ListItem
                                      disableGutters
                                      key={listUser._id}
                                      secondaryAction={
                                        <IconButton
                                          title="Options"
                                          sx={{ marginRight: '-8px' }}
                                          onClick={e => {
                                            setMenuAnchorElement(e.currentTarget);
                                            setMenuUser(listUser);
                                          }}
                                        >
                                          <MoreVertIcon />
                                        </IconButton>
                                      }
                                    >
                                      <ListItemAvatar>{stringAvatar(listUser.name)}</ListItemAvatar>
                                      <ListItemText
                                        primary={highlightMatch(listUser.name, searchQuery)}
                                        secondary={highlightMatch(listUser.email, searchQuery)}
                                      />
                                    </ListItem>
                                  ))}
                              </List>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </>
        )}

        {!users && (
          <List disablePadding>
            {Array.from({ length: 3 }, (value, index) => index).map(item => (
              <ListItem disableGutters key={item}>
                <ListItemIcon>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemIcon>
                <ListItemText primary={<Skeleton width="50%" />} secondary={<Skeleton />} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      {menuUser && (
        <Menu
          anchorEl={menuAnchorElement}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          className="disable-top-padding"
          open={Boolean(menuAnchorElement)}
          onClose={handleCloseMenu}
        >
          <ListSubheader>{menuUser.name}</ListSubheader>

          {menuUser.isAdmin && (
            <MenuItem disabled={loading} onClick={() => handleAdminAccess('revoke', menuUser._id)}>
              <ListItemIcon>
                <RemoveModeratorIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Revoke admin access" />
            </MenuItem>
          )}

          {!menuUser.isAdmin && (
            <MenuItem disabled={loading} onClick={() => handleAdminAccess('grant', menuUser._id)}>
              <ListItemIcon>
                <AddModeratorIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Grant admin access" />
            </MenuItem>
          )}
        </Menu>
      )}

      {alert && (
        <DialogContent className="alert-container">
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </DialogContent>
      )}

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureAdmins;
