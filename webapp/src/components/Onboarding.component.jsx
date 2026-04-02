import { useEffect, useRef, useState } from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MobileStepper,
  Typography
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HelpIcon from '@mui/icons-material/Help';

const Onboarding = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);

  const heroTextRef = useRef(null);
  const dialogContentRef = useRef(null);

  const VIDEO_PROPS = {
    className: 'onboarding-video',
    controls: true,
    loop: true,
    ref: video => {
      if (video) {
        const box = video.closest('.MuiBox-root');
        const text = box.querySelector('.MuiTypography-root');
        const height = text.getBoundingClientRect().height;
        video.style.setProperty('--height', `${height}px`);
      }
    },
    style: {
      maxHeight: 'calc(100% - 16px - var(--height))'
    }
  };

  const STEPS = [
    {
      content: (
        <Box className="onboarding-intro">
          <img src="../../favicon.png" width={100} />

          <Typography variant="h6" color="text.primary">
            Find a QUB Room
          </Typography>

          <Box className="hero-text" ref={heroTextRef}>
            <Typography variant="h4" color="text.secondary" className="animate__animated animate__fadeInUp">
              Your campus life
            </Typography>

            <Typography variant="h4" color="text.secondary" className="animate__animated animate__fadeInUp">
              Simplified
            </Typography>

            <Typography color="text.primary" className="animate__animated animate__flipInX">
              Take a couple of minutes to learn the basics.
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      content: (
        <>
          <Typography>
            Use the bottom navigation bar to switch between pages - Map, Search, Events, and Account.
          </Typography>
          <video src="../../src/assets/onboarding/page-navigation.mp4" {...VIDEO_PROPS} />
        </>
      )
    },
    {
      content: (
        <>
          <Typography>
            On the Map page, use the legend, filters, and map view switch. You can also fly to your current location.
          </Typography>
          <video src="../../src/assets/onboarding/map-controls.mp4" {...VIDEO_PROPS} />
        </>
      )
    },
    {
      content: (
        <>
          <Typography>
            Select any marker and choose Plot Route to see a walking route with distance and time. Or use Navigate to
            open Google Maps.
          </Typography>
          <video src="../../src/assets/onboarding/routing.mp4" {...VIDEO_PROPS} />
        </>
      )
    },
    {
      content: (
        <>
          <Typography>
            On the Search page, type a location name or building. You can filter by type, view details, or locate it on
            the Map.
          </Typography>
          <video src="../../src/assets/onboarding/search.mp4" {...VIDEO_PROPS} />
        </>
      )
    },
    {
      content: (
        <>
          <Typography>
            View location details, including opening days and images. You can save/unsave the location, see events, or
            leave feedback.
          </Typography>
          <video src="../../src/assets/onboarding/location-details.mp4" {...VIDEO_PROPS} />
        </>
      )
    },
    {
      content: (
        <>
          <Typography>
            Discover upcoming events. You can search by event name or description, and filter by date or location.
          </Typography>
          <video src="../../src/assets/onboarding/events.mp4" {...VIDEO_PROPS} />
        </>
      )
    },
    {
      content: (
        <>
          <Typography>
            In your Account, you can view your saved locations and access room booking through Queen's Online.
          </Typography>
          <video src="../../src/assets/onboarding/account.mp4" {...VIDEO_PROPS} />
        </>
      )
    },
    {
      content: (
        <>
          <Typography>
            You can revisit this onboarding anytime from your Account page. Enjoy exploring Queen's University with Find
            a QUB Room!
          </Typography>
          <video src="../../src/assets/onboarding/onboarding.mp4" {...VIDEO_PROPS} />
        </>
      )
    }
  ];

  const [animationClass, setAnimationClass] = useState(Array(STEPS.length).fill(''));

  // reset when opened
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setAnimationClass(Array(STEPS.length).fill(''));

      // animation delays for hero text
      setTimeout(() => {
        Array.from(heroTextRef.current.querySelectorAll('.MuiTypography-root')).forEach(
          (text, index) => (text.style.animationDelay = `calc(225ms + ${index} * var(--animate-duration))`)
        );
      }, 15);
    }
  }, [open]);

  useEffect(() => {
    if (dialogContentRef.current) {
      Array.from(dialogContentRef.current.querySelectorAll('.onboarding-video')).forEach((video, index) => {
        if (index === activeStep - 1) {
          setTimeout(() => {
            video.play();
          }, 450);
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    }
  }, [activeStep]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="dialog-title-text-container">
          <HelpIcon />
          <Box>Onboarding</Box>
        </Box>
      </DialogTitle>

      <DialogContent
        ref={dialogContentRef}
        sx={{ paddingBottom: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}
      >
        {STEPS.map((step, index) => (
          <Box
            key={index}
            className={`animate__animated animate__faster ${animationClass[index]}`}
            sx={{ display: index === activeStep ? 'flex' : 'none', flexDirection: 'column' }}
          >
            {step.content}
          </Box>
        ))}
      </DialogContent>

      <DialogContent sx={{ paddingBottom: 0, overflowY: 'visible' }}>
        <MobileStepper
          variant="text"
          steps={STEPS.length}
          position="static"
          activeStep={activeStep}
          backButton={
            <IconButton
              onClick={() => {
                setAnimationClass(prev => {
                  const nextStep = [...prev];
                  nextStep[activeStep - 1] = 'animate__fadeInLeft';
                  return nextStep;
                });

                setActiveStep(prev => prev - 1);
              }}
              disabled={activeStep === 0}
            >
              <ArrowBackIcon />
            </IconButton>
          }
          nextButton={
            <IconButton
              onClick={() => {
                setAnimationClass(prev => {
                  const nextStep = [...prev];
                  nextStep[activeStep + 1] = 'animate__fadeInRight';
                  return nextStep;
                });

                setActiveStep(prev => prev + 1);

                // remove animation for hero text
                if (activeStep === 0) {
                  Array.from(heroTextRef.current.querySelectorAll('.MuiTypography-root')).forEach(text =>
                    text.classList.remove('animate__animated')
                  );
                }
              }}
              disabled={activeStep === STEPS.length - 1}
            >
              <ArrowForwardIcon />
            </IconButton>
          }
          sx={{ padding: 0 }}
        />
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Onboarding;
