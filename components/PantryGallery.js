'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, Typography, Button, Grid, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

// Dynamically import PantryList component to ensure it is only rendered client-side
const PantryList = dynamic(() => import('./PantryList'), {
  ssr: false,
});

export default function PantryGallery({ userId }) {
  const [pantries, setPantries] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPantryId, setSelectedPantryId] = useState(null);
  const [newPantryName, setNewPantryName] = useState('');
  const [newPantryDescription, setNewPantryDescription] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [inputUserId, setInputUserId] = useState('');
  const [currentUserId, setCurrentUserId] = useState(userId);

  useEffect(() => {
    if (currentUserId) {
      fetchPantries();
    }
  }, [currentUserId]);

  const fetchPantries = async () => {
    const db = getFirestore();
    const pantriesCollection = collection(db, 'pantries');
    const q = query(pantriesCollection, where("userId", "==", currentUserId));
    const pantrySnapshot = await getDocs(q);
    const pantryList = pantrySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPantries(pantryList);
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewPantryName('');
    setNewPantryDescription('');
  };

  const createPantry = async () => {
    const db = getFirestore();
    await addDoc(collection(db, 'pantries'), {
      name: newPantryName,
      description: newPantryDescription,
      createdAt: new Date(),
      userId: currentUserId,
    });
    handleClose();
    fetchPantries();
  };

  const deletePantry = async (id) => {
    const db = getFirestore();
    await deleteDoc(doc(db, 'pantries', id));
    fetchPantries();
  };

  const handleOpenPantry = (id) => {
    setSelectedPantryId(id);
  };

  const handleBackToGallery = () => {
    setSelectedPantryId(null);
  };

  const handleFormOpen = () => setFormOpen(true);
  const handleFormClose = () => setFormOpen(false);

  const handleFormSubmit = () => {
    setCurrentUserId(inputUserId);
    setFormOpen(false);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F5F5F5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {formOpen && (
        <Dialog open={formOpen} onClose={handleFormClose} sx={{ '& .MuiDialog-paper': { padding: '24px', maxWidth: '400px' } }}>
          <DialogTitle sx={{ fontWeight: 'bold', color: '#444' }}>Enter Email or User ID</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="userId"
              label="Email or User ID"
              type="text"
              fullWidth
              variant="outlined"
              value={inputUserId}
              onChange={(e) => setInputUserId(e.target.value)}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleFormClose} sx={{ color: '#444' }}>Cancel</Button>
            <Button onClick={handleFormSubmit} sx={{ backgroundColor: '#4CAF50', color: 'white', '&:hover': { backgroundColor: '#45A049' } }}>Submit</Button>
          </DialogActions>
        </Dialog>
      )}

      {!currentUserId ? (
        <Button
          variant="contained"
          onClick={handleFormOpen}
          sx={{
            backgroundColor: '#4CAF50',
            color: 'white',
            '&:hover': { backgroundColor: '#45A049' },
            mb: 3,
          }}
        >
          Enter Email or User ID
        </Button>
      ) : selectedPantryId ? (
        <PantryList pantryId={selectedPantryId} />
      ) : (
        <>
          <Typography variant="h4" gutterBottom sx={{ color: '#333', mb: 3 }}>
            My Pantries
          </Typography>
          <Button
            variant="contained"
            onClick={handleOpen}
            sx={{
              backgroundColor: '#4CAF50',
              color: 'white',
              '&:hover': { backgroundColor: '#45A049' },
              mb: 3,
            }}
          >
            Create New Pantry
          </Button>
          <Box sx={{ width: '100%', overflowY: 'auto' }}>
            <Grid container spacing={3}>
              {pantries.map((pantry) => (
                <Grid item xs={12} sm={6} md={4} key={pantry.id}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      boxShadow: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      bgcolor: '#FFFFFF', // White background for a cleaner look
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ color: '#333', mb: 1 }}>{pantry.name}</Typography>
                      <Typography variant="body2" sx={{ color: '#555' }}>{pantry.description}</Typography>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Button
                        size="small"
                        sx={{ color: '#F44336' }}
                        onClick={() => deletePantry(pantry.id)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="small"
                        sx={{ color: '#1976D2' }}
                        onClick={() => handleOpenPantry(pantry.id)}
                      >
                        Open
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
          <Dialog open={open} onClose={handleClose} sx={{ '& .MuiDialog-paper': { padding: '24px', maxWidth: '400px' } }}>
            <DialogTitle sx={{ fontWeight: 'bold', color: '#444' }}>Create New Pantry</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                label="Pantry Name"
                type="text"
                fullWidth
                variant="outlined"
                value={newPantryName}
                onChange={(e) => setNewPantryName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                id="description"
                label="Description"
                type="text"
                fullWidth
                variant="outlined"
                value={newPantryDescription}
                onChange={(e) => setNewPantryDescription(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} sx={{ color: '#444' }}>Cancel</Button>
              <Button onClick={createPantry} sx={{ backgroundColor: '#4CAF50', color: 'white', '&:hover': { backgroundColor: '#45A049' } }}>Create</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      {selectedPantryId && (
        <Button
          variant="outlined"
          onClick={handleBackToGallery}
          sx={{ mt: 3, color: '#333', borderColor: '#333', '&:hover': { borderColor: '#555', color: '#555' } }}
        >
          Back to Gallery
        </Button>
      )}
    </Box>
  );
}
