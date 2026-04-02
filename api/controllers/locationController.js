const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const eventModel = require('../models/eventModel');
const locationModel = require('../models/locationModel');
const userModel = require('../models/userModel');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'qub-room-images',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});

const upload = multer({ storage });

const getAllLocations = async (req, res) => {
  try {
    const locations = await locationModel
      .find({ isSuggested: false }, 'title type building coordinates')
      .sort({ title: 1, building: 1, type: 1 });

    res.status(200).json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllSuggestedLocations = async (req, res) => {
  try {
    const locations = await locationModel
      .find({ isSuggested: true }, 'title type building coordinates')
      .sort({ title: 1, building: 1, type: 1 });

    res.status(200).json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const incrementViewCount = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid location id' });
  }

  try {
    await locationModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    res.status(200).json({ message: 'Request successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getLocationById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid location id' });
  }

  try {
    const location = await locationModel.findById(id).select('-viewCount -feedback');

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const { authorization } = req.headers;

    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.split(' ')[1];

      try {
        const { _id } = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(_id).select('savedLocations').populate('savedLocations');

        if (user && user.savedLocations.find(location => location._id.equals(id))) {
          return res.status(200).json({ ...location.toObject(), saved: true });
        }

        return res.status(200).json({ ...location.toObject(), saved: false });
      } catch (err) {
        return res.status(200).json({ ...location.toObject(), saved: false });
      }
    }

    res.status(200).json({ ...location.toObject(), saved: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const approveSuggestedLocation = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid location id' });
  }

  try {
    const location = await locationModel.findById(id);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (!location.isSuggested) {
      return res.status(400).json({ error: 'Location is already added' });
    }

    await locationModel.findByIdAndUpdate(id, { isSuggested: false }, { new: true });

    res.status(200).json({ message: 'Request successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createLocation = async (req, res) => {
  try {
    const location = await locationModel.create(req.body);
    res.status(201).json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteLocation = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid location id' });
  }

  try {
    const location = await locationModel.findById(id);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // remove from saved locations
    await userModel.updateMany({ savedLocations: id }, { $pull: { savedLocations: id } });

    // remove all linked events
    await eventModel.deleteMany({ location: id });

    // remove images
    if (location.imageData && location.imageData.length > 0) {
      for (const image of location.imageData) {
        await cloudinary.uploader.destroy(image.publicId).catch(err => {
          console.error(`Failed to delete image ${image.publicId}: `, err.message);
        });
      }
    }

    await locationModel.findByIdAndDelete(id);

    res.status(200).json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateLocation = async (req, res) => {
  const { id } = req.params;
  const { imagesToDelete, ...updateData } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid location id' });
  }

  try {
    const location = await locationModel.findById(id);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // remove images
    if (imagesToDelete.length > 0) {
      for (const publicId of imagesToDelete) {
        await cloudinary.uploader.destroy(publicId).catch(err => {
          console.error(`Failed to delete image ${publicId}: `, err.message);
        });
      }
    }

    const updatedLocation = await locationModel.findByIdAndUpdate(id, { ...updateData }, { new: true });

    res.status(200).json(updatedLocation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const uploadImages = (req, res) => {
  try {
    const imageData = req.files.map(file => ({ url: file.path, publicId: file.filename }));
    res.status(200).json({ imageData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload images' });
  }
};

const getLocationsWithFeedback = async (req, res) => {
  try {
    const locations = await locationModel.find(
      { feedback: { $exists: true, $not: { $size: 0 } } },
      'title type building feedback'
    );

    const locationsWithFeedbackCount = locations
      .filter(location => location.feedback.some(fb => !fb.resolved))
      .map(location => ({
        _id: location._id,
        title: location.title,
        type: location.type,
        building: location.building,
        feedbackCount: location.feedback.filter(fb => !fb.resolved).length
      }))
      .sort(
        (a, b) =>
          b.feedbackCount - a.feedbackCount ||
          a.title.localeCompare(b.title) ||
          a.building.localeCompare(b.building) ||
          a.type.localeCompare(b.type)
      );

    res.status(200).json(locationsWithFeedbackCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getLocationFeedback = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid location id' });
  }

  try {
    const location = await locationModel.findById(id).select('feedback').populate('feedback.user', 'name email');

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (Array.isArray(location.feedback)) {
      location.feedback.sort(
        (a, b) =>
          new Date(b.time) - new Date(a.time) ||
          a.user.name.localeCompare(b.user.name) ||
          a.user.email.localeCompare(b.user.email)
      );
    }

    res.status(200).json(location.feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addLocationFeedback = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid location id' });
  }

  try {
    const location = await locationModel.findById(id);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    await locationModel.findByIdAndUpdate(id, {
      $push: {
        feedback: {
          user: req.user._id,
          message
        }
      }
    });

    res.status(201).json({ message: 'Request successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateFeedbackStatus = async (req, res) => {
  const { id, feedbackId } = req.params;
  const { resolved } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid location id' });
  }

  if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
    return res.status(400).json({ error: 'Invalid feedback id' });
  }

  try {
    const location = await locationModel.findById(id);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const feedback = location.feedback.find(fb => fb._id.equals(feedbackId));

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    await locationModel.updateOne(
      { '_id': id, 'feedback._id': feedbackId },
      { $set: { 'feedback.$.resolved': resolved } }
    );

    res.status(200).json({ message: 'Request successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  upload,
  getAllLocations,
  getAllSuggestedLocations,
  incrementViewCount,
  getLocationById,
  approveSuggestedLocation,
  createLocation,
  deleteLocation,
  updateLocation,
  uploadImages,
  getLocationsWithFeedback,
  getLocationFeedback,
  addLocationFeedback,
  updateFeedbackStatus
};
