import { Avatar, darken } from '@mui/material';

import dayjs from 'dayjs';

// generate avatar color
export const stringToColor = string => {
  let hash = 0;

  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
};

// generate avatar based on string
export const stringAvatar = name => (
  <Avatar
    sx={{ bgcolor: darken(stringToColor(name), 0.2), fontSize: '1.15rem' }}
    children={name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()}
  />
);

// generate avatar based on date
export const dateAvatar = date => (
  <Avatar
    variant="rounded"
    sx={{ bgcolor: darken(stringToColor(date.toLocaleString()), 0.2), flexDirection: 'column', fontSize: '0.75rem' }}
    children={[<span key="D">{dayjs(date).format('DD')}</span>, <span key="M">{dayjs(date).format('MMM')}</span>]}
  />
);

// get formatted time for location feedback
export const getFeedbackTime = (time, user = undefined) => {
  if (user) {
    user = user.name.split(' ')[0];
  }

  time = dayjs(time);

  if (dayjs().diff(time, 'day') < 1) {
    return user ? `${user} at ${time.format('HH:mm')}` : `${time.format('HH:mm')}`;
  } else {
    return user ? `${user} on ${time.format('DD MMM YYYY')}` : time.format('DD MMM YYYY');
  }
};

// highlight matched part of text based on query
export const highlightMatch = (text, query) => {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.trim()})`, 'ig');

  return text.split(regex).map((part, index) =>
    regex.test(part) ? (
      <span key={index} style={{ backgroundColor: '#60abf788' }}>
        {part}
      </span>
    ) : (
      part
    )
  );
};

// sleep for a certain time
export const sleep = (ms = 225) => new Promise(resolve => setTimeout(resolve, ms));

// calculate distance and time taken to walk to destination from origin
export const fetchDistanceAndTime = (origin, destination) => {
  const toRad = deg => (deg * Math.PI) / 180;

  const R = 6371; // radius of earth in km
  const walkingSpeed = 5; // in km/h

  const latDiff = toRad(destination[0] - origin[0]);
  const lonDiff = toRad(destination[1] - origin[1]);

  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRad(origin[0])) * Math.cos(toRad(destination[0])) * Math.sin(lonDiff / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = Math.round((R * c + Number.EPSILON) * 100) / 100; // distance in km rounded to 2 decimal places
  const travelTime = Math.round((distance * 60) / walkingSpeed); // time in min rounded to nearest integer

  const formatTime = (value, unit) => `${value} ${unit}${value === 1 ? '' : 's'}`;

  // formatted walking time to show hours and minutes
  const formattedWalkingTime =
    travelTime < 60
      ? formatTime(travelTime, 'minute')
      : `${formatTime(Math.floor(travelTime / 60), 'hour')} and ${formatTime(travelTime % 60, 'minute')}`;

  return `You're about ${distance} km away from this location. It should take around ${formattedWalkingTime} to walk there.`;
};
