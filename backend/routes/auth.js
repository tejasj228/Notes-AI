const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, loginMethod = 'email' } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    if (loginMethod === 'email' && !password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for email signup'
      });
    }

    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      loginMethod
    };

    if (loginMethod === 'email') {
      userData.password = password;
    }

    const user = await User.create(userData);

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          loginMethod: user.loginMethod,
          preferences: user.preferences,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, loginMethod = 'email' } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (loginMethod === 'email' && !password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Find user and include password for verification
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password for email login
    if (loginMethod === 'email') {
      const isPasswordCorrect = await user.correctPassword(password);
      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          loginMethod: user.loginMethod,
          preferences: user.preferences,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
});

// @desc    Google OAuth login/signup
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { user: googleUser } = req.body;

    if (!googleUser || !googleUser.email || !googleUser.displayName) {
      return res.status(400).json({
        success: false,
        message: 'Google user data is required'
      });
    }

    console.log('Google auth attempt for:', googleUser.email);

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email.toLowerCase().trim() });

    if (user) {
      // User exists, update info if needed
      if (googleUser.photoURL && user.avatar !== googleUser.photoURL) {
        user.avatar = googleUser.photoURL;
        await user.save();
      }
      console.log('Existing Google user logged in:', user.email);
    } else {
      // Create new user
      user = await User.create({
        name: googleUser.displayName || googleUser.name || 'Google User',
        email: googleUser.email.toLowerCase().trim(),
        loginMethod: 'google',
        googleId: googleUser.uid,
        avatar: googleUser.photoURL || null
      });
      console.log('Created new Google user:', user.email);
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: user.isNew ? 'User registered successfully' : 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          loginMethod: user.loginMethod,
          avatar: user.avatar,
          preferences: user.preferences,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error with Google authentication'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          loginMethod: user.loginMethod,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// @desc    Update user preferences
// @route   PATCH /api/auth/preferences
// @access  Private
router.patch('/preferences', async (req, res) => {
  try {
    const { theme, defaultNoteColor, defaultNoteSize } = req.body;
    
    const updateData = {};
    if (theme) updateData['preferences.theme'] = theme;
    if (defaultNoteColor) updateData['preferences.defaultNoteColor'] = defaultNoteColor;
    if (defaultNoteSize) updateData['preferences.defaultNoteSize'] = defaultNoteSize;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
});

module.exports = router;
