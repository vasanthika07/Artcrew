const express = require('express');
const router = express.Router();
const { getGallery, getGalleryItem, createGalleryItem, updateGalleryItem, deleteGalleryItem } = require('../controllers/galleryController');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

router.get('/', getGallery);
router.get('/:id', getGalleryItem);
router.post('/', authenticate, requireRole('admin'), createGalleryItem);
router.put('/:id', authenticate, requireRole('admin'), updateGalleryItem);
router.delete('/:id', authenticate, requireRole('admin'), deleteGalleryItem);

module.exports = router;
