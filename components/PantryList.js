'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, Checkbox, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Divider, Alert, Avatar } from '@mui/material';
import { FaPlus, FaMinus, FaTrash, FaEdit, FaSearch, FaImage } from 'react-icons/fa';
import { getFirestore, collection, query, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

export default function PantryList({ pantryId }) {
    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState(1);
    const [newItemImage, setNewItemImage] = useState(null);
    const [selectedItemForImageUpdate, setSelectedItemForImageUpdate] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openRecipeModal, setOpenRecipeModal] = useState(false);
    const [recipeData, setRecipeData] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (pantryId) {
            fetchItems();
        }
    }, [pantryId]);

    const fetchItems = async () => {
        try {
            const db = getFirestore();
            const itemsCollection = collection(db, 'pantryItems');
            const itemQuery = query(itemsCollection, where("pantryId", "==", pantryId));
            const itemSnapshot = await getDocs(itemQuery);
            const itemList = itemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(itemList);
        } catch (error) {
            console.error("Error fetching items:", error);
            setError('Failed to load items.');
        }
    };

    const addItem = async () => {
        if (!newItemName || newItemQuantity <= 0) {
            setError("Invalid item name or quantity.");
            return;
        }

        try {
            const db = getFirestore();
            const storage = getStorage();
            let imageUrl = '';

            if (newItemImage) {
                const imageRef = ref(storage, `images/${newItemImage.name}`);
                await uploadBytes(imageRef, newItemImage);
                imageUrl = await getDownloadURL(imageRef);
            }

            await addDoc(collection(db, 'pantryItems'), {
                name: newItemName,
                quantity: newItemQuantity,
                pantryId: pantryId,
                imageUrl: imageUrl
            });
            setOpenDialog(false);
            setNewItemName('');
            setNewItemQuantity(1);
            setNewItemImage(null);
            fetchItems();
        } catch (error) {
            console.error("Error adding item:", error);
            setError('Failed to add item.');
        }
    };

    const updateItem = async (itemId, newData) => {
        if (!itemId || !newData) {
            setError("Invalid item ID or data.");
            return;
        }
        try {
            const db = getFirestore();
            await updateDoc(doc(db, 'pantryItems', itemId), newData);
            fetchItems();
        } catch (error) {
            console.error("Error updating item:", error);
            setError('Failed to update item.');
        }
    };

    const deleteItem = async (itemId) => {
        if (!itemId) {
            setError("Invalid item ID.");
            return;
        }
        try {
            const db = getFirestore();
            await deleteDoc(doc(db, 'pantryItems', itemId));
            fetchItems();
        } catch (error) {
            console.error("Error deleting item:", error);
            setError('Failed to delete item.');
        }
    };

    const handleSelectAll = () => {
        if (items.length === 0) return;
        setSelectedItems(prev =>
            selectedItems.length === items.length ? [] : items.map(item => item.id)
        );
    };

    const handleItemSelect = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const deleteSelectedItems = async () => {
        if (selectedItems.length === 0) {
            setError("No items selected for deletion.");
            return;
        }
        try {
            const db = getFirestore();
            await Promise.all(selectedItems.map(itemId => deleteDoc(doc(db, 'pantryItems', itemId))));
            setSelectedItems([]);
            fetchItems();
        } catch (error) {
            console.error("Error deleting selected items:", error);
            setError('Failed to delete selected items.');
        }
    };

    const suggestRecipes = async () => {
        if (selectedItems.length === 0) {
            setError("No items selected for recipe suggestion.");
            return;
        }
        const db = getFirestore();
        let itemNames = [];
        try {
            const itemsCollection = collection(db, 'pantryItems');
            const itemSnapshotPromises = selectedItems.map(async (itemId) => {
                const itemDoc = doc(itemsCollection, itemId);
                const itemSnapshot = await getDoc(itemDoc);
                return { id: itemSnapshot.id, ...itemSnapshot.data() };
            });
            const itemSnapshots = await Promise.all(itemSnapshotPromises);
            itemNames = itemSnapshots.map(snapshot => snapshot.name);
        } catch (error) {
            console.error('Error fetching item names:', error);
            setError('Failed to fetch item names.');
            return;
        }
        const messageContent = `Generate a recipe based on the following pantry items (50 words or less): ${itemNames.join(', ')}. in JSON FORMAT Format: name:string, ingredients:list, instructions:list, and nutrition:list .`;
        setLoading(true);
        setOpenRecipeModal(true);
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "qwen/qwen-2-7b-instruct:free",
                    "messages": [
                        { "role": "user", "content": messageContent }
                    ]
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            if (data && data.choices && data.choices.length > 0) {
                const recipeMessage = data.choices[0].message.content;
                setRecipeData(recipeMessage);
            } else {
                setRecipeData('No recipes available');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to fetch recipes.');
            setRecipeData('Error fetching recipes');
        } finally {
            setLoading(false);
        }
    };

    const parseRecipeData = (data) => {
        try {
            const parsedData = JSON.parse(data);
            return (
                <Box>
                    <Typography variant="h6">{parsedData.name}</Typography>
                    <Typography variant="subtitle1">Ingredients:</Typography>
                    <List>
                        {parsedData.ingredients.map((ingredient, index) => (
                            <ListItem key={index}>
                                <ListItemText primary={ingredient} />
                            </ListItem>
                        ))}
                    </List>
                    <Typography variant="subtitle1">Instructions:</Typography>
                    <List>
                        {parsedData.instructions.map((instruction, index) => (
                            <ListItem key={index}>
                                <ListItemText primary={instruction} />
                            </ListItem>
                        ))}
                    </List>
                    <Typography variant="subtitle1">Nutrition:</Typography>
                    <List>
                        {parsedData.nutrition.map((nutrient, index) => (
                            <ListItem key={index}>
                                <ListItemText primary={nutrient} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            );
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return <Typography color="error">Error parsing recipe data.</Typography>;
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files.length > 0) {
            setNewItemImage(e.target.files[0]);
        }
    };

    const handleImageUpdate = async () => {
        if (!selectedItemForImageUpdate || !newItemImage) {
            setError("No item selected or no image uploaded.");
            return;
        }
        try {
            const db = getFirestore();
            const storage = getStorage();
            const imageRef = ref(storage, `images/${newItemImage.name}`);
            await uploadBytes(imageRef, newItemImage);
            const imageUrl = await getDownloadURL(imageRef);
            await updateItem(selectedItemForImageUpdate, { imageUrl });
            setSelectedItemForImageUpdate(null);
            setNewItemImage(null);
            fetchItems();
        } catch (error) {
            console.error("Error updating image:", error);
            setError('Failed to update image.');
        }
    };

    const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Box sx={{ width: '100%', mx: 'auto', backgroundColor: '#ffffff', color: '#333333' }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 2, textAlign: 'center', color: '#333' }}>
                Pantry Items
            </Typography>
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: <FaSearch />,
                }}
                sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Button variant="contained" startIcon={<FaPlus />} onClick={() => setOpenDialog(true)} sx={{ backgroundColor: '#4CAF50', color: '#ffffff', '&:hover': { backgroundColor: '#388E3C' } }}>
                    Add Item
                </Button>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Button variant="outlined" onClick={handleSelectAll} sx={{ borderColor: '#4CAF50', color: '#4CAF50', '&:hover': { borderColor: '#388E3C', color: '#388E3C' } }}>
                        {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button variant="outlined" onClick={deleteSelectedItems} sx={{ borderColor: '#F44336', color: '#F44336', '&:hover': { borderColor: '#C62828', color: '#C62828' } }} disabled={selectedItems.length === 0}>
                        Delete Selected
                    </Button>
                    <Button variant="outlined" onClick={suggestRecipes} sx={{ borderColor: '#FF9800', color: '#FF9800', '&:hover': { borderColor: '#F57C00', color: '#F57C00' } }} disabled={selectedItems.length === 0}>
                        Suggest Recipes
                    </Button>
                </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredItems.map((item) => (
                    <Box key={item.id} sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Checkbox checked={selectedItems.includes(item.id)} onChange={() => handleItemSelect(item.id)} />
                        {item.imageUrl ? (
                            <Avatar src={item.imageUrl} sx={{ width: 80, height: 80 }} />
                        ) : (
                            <Avatar sx={{ width: 80, height: 80, bgcolor: '#ddd' }}>
                                <FaImage />
                            </Avatar>
                        )}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6">{item.name}</Typography>
                            <Typography variant="body2">Quantity: {item.quantity}</Typography>
                        </Box>
                        <Box>
                            <IconButton onClick={() => updateItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}>
                                <FaMinus />
                            </IconButton>
                            <IconButton onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}>
                                <FaPlus />
                            </IconButton>
                            <IconButton edge="end" aria-label="edit" onClick={() => {
                                const newName = prompt('New name:', item.name);
                                if (newName !== null) {
                                    updateItem(item.id, { name: newName });
                                }
                            }}>
                                <FaEdit />
                            </IconButton>
                            <IconButton edge="end" aria-label="update image" onClick={() => setSelectedItemForImageUpdate(item.id)}>
                                <FaImage />
                            </IconButton>
                            <IconButton edge="end" aria-label="delete" onClick={() => deleteItem(item.id)}>
                                <FaTrash />
                            </IconButton>
                        </Box>
                    </Box>
                ))}
            </Box>
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add New Item</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Item Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        id="quantity"
                        label="Quantity"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(parseInt(e.target.value, 10))}
                    />
                    <Button variant="outlined" component="label" startIcon={<FaImage />} sx={{ mt: 2 }}>
                        Upload Image
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImageChange}
                        />
                    </Button>
                    {newItemImage && (
                        <Box sx={{ mt: 2 }}>
                            <Typography>Selected Image:</Typography>
                            <img src={URL.createObjectURL(newItemImage)} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover' }} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={addItem}>Add</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={selectedItemForImageUpdate !== null} onClose={() => setSelectedItemForImageUpdate(null)} fullWidth maxWidth="sm">
                <DialogTitle>Update Item Image</DialogTitle>
                <DialogContent>
                    <Button variant="outlined" component="label" startIcon={<FaImage />} sx={{ mt: 2 }}>
                        Upload New Image
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => setNewItemImage(e.target.files[0])}
                        />
                    </Button>
                    {newItemImage && (
                        <Box sx={{ mt: 2 }}>
                            <Typography>Selected Image:</Typography>
                            <img src={URL.createObjectURL(newItemImage)} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover' }} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedItemForImageUpdate(null)}>Cancel</Button>
                    <Button onClick={handleImageUpdate}>Update</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openRecipeModal} onClose={() => setOpenRecipeModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>Suggested Recipe</DialogTitle>
                <DialogContent>
                    {loading ? (
                        <CircularProgress />
                    ) : (
                        <Box>
                            {error ? (
                                <Alert severity="error">{error}</Alert>
                            ) : (
                                parseRecipeData(recipeData)
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRecipeModal(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
