const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper to strip sensitive data (consistent with authController)
const toPublicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  company: user.company,
  createdAt: user.createdAt,
});

// GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.status(200).json({
      success: true,
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error('getProfile error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// PATCH /api/user/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, company } = req.body;
    
    // Only allow updating name and company via this endpoint
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (company !== undefined) updates.company = company.trim();
    
    // Validate if name was provided but empty
    if (updates.name === '') {
      return res.status(400).json({ success: false, message: 'Name cannot be empty' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error('updateProfile error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};


// PATCH /api/user/password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }
    
    // Hash new password using identical logic to authController
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('updatePassword error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update password' });
  }
};
