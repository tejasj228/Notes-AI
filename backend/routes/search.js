const express = require('express');
const Note = require('../models/Note');
const Folder = require('../models/Folder');

const router = express.Router();

// @desc    Search notes and folders
// @route   GET /api/search
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      q: searchTerm, 
      type = 'all', // 'notes', 'folders', 'all'
      folder,
      color,
      size,
      limit = 20,
      skip = 0 
    } = req.query;

    if (!searchTerm || !searchTerm.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const results = {};

    // Search notes
    if (type === 'notes' || type === 'all') {
      let noteQuery = {
        userId: req.user._id,
        isTrashed: false,
        $or: [
          { title: { $regex: searchTerm.trim(), $options: 'i' } },
          { content: { $regex: searchTerm.trim(), $options: 'i' } },
          { keywords: { $in: [new RegExp(searchTerm.trim(), 'i')] } }
        ]
      };

      // Additional filters
      if (folder !== undefined) {
        noteQuery.folderId = folder === 'null' || folder === '' ? null : folder;
      }
      if (color) {
        noteQuery.color = color;
      }
      if (size) {
        noteQuery.size = size;
      }

      const notes = await Note.find(noteQuery)
        .populate('folderId', 'name color')
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

      // Get total count for notes
      const notesCount = await Note.countDocuments(noteQuery);

      results.notes = {
        data: notes,
        count: notesCount,
        hasMore: notesCount > parseInt(skip) + parseInt(limit)
      };
    }

    // Search folders
    if (type === 'folders' || type === 'all') {
      const folderQuery = {
        userId: req.user._id,
        name: { $regex: searchTerm.trim(), $options: 'i' }
      };

      const folders = await Folder.find(folderQuery)
        .sort({ name: 1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

      // Get notes count for each folder
      const foldersWithCount = await Promise.all(
        folders.map(async (folder) => {
          const notesCount = await Note.countDocuments({
            folderId: folder._id,
            isTrashed: false
          });
          return { ...folder, notesCount };
        })
      );

      const foldersCount = await Folder.countDocuments(folderQuery);

      results.folders = {
        data: foldersWithCount,
        count: foldersCount,
        hasMore: foldersCount > parseInt(skip) + parseInt(limit)
      };
    }

    res.json({
      success: true,
      data: {
        searchTerm: searchTerm.trim(),
        results,
        pagination: {
          limit: parseInt(limit),
          skip: parseInt(skip)
        }
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search'
    });
  }
});

// @desc    Advanced search with multiple criteria
// @route   POST /api/search/advanced
// @access  Private
router.post('/advanced', async (req, res) => {
  try {
    const {
      title,
      content,
      keywords,
      colors = [],
      sizes = [],
      folders = [],
      dateRange = {},
      wordCountRange = {},
      hasImages,
      isPinned,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      limit = 20,
      skip = 0
    } = req.body;

    let query = {
      userId: req.user._id,
      isTrashed: false
    };

    // Build search conditions
    const searchConditions = [];

    if (title && title.trim()) {
      searchConditions.push({ title: { $regex: title.trim(), $options: 'i' } });
    }

    if (content && content.trim()) {
      searchConditions.push({ content: { $regex: content.trim(), $options: 'i' } });
    }

    if (keywords && keywords.length > 0) {
      const keywordRegexes = keywords.map(keyword => new RegExp(keyword.trim(), 'i'));
      searchConditions.push({ keywords: { $in: keywordRegexes } });
    }

    if (searchConditions.length > 0) {
      query.$and = searchConditions;
    }

    // Filter by colors
    if (colors.length > 0) {
      query.color = { $in: colors };
    }

    // Filter by sizes
    if (sizes.length > 0) {
      query.size = { $in: sizes };
    }

    // Filter by folders
    if (folders.length > 0) {
      const folderConditions = folders.map(folderId => 
        folderId === 'root' ? null : folderId
      );
      query.folderId = { $in: folderConditions };
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      query.updatedAt = {};
      if (dateRange.start) {
        query.updatedAt.$gte = new Date(dateRange.start);
      }
      if (dateRange.end) {
        query.updatedAt.$lte = new Date(dateRange.end);
      }
    }

    // Word count range (using aggregation for this)
    let pipeline = [{ $match: query }];

    if (wordCountRange.min !== undefined || wordCountRange.max !== undefined) {
      pipeline.push({
        $addFields: {
          wordCount: {
            $size: {
              $split: [{ $trim: { input: '$content' } }, ' ']
            }
          }
        }
      });

      const wordCountFilter = {};
      if (wordCountRange.min !== undefined) {
        wordCountFilter.$gte = wordCountRange.min;
      }
      if (wordCountRange.max !== undefined) {
        wordCountFilter.$lte = wordCountRange.max;
      }

      pipeline.push({
        $match: { wordCount: wordCountFilter }
      });
    }

    // Images filter
    if (hasImages !== undefined) {
      if (hasImages) {
        query['images.0'] = { $exists: true };
      } else {
        query.images = { $size: 0 };
      }
    }

    // Pinned filter
    if (isPinned !== undefined) {
      query.isPinned = isPinned;
    }

    // Add sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    pipeline.push({
      $lookup: {
        from: 'folders',
        localField: 'folderId',
        foreignField: '_id',
        as: 'folder'
      }
    });

    pipeline.push({
      $addFields: {
        folder: { $arrayElemAt: ['$folder', 0] }
      }
    });

    pipeline.push({ $sort: sortOptions });
    pipeline.push({ $skip: parseInt(skip) });
    pipeline.push({ $limit: parseInt(limit) });

    const notes = await Note.aggregate(pipeline);

    // Get total count
    const countPipeline = [
      { $match: query }
    ];

    if (wordCountRange.min !== undefined || wordCountRange.max !== undefined) {
      countPipeline.push({
        $addFields: {
          wordCount: {
            $size: {
              $split: [{ $trim: { input: '$content' } }, ' ']
            }
          }
        }
      });

      const wordCountFilter = {};
      if (wordCountRange.min !== undefined) {
        wordCountFilter.$gte = wordCountRange.min;
      }
      if (wordCountRange.max !== undefined) {
        wordCountFilter.$lte = wordCountRange.max;
      }

      countPipeline.push({
        $match: { wordCount: wordCountFilter }
      });
    }

    countPipeline.push({ $count: 'total' });

    const countResult = await Note.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        notes,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: totalCount > parseInt(skip) + parseInt(limit)
        },
        filters: {
          title,
          content,
          keywords,
          colors,
          sizes,
          folders,
          dateRange,
          wordCountRange,
          hasImages,
          isPinned
        }
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing advanced search'
    });
  }
});

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Private
router.get('/suggestions', async (req, res) => {
  try {
    const { q: partial } = req.query;

    if (!partial || partial.trim().length < 2) {
      return res.json({
        success: true,
        data: { suggestions: [] }
      });
    }

    const suggestions = new Set();

    // Get title suggestions
    const titleMatches = await Note.find({
      userId: req.user._id,
      isTrashed: false,
      title: { $regex: partial.trim(), $options: 'i' }
    })
      .select('title')
      .limit(5)
      .lean();

    titleMatches.forEach(note => {
      if (note.title.toLowerCase().includes(partial.toLowerCase())) {
        suggestions.add(note.title);
      }
    });

    // Get keyword suggestions
    const keywordMatches = await Note.find({
      userId: req.user._id,
      isTrashed: false,
      keywords: { $in: [new RegExp(partial.trim(), 'i')] }
    })
      .select('keywords')
      .limit(10)
      .lean();

    keywordMatches.forEach(note => {
      note.keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(partial.toLowerCase())) {
          suggestions.add(keyword);
        }
      });
    });

    // Get folder name suggestions
    const folderMatches = await Folder.find({
      userId: req.user._id,
      name: { $regex: partial.trim(), $options: 'i' }
    })
      .select('name')
      .limit(3)
      .lean();

    folderMatches.forEach(folder => {
      if (folder.name.toLowerCase().includes(partial.toLowerCase())) {
        suggestions.add(folder.name);
      }
    });

    res.json({
      success: true,
      data: {
        suggestions: Array.from(suggestions).slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching search suggestions'
    });
  }
});

