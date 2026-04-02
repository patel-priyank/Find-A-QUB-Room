const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const locationModel = require('../models/locationModel');
const userModel = require('../models/userModel');

const createToken = (_id, isAdmin) => {
  return jwt.sign({ _id, isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, 'name email isAdmin').sort({ name: 1, email: 1 });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.signin(email, password);

    const token = createToken(user._id, user.isAdmin);

    res.status(200).json({ name: user.name, email, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const signup = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Password confirmation failed because the values entered do not match' });
  }

  try {
    const user = await userModel.signup(name, email, password);

    // user does not have admin access when signing up
    const token = createToken(user._id, false);

    res.status(201).json({ name, email, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // remove feedback authored by this user
    await locationModel.updateMany({}, { $pull: { feedback: { user: id } } });

    await userModel.findByIdAndDelete(id);

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUserName = async (req, res) => {
  const { name } = req.body;

  try {
    const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { name }, { new: true });

    const token = createToken(updatedUser._id, updatedUser.isAdmin);

    res.status(200).json({ name: updatedUser.name, email: updatedUser.email, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  try {
    const user = await userModel.findById(req.user._id).select('password');

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Password confirmation failed because the values entered do not match' });
    }

    if (!validator.isStrongPassword(newPassword)) {
      return res
        .status(400)
        .json({ error: 'Use a stronger password with uppercase and lowercase letters, numbers, and symbols' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from the old password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    const updatedUser = await userModel.findByIdAndUpdate(user._id, { password: hash }, { new: true });

    const token = createToken(updatedUser._id, updatedUser.isAdmin);

    res.status(200).json({ name: updatedUser.name, email: updatedUser.email, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const grantAdminAccess = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userModel.findById(id).select('isAdmin');

    if (user.isAdmin) {
      return res.status(400).json({ error: 'Admin access already granted' });
    }

    await userModel.findByIdAndUpdate(id, { isAdmin: true });

    res.status(200).json({ message: 'Request successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const revokeAdminAccess = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userModel.findById(id).select('isAdmin');

    if (!user.isAdmin) {
      return res.status(400).json({ error: 'Admin access not yet granted' });
    }

    await userModel.findByIdAndUpdate(id, { isAdmin: false });

    res.status(200).json({ message: 'Request successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSavedLocations = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).populate({
      path: 'savedLocations',
      select: 'title type building',
      options: { sort: { title: 1, building: 1, type: 1 } }
    });

    res.status(200).json(user.savedLocations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const saveLocation = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid location id' });
  }

  try {
    const user = await userModel.findById(req.user._id);

    if (user.savedLocations.includes(id)) {
      return res.status(400).json({ error: 'Location already saved' });
    }

    await userModel.findByIdAndUpdate(req.user._id, { $addToSet: { savedLocations: id } });

    res.status(200).json({ message: 'Request successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const unsaveLocation = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid location id' });
  }

  try {
    const user = await userModel.findById(req.user._id);

    if (!user.savedLocations.includes(id)) {
      return res.status(400).json({ error: 'Location not in saved list' });
    }

    await userModel.findByIdAndUpdate(req.user._id, { $pull: { savedLocations: id } });

    res.status(200).json({ message: 'Request successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers,
  signin,
  signup,
  deleteUser,
  updateUserName,
  updateUserPassword,
  grantAdminAccess,
  revokeAdminAccess,
  getSavedLocations,
  saveLocation,
  unsaveLocation
};
