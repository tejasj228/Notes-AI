const express = require('express');
const Note = require('../models/Note');
const { checkResourceOwnership } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all trashed notes
// @route   GET /api/trash
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    
    const trashedNotes = await Note.find({
      userId: req.user._id,
      isTrashed: true
    })
      .populate('folderId', 'name color')
      .sort({ trashedAt: -1 }) // Most recently trashed first
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Get total count for pagination
    const totalCount = await Note.countDocuments({
      userId: req.user._id,
      isTrashed: true
    });

    res.json({
      success: true,
      data: {
        notes: trashedNotes,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: totalCount > parseInt(skip) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get trash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trashed notes'
    });
  }
});

// @desc    Restore note from trash
// @route   PATCH /api/trash/:id/restore
// @access  Private
router.patch('/:id/restore', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isTrashed: true
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Trashed note not found'
      });
    }

    // Get the lowest order in the target location (folder or root) to put restored note at top
    const minOrderNote = await Note.findOne({
      userId: req.user._id,
      folderId: note.folderId,
      isTrashed: false
    }).sort({ order: 1 });

    // Restore note with new order at the top
    const newOrder = minOrderNote ? minOrderNote.order - 1 : 0;
    
    await note.restoreFromTrash();
    note.order = newOrder;
    await note.save();

    // Populate folder info
    await note.populate('folderId', 'name color');

    res.json({
      success: true,
      message: 'Note restored successfully',
      data: { note }
    });
  } catch (error) {
    console.error('Restore note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring note'
    });
  }
});

// @desc    Permanently delete note
// @route   DELETE /api/trash/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isTrashed: true
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Trashed note not found'
      });
    }

    await note.permanentDelete();

    res.json({
      success: true,
      message: 'Note permanently deleted'
    });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error permanently deleting note'
    });
  }
});

// @desc    Empty trash (delete all trashed notes)
// @route   DELETE /api/trash/empty
// @access  Private
router.delete('/empty', async (req, res) => {
  try {
    const result = await Note.deleteMany({
      userId: req.user._id,
      isTrashed: true
    });

    res.json({
      success: true,
      message: `${result.deletedCount} notes permanently deleted`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Empty trash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error emptying trash'
    });
  }
});

// @desc    Restore all notes from trash
// @route   PATCH /api/trash/restore-all
// @access  Private
router.patch('/restore-all', async (req, res) => {
  try {
    const trashedNotes = await Note.find({
      userId: req.user._id,
      isTrashed: true
    });

    if (trashedNotes.length === 0) {
      return res.json({
        success: true,
        message: 'No notes in trash to restore',
        data: { restoredCount: 0 }
      });
    }

    // Restore all notes
    const restorePromises = trashedNotes.map(async (note, index) => {
      // Get the lowest order in the target location to put restored notes at top
      const minOrderNote = await Note.findOne({
        userId: req.user._id,
        folderId: note.folderId,
        isTrashed: false
      }).sort({ order: 1 });

      // Put restored notes at the beginning, with older trashed notes first
      const newOrder = minOrderNote ? minOrderNote.order - trashedNotes.length + index : index;
      
      await note.restoreFromTrash();
      note.order = newOrder;
      return note.save();
    });

    await Promise.all(restorePromises);

    res.json({
      success: true,
      message: `${trashedNotes.length} notes restored successfully`,
      data: {
        restoredCount: trashedNotes.length
      }
    });
  } catch (error) {
    console.error('Restore all error:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring all notes'
    });
  }
});

// @desc    Get trash statistics
// @route   GET /api/trash/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const stats = await Note.aggregate([
      {
        $match: {
          userId: req.user._id,
          isTrashed: true
        }
      },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          oldestTrashedAt: { $min: '$trashedAt' },
          newestTrashedAt: { $max: '$trashedAt' },
          totalSize: { $sum: { $strLenCP: '$content' } },
          folderDistribution: {
            $push: {
              $cond: [
                { $eq: ['$folderId', null] },
                'root',
                '$folderId'
              ]
            }
          }
        }
      }
    ]);

    const trashStats = stats[0] || {
      totalNotes: 0,
      oldestTrashedAt: null,
      newestTrashedAt: null,
      totalSize: 0,
      folderDistribution: []
    };

    res.json({
      success: true,
      data: { stats: trashStats }
    });
  } catch (error) {
    console.error('Get trash stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trash statistics'
    });
  }
});

// @desc    Auto-cleanup old trashed notes (30+ days)
// @route   DELETE /api/trash/cleanup
// @access  Private
router.delete('/cleanup', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Note.deleteMany({
      userId: req.user._id,
      isTrashed: true,
      trashedAt: { $lt: thirtyDaysAgo }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} old notes cleaned up`,
      data: {
        deletedCount: result.deletedCount,
        cleanupDate: thirtyDaysAgo
      }
    });
  } catch (error) {
    console.error('Cleanup trash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up old trashed notes'
    });
  }
});

module.exports = router;
