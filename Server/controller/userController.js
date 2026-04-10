const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users/
// @access  Private
const getUsers = async (req, res) => {
  try {
    const { status } = req.query;
    console.log(`[getUsers] Fetching users with status filter: "${status}"`);
    let users;

    let query = {
      role: { $ne: 'vendor' }
    };
    
    if (status && status !== 'all-users') {
      let statusValue = status;
      if (status === 'active-users') statusValue = 'active';
      if (status === 'inactive-users') statusValue = 'inactive';
      if (status === 'banned-users') statusValue = 'banned';
      if (status === 'unverified-email') statusValue = 'unverified-email';
      if (status === 'unverified-mobile') statusValue = 'unverified-mobile';
      if (status === 'subscribers') statusValue = 'subscriber';
      
      if (statusValue !== 'all-users') {
        query = { status: statusValue };
      }
    }
    
    console.log('[getUsers] Querying database with:', JSON.stringify(query));
    try {
      users = await User.find(query).sort({ createdAt: -1 });
      console.log("hello", users);
    } catch (dbError) {
      console.error('[getUsers] Database query failed:', dbError);
      throw dbError; // re-throw to be caught by the outer catch block
    }
    console.log(`[getUsers] Found ${users?.length || 0} users`);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('[getUsers] Error occurred:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id/
// @access  Private
const getUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error && 'message' in error) {
      message = error.message;
    }

    res.status(500).json({
      success: false,
      message
    });
  }
};

// @desc    Create new user
// @route   POST /api/users/
// @access  Private
const createUser = async (req, res) => {
  try {
    let user = await User.create(req.body);

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'name' in error &&
      error.name === 'ValidationError' &&
      'errors' in error
    ) {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    } else {
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      else if (typeof error === 'object' && error && 'message' in error) message = error.message;

      res.status(500).json({
        success: false,
        message
      });
    }
  }
};

// @desc    Update user
// @route   PUT /api/users/:id/
// @access  Private
const updateUser = async (req, res) => {
  try {
    let user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'name' in error &&
      error.name === 'ValidationError' &&
      'errors' in error
    ) {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    } else {
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      else if (typeof error === 'object' && error && 'message' in error) message = error.message;

      res.status(500).json({
        success: false,
        message
      });
    }
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id/
// @access  Private
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    else if (typeof error === 'object' && error && 'message' in error) message = error.message;

    res.status(500).json({
      success: false,
      message
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
