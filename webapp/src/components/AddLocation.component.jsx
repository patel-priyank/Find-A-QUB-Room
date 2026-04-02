import { useEffect, useRef, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  MobileStepper,
  Radio,
  RadioGroup,
  Select,
  styled,
  TextField,
  Typography
} from '@mui/material';
import { MobileTimePicker } from '@mui/x-date-pickers';

import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';

import dayjs from 'dayjs';

import { useAuthContext } from '../hooks/useAuthContext';
import { useLocationsContext } from '../hooks/useLocationsContext';

import { ACCESSIBILITY_VALUES, DAYS_OF_WEEK, LOCATION_TYPES } from '../utils/constants';

// hidden input for file picker
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1
});

const AddLocation = ({ open, onClose, locationLat, locationLng, showSnackbar }) => {
  // context
  const { user } = useAuthContext();
  const { dispatch: locationsDispatch } = useLocationsContext();

  // constants
  const DEFAULT_LOCATION_TYPE = LOCATION_TYPES.filter(type => type.isInteractive)[0].key;
  const DEFAULT_ACCESSIBILITY_VALUE = Object.keys(ACCESSIBILITY_VALUES[0])[0];

  // dialog states
  const [imageIndex, setImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  // field states
  const [title, setTitle] = useState('');
  const [type, setType] = useState(DEFAULT_LOCATION_TYPE);
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [latitude, setLatitude] = useState(locationLat);
  const [longitude, setLongitude] = useState(locationLng);
  const [directions, setDirections] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isAccessible, setIsAccessible] = useState(DEFAULT_ACCESSIBILITY_VALUE);
  const [images, setImages] = useState([]);
  const [openDays, setOpenDays] = useState(
    DAYS_OF_WEEK.map(day => ({
      ...day,
      openOnDay: false,
      openingTime: dayjs().startOf('day'),
      closingTime: dayjs().startOf('day')
    }))
  );

  // references
  const fileInputRef = useRef(null);
  const dialogContentRef = useRef(null); // for dialog content scrolling
  const locationFormRef = useRef(null); // for checking validity

  const handleDayChange = event => {
    const { name, checked } = event.target;
    setOpenDays(days => days.map(day => (day.key === name ? { ...day, openOnDay: checked } : day)));
  };

  const STEPS = [
    {
      content: (
        <form ref={locationFormRef}>
          <DialogContentText>Fill in the basic information about the location.</DialogContentText>

          <TextField
            variant="outlined"
            label="Name"
            type="text"
            slotProps={{ htmlInput: { maxLength: 128 } }}
            value={title}
            onChange={e => {
              setAlert(null);
              setTitle(e.target.value);
            }}
            required
          />

          <FormControl>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={type} onChange={e => setType(e.target.value)} onOpen={() => setAlert(null)}>
              {LOCATION_TYPES.filter(type => type.isInteractive).map(locationType => (
                <MenuItem value={locationType.key}>{locationType.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            variant="outlined"
            label="Building"
            slotProps={{ htmlInput: { maxLength: 128 } }}
            type="text"
            value={building}
            onChange={e => {
              setAlert(null);
              setBuilding(e.target.value);
            }}
          />

          <TextField
            variant="outlined"
            label="Floor"
            type="number"
            slotProps={{
              htmlInput: {
                inputMode: 'numeric',
                min: 0,
                max: 32
              }
            }}
            value={floor}
            onChange={e => {
              setAlert(null);
              setFloor(e.target.value);
            }}
          />

          <TextField
            variant="outlined"
            label="Latitude"
            type="number"
            slotProps={{
              htmlInput: {
                name: 'latitude',
                inputMode: 'decimal',
                min: -90,
                max: 90,
                step: 0.0000001
              },
              input: {
                endAdornment: <InputAdornment position="end">deg</InputAdornment>
              }
            }}
            value={latitude}
            onChange={e => {
              setAlert(null);
              setLatitude(e.target.value);
            }}
            required
            helperText="Latitude requires precise input, enter carefully. Range: -90 to 90 deg. 1 deg is approximately 111 km."
          />

          <TextField
            variant="outlined"
            label="Longitude"
            type="number"
            slotProps={{
              htmlInput: {
                name: 'longitude',
                inputMode: 'decimal',
                min: -180,
                max: 180,
                step: 0.0000001
              },
              input: {
                endAdornment: <InputAdornment position="end">deg</InputAdornment>
              }
            }}
            value={longitude}
            onChange={e => {
              setAlert(null);
              setLongitude(e.target.value);
            }}
            required
            helperText={`
              Longitude requires precise input, enter carefully. Range: -180 to 180 deg.
              The distance conversion varies based on latitude. ${
                latitude && latitude >= -90 && latitude <= 90
                  ? `At the current latitude, 1 deg is approximately ${Math.round(
                      111 * Math.cos((latitude * Math.PI) / 180)
                    )} km.`
                  : ''
              }
            `}
          />

          <TextField
            variant="outlined"
            label="Directions within building"
            type="text"
            slotProps={{ htmlInput: { maxLength: 4096 } }}
            multiline
            rows={4}
            value={directions}
            onChange={e => {
              setAlert(null);
              setDirections(e.target.value);
            }}
          />

          <TextField
            variant="outlined"
            label="Additional information"
            placeholder="Add information like seating availability, entry fee, pet policy, or any other useful tips."
            type="text"
            slotProps={{ htmlInput: { maxLength: 4096 } }}
            multiline
            rows={4}
            value={additionalInfo}
            onChange={e => {
              setAlert(null);
              setAdditionalInfo(e.target.value);
            }}
          />

          <FormControl>
            <FormLabel>Accessible</FormLabel>
            <RadioGroup
              row
              value={isAccessible}
              onChange={e => {
                setAlert(null);
                setIsAccessible(e.target.value);
              }}
            >
              {ACCESSIBILITY_VALUES.map((accessibilityVal, index) => (
                <FormControlLabel
                  key={index}
                  value={Object.keys(accessibilityVal)[0]}
                  control={<Radio />}
                  label={accessibilityVal[Object.keys(accessibilityVal)[0]]}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </form>
      )
    },
    {
      content: (
        <FormGroup sx={{ gap: '16px' }}>
          <DialogContentText>Select the days and times when this location is open to users.</DialogContentText>

          {openDays.map(day => (
            <FormGroup key={day.key}>
              <FormControlLabel
                control={<Checkbox name={day.key} onChange={handleDayChange} checked={day.openOnDay} />}
                label={day.label}
              />

              <FormGroup className="time-picker">
                <MobileTimePicker
                  closeOnSelect
                  ampm={false}
                  sx={{ flexGrow: 1 }}
                  variant="outlined"
                  disabled={!day.openOnDay}
                  label="Opening time"
                  format="HH:mm"
                  value={day.openingTime}
                  onChange={value => {
                    setAlert(null);
                    setOpenDays(days => days.map(d => (d.key === day.key ? { ...d, openingTime: value } : d)));
                  }}
                />

                <MobileTimePicker
                  closeOnSelect
                  ampm={false}
                  sx={{ flexGrow: 1 }}
                  variant="outlined"
                  disabled={!day.openOnDay}
                  label="Closing time"
                  format="HH:mm"
                  value={day.closingTime}
                  onChange={value => {
                    setAlert(null);
                    setOpenDays(days => days.map(d => (d.key === day.key ? { ...d, closingTime: value } : d)));
                  }}
                />
              </FormGroup>
            </FormGroup>
          ))}
        </FormGroup>
      )
    },
    {
      content: (
        <FormGroup sx={{ gap: '16px' }}>
          <DialogContentText>Add photos of the location. You can only upload a maximum of 10 photos.</DialogContentText>

          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length === 10}
            sx={{ alignSelf: 'flex-start' }}
          >
            Add photos
          </Button>

          {images.length === 0 && <Typography color="text.primary">No photos uploaded.</Typography>}

          {images.length > 0 && (
            <Box className="carousel-wrapper">
              <Box className="carousel-container">
                <IconButton
                  onClick={() => {
                    setAlert(null);
                    setImageIndex(prev => prev - 1);
                  }}
                  disabled={imageIndex === 0}
                  sx={{ marginLeft: '-8px' }}
                >
                  <ChevronLeftIcon />
                </IconButton>

                <Box className="carousel-image-container">
                  {images.map((image, imgIndex) => (
                    <Box
                      key={imgIndex}
                      className="carousel-image"
                      sx={{ display: imgIndex === imageIndex ? '' : 'none' }}
                    >
                      <img src={URL.createObjectURL(image)} />

                      <IconButton
                        title="Remove"
                        className="remove-carousel-image"
                        onClick={() => {
                          setAlert(null);
                          setImages(imgs => imgs.filter((currentImg, currentImgIndex) => currentImgIndex !== imgIndex));

                          if (imageIndex > 0 && imageIndex === images.length - 1) {
                            setImageIndex(images.length - 2);
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                <IconButton
                  onClick={() => {
                    setAlert(null);
                    setImageIndex(prev => prev + 1);
                  }}
                  disabled={imageIndex === images.length - 1}
                  sx={{ marginRight: '-8px' }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>

              <Typography color="text.primary">
                Photo {imageIndex + 1} of {images.length}
              </Typography>
            </Box>
          )}
        </FormGroup>
      )
    }
  ];

  // reset when opened
  useEffect(() => {
    if (open) {
      setImageIndex(0);
      setLoading(false);
      setAlert(null);
      setActiveStep(0);

      setTitle('');
      setType(DEFAULT_LOCATION_TYPE);
      setBuilding('');
      setFloor('');
      setLatitude(locationLat);
      setLongitude(locationLng);
      setDirections('');
      setAdditionalInfo('');
      setIsAccessible(DEFAULT_ACCESSIBILITY_VALUE);
      setImages([]);
      setOpenDays(
        DAYS_OF_WEEK.map(day => ({
          ...day,
          openOnDay: false,
          openingTime: dayjs().startOf('day'),
          closingTime: dayjs().endOf('day')
        }))
      );
    }
  }, [open]);

  // scroll to top when view changes
  useEffect(() => {
    dialogContentRef.current && dialogContentRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeStep]);

  const addLocation = async () => {
    setAlert(null);

    const getLabel = field => {
      return field.closest('.MuiFormControl-root').querySelector('label').innerText.replaceAll('*', '').trim();
    };

    const requiredFields = Array.from(locationFormRef.current.querySelectorAll('[required]'));
    const latField = locationFormRef.current.querySelector('[name=latitude]');
    const lngField = locationFormRef.current.querySelector('[name=longitude]');

    if (requiredFields.some(field => field.value === '')) {
      const fieldLabels = requiredFields
        .filter(field => field.value === '')
        .map(field => getLabel(field))
        .join(', ');

      setAlert({ severity: 'warning', message: `Please fill in all the required fields: ${fieldLabels}.` });
      return;
    }

    if (!latField.checkValidity()) {
      const validationMessage = latField.validationMessage.split('Please enter a valid value.')[1].trim();
      setAlert({
        severity: 'warning',
        message: `Please enter a valid value for ${getLabel(latField)}. ${validationMessage}`
      });
      return;
    }

    if (!lngField.checkValidity()) {
      const validationMessage = lngField.validationMessage.split('Please enter a valid value.')[1].trim();
      setAlert({
        severity: 'warning',
        message: `Please enter a valid value for ${getLabel(lngField)}. ${validationMessage}`
      });
      return;
    }

    for (const day of openDays.filter(day => day.openOnDay)) {
      if (!dayjs.isDayjs(day.openingTime) || !dayjs(day.openingTime, 'HH:mm', true).isValid()) {
        setAlert({ severity: 'error', message: 'Opening time is invalid.' });
        return;
      }

      if (!dayjs.isDayjs(day.closingTime) || !dayjs(day.closingTime, 'HH:mm', true).isValid()) {
        setAlert({ severity: 'error', message: 'Closing time is invalid.' });
        return;
      }
    }

    setLoading(true);

    let imageData = [];

    // if images are added, upload to cloudinary
    if (images.length > 0) {
      const formData = new FormData();
      images.forEach(image => formData.append('images', image));

      const response = await fetch('/api/locations/images', {
        method: 'POST',
        body: formData,
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

      // set uploaded images response for data
      imageData = json.imageData;
    }

    // format coordinates
    const coordinates = [latitude, longitude];

    // format opening and closing time of open days
    const formattedOpenDays = openDays.map(day => ({
      ...day,
      openingTime: day.openingTime.format('HH:mm'),
      closingTime: day.closingTime.format('HH:mm')
    }));

    // body for api
    const location = {
      title,
      type,
      building,
      floor,
      coordinates,
      isAccessible,
      directions,
      additionalInfo,
      openDays: formattedOpenDays,
      imageData,
      isSuggested: !(user && user.isAdmin)
    };

    const response = await fetch('/api/locations', {
      method: 'POST',
      body: JSON.stringify(location),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      showSnackbar(
        'success',
        user && user.isAdmin ? 'Location added successfully!' : 'Location suggested successfully!'
      );
      onClose();

      if (user && user.isAdmin) {
        locationsDispatch({ type: 'CREATE_LOCATION', payload: json });
      }
    } else {
      setLoading(false);
      setAlert({ severity: 'error', message: json.error });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          <AddLocationAltIcon />
          <Box>{user && user.isAdmin ? 'Add location' : 'Suggest location'}</Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: 0 }}>
        <Box ref={dialogContentRef}>
          <DialogContentText sx={{ paddingBottom: '16px' }}>
            {user && user.isAdmin
              ? "Add a new location to the map. It will appear for users when they browse or search, and they'll be able to save it or leave feedback."
              : "Suggest a new location you'd like to see on the map. Admins will review it and may edit the details before approving it for everyone to see."}
          </DialogContentText>

          {STEPS.map((step, index) => (
            <Box key={index} sx={{ display: index === activeStep ? '' : 'none' }}>
              {step.content}
            </Box>
          ))}
        </Box>
      </DialogContent>

      {alert && (
        <DialogContent className="alert-container">
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </DialogContent>
      )}

      <DialogContent sx={{ paddingTop: alert ? 0 : '', paddingBottom: 0, overflowY: 'visible' }}>
        <MobileStepper
          variant="dots"
          steps={STEPS.length}
          position="static"
          activeStep={activeStep}
          backButton={
            <Button
              onClick={() => {
                setAlert(null);
                setActiveStep(prev => prev - 1);
              }}
              disabled={activeStep === 0}
            >
              Back
            </Button>
          }
          nextButton={
            <Button
              onClick={() => {
                setAlert(null);
                setActiveStep(prev => prev + 1);
              }}
              disabled={activeStep === STEPS.length - 1}
            >
              Next
            </Button>
          }
          sx={{ padding: 0 }}
        />
      </DialogContent>

      <VisuallyHiddenInput
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        multiple
        onChange={event => {
          const fileInput = event.target;
          const newImages = Array.from(fileInput.files);

          if (images.length + newImages.length > 10) {
            setAlert({
              severity: 'warning',
              message: 'You can only upload a maximum of 10 photos. Extra photos were ignored.'
            });
          }

          setImages(images => [...images, ...newImages.slice(0, 10 - images.length)]);

          fileInput.value = '';
        }}
      />

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>

        <Button loading={loading} variant="contained" disableElevation onClick={addLocation}>
          {user && user.isAdmin ? 'Add location' : 'Suggest location'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLocation;
