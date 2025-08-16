const express = require('express');
const Note = require('../models/Note');
const { checkResourceOwnership } = require('../middleware/auth');
const { getRandomSize, getRandomColor } = require('../utils/helpers');
const { createCacheMiddleware, keyGenerators, invalidateUserCache } = require('../middleware/cache');

const router = express.Router();

// @desc    Get all user's notes
// @route   GET /api/notes
// @access  Private
router.get('/', createCacheMiddleware(require('../middleware/cache').notesCache, keyGenerators.notes), async (req, res) => {
  try {
    console.log('Backend Notes - User ID from token:', req.user._id);
    console.log('Backend Notes - User object:', req.user);
    
    const { folder, pinned, search, limit = 50, skip = 0 } = req.query;
    
    let query = { userId: req.user._id, isTrashed: false };
    console.log('Backend Notes - Query for notes:', query);
    
    // Filter by folder
    if (folder !== undefined) {
      query.folderId = folder === 'null' || folder === '' ? null : folder;
    }
    
    // Filter by pinned status
    if (pinned !== undefined) {
      query.isPinned = pinned === 'true';
    }
    
    // Search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { keywords: { $in: [searchRegex] } }
      ];
    }
    
    // Use lean() for better performance and select only needed fields
    const notes = await Note.find(query, {
      title: 1,
      content: 1,
      keywords: 1,
      color: 1,
      size: 1,
      order: 1,
      folderId: 1,
      isPinned: 1,
      createdAt: 1,
      updatedAt: 1,
      lastEditedAt: 1
      // Exclude heavy fields like images by default
    })
      .populate('folderId', 'name color')
      .sort({ order: 1, updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Get total count only if needed for pagination
    let totalCount = null;
    if (parseInt(skip) === 0) {
      // Only count on first page request
      totalCount = await Note.countDocuments(query);
    }

    res.json({
      success: true,
      data: {
        notes,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: notes.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes'
    });
  }
});

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
router.get('/:id', checkResourceOwnership(Note), async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('folderId', 'name color')
      .lean();

    res.json({
      success: true,
      data: { note }
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note'
    });
  }
});

// @desc    Create new note
// @route   POST /api/notes
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { 
      title = 'Untitled Note', 
      content = '', 
      keywords = [], 
      color, 
      size,
      folderId = null,
      isPinned = false 
    } = req.body;

    // Use provided color or generate random one
    const noteColor = color || getRandomColor();
    
    // Use provided size or generate random one
    const noteSize = size || getRandomSize();

    // Get the lowest order in the target location (folder or root) to put new notes at top
    const minOrderNote = await Note.findOne({
      userId: req.user._id,
      folderId: folderId || null,
      isTrashed: false
    }).sort({ order: 1 });

    const newOrder = minOrderNote ? minOrderNote.order - 1 : 0;

    const note = await Note.create({
      title: title.trim(),
      content,
      keywords: Array.isArray(keywords) ? keywords.slice(0, 3) : [], // Limit to 3 keywords
      color: noteColor,
      size: noteSize,
      folderId: folderId || null,
      isPinned,
      userId: req.user._id,
      order: newOrder
    });

    // Populate folder info
    await note.populate('folderId', 'name color');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note }
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating note'
    });
  }
});

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
router.put('/:id', checkResourceOwnership(Note), async (req, res) => {
  try {
    const allowedUpdates = [
      'title', 'content', 'keywords', 'color', 'size', 
      'folderId', 'isPinned', 'order'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'keywords' && Array.isArray(req.body[key])) {
          updates[key] = req.body[key].slice(0, 3); // Limit to 3 keywords
        } else if (key === 'title' && req.body[key]) {
          updates[key] = req.body[key].trim();
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('folderId', 'name color');

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: { note }
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating note'
    });
  }
});

// @desc    Reorder notes
// @route   PATCH /api/notes/reorder
// @access  Private
router.patch('/reorder', async (req, res) => {
  try {
    const { noteOrders, folderId = null } = req.body;
    
    if (!Array.isArray(noteOrders)) {
      return res.status(400).json({
        success: false,
        message: 'noteOrders must be an array'
      });
    }

    // Update orders for each note
    const updatePromises = noteOrders.map(({ noteId, order }) => 
      Note.findOneAndUpdate(
        { 
          _id: noteId, 
          userId: req.user._id, 
          folderId: folderId || null,
          isTrashed: false 
        },
        { order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Notes reordered successfully'
    });
  } catch (error) {
    console.error('Reorder notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering notes'
    });
  }
});

// @desc    Move note to trash
// @route   DELETE /api/notes/:id
// @access  Private
router.delete('/:id', checkResourceOwnership(Note), async (req, res) => {
  try {
    await req.resource.moveToTrash();

    res.json({
      success: true,
      message: 'Note moved to trash'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error moving note to trash'
    });
  }
});

// @desc    Duplicate note
// @route   POST /api/notes/:id/duplicate
// @access  Private
router.post('/:id/duplicate', checkResourceOwnership(Note), async (req, res) => {
  try {
    const originalNote = req.resource;
    
    // Get the highest order in the same location
    const maxOrderNote = await Note.findOne({
      userId: req.user._id,
      folderId: originalNote.folderId,
      isTrashed: false
    }).sort({ order: -1 });

    const newOrder = maxOrderNote ? maxOrderNote.order + 1 : 0;

    // Create duplicate
    const duplicateNote = await Note.create({
      title: `${originalNote.title} (Copy)`,
      content: originalNote.content,
      keywords: [...originalNote.keywords],
      color: originalNote.color,
      size: originalNote.size,
      folderId: originalNote.folderId,
      userId: req.user._id,
      order: newOrder,
      images: [...originalNote.images] // Copy images array
    });

    // Populate folder info
    await duplicateNote.populate('folderId', 'name color');

    res.status(201).json({
      success: true,
      message: 'Note duplicated successfully',
      data: { note: duplicateNote }
    });
  } catch (error) {
    console.error('Duplicate note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error duplicating note'
    });
  }
});

// @desc    Add image to note
// @route   POST /api/notes/:id/images
// @access  Private
router.post('/:id/images', checkResourceOwnership(Note), async (req, res) => {
  try {
    const { url, filename, publicId, size } = req.body;
    
    if (!url || !filename) {
      return res.status(400).json({
        success: false,
        message: 'URL and filename are required'
      });
    }

    const imageData = {
      url,
      filename,
      publicId,
      size,
      uploadedAt: new Date()
    };

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $push: { images: imageData } },
      { new: true, runValidators: true }
    ).populate('folderId', 'name color');

    res.json({
      success: true,
      message: 'Image added to note',
      data: { note }
    });
  } catch (error) {
    console.error('Add image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding image to note'
    });
  }
});

// @desc    Remove image from note
// @route   DELETE /api/notes/:id/images/:imageId
// @access  Private
router.delete('/:id/images/:imageId', checkResourceOwnership(Note), async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $pull: { images: { _id: req.params.imageId } } },
      { new: true }
    ).populate('folderId', 'name color');

    res.json({
      success: true,
      message: 'Image removed from note',
      data: { note }
    });
  } catch (error) {
    console.error('Remove image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing image from note'
    });
  }
});

module.exports = router;
