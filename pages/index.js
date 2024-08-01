import { Box, Typography, Button, TextField, Container, Grid, Paper } from '@mui/material';
import { useState } from 'react';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import '../../firebase';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const db = getFirestore();

  const handleSignUp = async () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    try {
      await addDoc(collection(db, 'newsletter'), { email });
      alert('Thank you for signing up!');
      setEmail('');
    } catch (error) {
      console.error('Error signing up:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        background: '#ffffff', // White background for a clean look
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          textAlign: 'center',
          gap: 4,
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold', color: '#333333' }}
        >
          Pantry Easy
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ color: '#666666' }}
        >
          Simplify your pantry management
        </Typography>

        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} md={4}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor: '#fafafa', // Light grey
                border: '1px solid #dddddd',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#333333' }}>Track Inventory</Typography>
              <Typography sx={{ color: '#666666' }}>Easily manage your pantry items and quantities.</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor: '#fafafa', // Light grey
                border: '1px solid #dddddd',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#333333' }}>Smart Suggestions</Typography>
              <Typography sx={{ color: '#666666' }}>Get recipe ideas based on your pantry contents.</Typography>
            </Paper>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
          <TextField
            label="Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              width: '250px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#4CAF50', // Light green
                },
                '&:hover fieldset': {
                  borderColor: '#388E3C', // Darker green
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4CAF50', // Light green
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSignUp}
            sx={{
              backgroundColor: '#4CAF50', // Light green
              color: 'white',
              '&:hover': {
                backgroundColor: '#388E3C', // Darker green
              },
            }}
          >
            Join for updates
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
