import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BottomNavigation, BottomNavigationAction } from '@mui/material';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MapIcon from '@mui/icons-material/Map';
import SearchIcon from '@mui/icons-material/Search';

const Navbar = () => {
  const navigate = useNavigate();

  const navigationItems = [
    { value: 'map', label: 'Map', icon: <MapIcon />, route: '/' },
    { value: 'search', label: 'Search', icon: <SearchIcon />, route: '/search' },
    { value: 'events', label: 'Events', icon: <CalendarMonthIcon />, route: '/events' },
    { value: 'account', label: 'Account', icon: <AccountCircleIcon />, route: '/account' }
  ];

  const selectedNavItem = navigationItems.find(item => item.route === window.location.pathname);

  const [navigationValue, setNavigationValue] = useState(selectedNavItem ? selectedNavItem.value : null);

  // update navigation value based on selection
  useEffect(() => {
    setNavigationValue(selectedNavItem ? selectedNavItem.value : null);
  }, [window.location.pathname]);

  return (
    <BottomNavigation
      showLabels
      value={navigationValue}
      onChange={(event, newValue) => navigate(navigationItems.find(item => item.value === newValue).route)}
    >
      {navigationItems.map((item, index) => (
        <BottomNavigationAction key={index} value={item.value} label={item.label} title={item.label} icon={item.icon} />
      ))}
    </BottomNavigation>
  );
};

export default Navbar;
