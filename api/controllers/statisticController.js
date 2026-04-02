const locationModel = require('../models/locationModel');
const statisticModel = require('../models/statisticModel');
const userModel = require('../models/userModel');

const incrementAppVisits = async (req, res) => {
  try {
    await statisticModel.findOneAndUpdate({}, { $inc: { appVisits: 1 } }, { new: true, upsert: true });
    res.status(200).json({ message: 'Request successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStatistics = async (req, res) => {
  try {
    const admins = await userModel.countDocuments({ isAdmin: true });
    const users = (await userModel.countDocuments()) - admins;
    const stats = await statisticModel.findOne({});

    const mostViewedLocations = await locationModel.aggregate([
      { $match: { viewCount: { $gt: 0 }, isSuggested: false } },
      {
        $project: {
          _id: 1,
          title: 1,
          type: 1,
          building: 1,
          viewCount: 1
        }
      },
      { $sort: { viewCount: -1, title: 1, building: 1, type: 1 } },
      { $limit: 5 }
    ]);

    const mostSavedLocations = await userModel.aggregate([
      { $unwind: '$savedLocations' },
      { $group: { _id: '$savedLocations', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'locations',
          localField: '_id',
          foreignField: '_id',
          as: 'location'
        }
      },
      { $unwind: '$location' },
      {
        $project: {
          _id: '$location._id',
          title: '$location.title',
          type: '$location.type',
          building: '$location.building',
          count: '$count'
        }
      },
      { $sort: { count: -1, title: 1, building: 1, type: 1 } },
      { $limit: 5 }
    ]);

    const locationsByType = await locationModel.aggregate([
      { $match: { isSuggested: { $eq: false } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } }
    ]);

    res.status(200).json({
      users,
      admins,
      mostViewedLocations,
      mostSavedLocations,
      locationsByType,
      appVisits: stats.appVisits
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { incrementAppVisits, getStatistics };