// @desc    Get search statistics
// @route   GET /api/search/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const stats = await Note.aggregate([
      {
        $match: {
          userId: req.user._id,
          isTrashed: false
        }
      },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          totalWords: {
            $sum: {
              $size: {
                $split: [{ $trim: { input: '$content' } }, ' ']
              }
            }
          },
          averageWords: {
            $avg: {
              $size: {
                $split: [{ $trim: { input: '$content' } }, ' ']
              }
            }
          },
          colorDistribution: { $push: '$color' },
          sizeDistribution: { $push: '$size' },
          keywordDistribution: { $push: '$keywords' }
        }
      }
    ]);

    const searchStats = stats[0] || {
      totalNotes: 0,
      totalWords: 0,
      averageWords: 0,
      colorDistribution: [],
      sizeDistribution: [],
      keywordDistribution: []
    };

    // Process distributions
    const colorCounts = {};
    searchStats.colorDistribution.forEach(color => {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });

    const sizeCounts = {};
    searchStats.sizeDistribution.forEach(size => {
      sizeCounts[size] = (sizeCounts[size] || 0) + 1;
    });

    const keywordCounts = {};
    searchStats.keywordDistribution.flat().forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });

    // Get top keywords
    const topKeywords = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    res.json({
      success: true,
      data: {
        stats: {
          totalNotes: searchStats.totalNotes,
          totalWords: searchStats.totalWords,
          averageWords: Math.round(searchStats.averageWords),
          colorDistribution: colorCounts,
          sizeDistribution: sizeCounts,
          topKeywords
        }
      }
    });
  } catch (error) {
    console.error('Search stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching search statistics'
    });
  }
});

module.exports = router;
