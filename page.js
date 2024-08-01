'use client';

import { Button, Box } from '@mui/material';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import './globals.css';

const LandingPage = dynamic(() => import('./pages/index'), {
  ssr: false,
});
const PantryGallery = dynamic(() => import('./components/PantryGallery'), {
  ssr: false,
});

export default function Home() {
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showSignOut, setShowSignOut] = useState(false);

  const handleGetStartedClick = () => {
    setShowLandingPage(false);
    setShowSignOut(true);
  };

  const handleSignOutClick = () => {
    setShowLandingPage(true);
    setShowSignOut(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#ffffff', // Changed to white for a clean look
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
      }}
    >
      {showLandingPage && !showSignOut && (
        <Button
          variant="outlined"
          size="large"
          onClick={handleGetStartedClick}
          sx={{
            borderColor: '#4CAF50', // Light green
            color: '#4CAF50',
            '&:hover': {
              borderColor: '#388E3C', // Darker green
              color: '#388E3C',
            },
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1,
            '@media (max-width: 600px)': {
              top: 10,
              right: 10,
            },
          }}
        >
          Get Started
        </Button>
      )}
      {!showLandingPage && showSignOut && (
        <Button
          variant="outlined"
          size="large"
          onClick={handleSignOutClick}
          sx={{
            borderColor: '#4CAF50', // Light green
            color: '#4CAF50',
            '&:hover': {
              borderColor: '#388E3C', // Darker green
              color: '#388E3C',
            },
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1,
            '@media (max-width: 600px)': {
              top: 10,
              right: 10,
            },
          }}
        >
          Home
        </Button>
      )}
      <Box
        sx={{
          mt: 10,
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          textAlign: 'center',
        }}
      >
        {showLandingPage ? <LandingPage /> : <PantryGallery />}
      </Box>
    </Box>
  );
}
