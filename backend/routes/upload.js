const express = require('express');
const cloudinary = require('cloudinary').v2;
const { uploadSingle, uploadMultiple, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: `notes-ai/${Date.now()}-${filename}`,
        folder: 'notes-ai',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
          { format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    uploadStream.end(buffer);
  });
};

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private
router.post('/image', uploadSingle, handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        filename: req.file.originalname,
        size: req.file.size,
        width: result.width,
        height: result.height,
        format: result.format
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image'
    });
  }
});

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private
router.post('/images', uploadMultiple, handleMulterError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.buffer, file.originalname)
    );

    const results = await Promise.all(uploadPromises);

    const uploadedImages = results.map((result, index) => ({
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.files[index].originalname,
      size: req.files[index].size,
      width: result.width,
      height: result.height,
      format: result.format
    }));

    res.json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: {
        images: uploadedImages
      }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images'
    });
  }
});

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/image/:publicId
// @access  Private
router.delete('/image/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found or already deleted'
      });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image'
    });
  }
});

// @desc    Upload image from base64 (for paste functionality)
// @route   POST /api/upload/base64
// @access  Private
router.post('/base64', async (req, res) => {
  try {
    const { base64Data, filename = 'pasted-image.png' } = req.body;

    if (!base64Data) {
      return res.status(400).json({
        success: false,
        message: 'Base64 data is required'
      });
    }

    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Clean, 'base64');

    // Check file size (5MB limit)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image too large. Maximum size is 5MB.'
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, filename);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        filename: filename,
        size: buffer.length,
        width: result.width,
        height: result.height,
        format: result.format
      }
    });
  } catch (error) {
    console.error('Upload base64 error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image'
    });
  }
});

// @desc    Get upload statistics for user
// @route   GET /api/upload/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const Note = require('../models/Note');
    
    const stats = await Note.aggregate([
      {
        $match: {
          userId: req.user._id,
          'images.0': { $exists: true } // Notes with at least one image
        }
      },
      {
        $unwind: '$images'
      },
      {
        $group: {
          _id: null,
          totalImages: { $sum: 1 },
          totalSize: { $sum: '$images.size' },
          formats: { $addToSet: '$images.format' },
          averageSize: { $avg: '$images.size' },
          oldestUpload: { $min: '$images.uploadedAt' },
          newestUpload: { $max: '$images.uploadedAt' }
        }
      }
    ]);

    const uploadStats = stats[0] || {
      totalImages: 0,
      totalSize: 0,
      formats: [],
      averageSize: 0,
      oldestUpload: null,
      newestUpload: null
    };

    res.json({
      success: true,
      data: { stats: uploadStats }
    });
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upload statistics'
    });
  }
});

module.exports = router;
