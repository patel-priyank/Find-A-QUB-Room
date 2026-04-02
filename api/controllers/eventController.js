const mongoose = require('mongoose');

const eventModel = require('../models/eventModel');

const getEvents = async (req, res) => {
  try {
    const { from, to, locationIds, isSuggested } = req.query;

    if (!from || !to || !locationIds) {
      return res.status(400).json({ error: 'Required query parameters not found: from, to, and locationIds.' });
    }

    const events = await eventModel.aggregate([
      {
        $match: {
          startDateTime: { $gte: new Date(Number(from)), $lte: new Date(Number(to)) },
          location: { $in: locationIds.split(',').map(id => mongoose.Types.ObjectId.createFromHexString(id.trim())) },
          isSuggested: isSuggested === 'true'
        }
      },
      {
        $lookup: {
          from: 'locations',
          localField: 'location',
          foreignField: '_id',
          as: 'location'
        }
      },
      { $unwind: '$location' },
      {
        $sort: {
          'startDateTime': 1,
          'endDateTime': 1,
          'location.title': 1,
          'location.building': 1,
          'location.type': 1
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          startDateTime: 1,
          endDateTime: 1,
          isSuggested: 1,
          location: {
            _id: 1,
            title: 1,
            building: 1,
            type: 1
          }
        }
      }
    ]);

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const approveSuggestedEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    const event = await eventModel.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.isSuggested) {
      return res.status(400).json({ error: 'Event is already added' });
    }

    await eventModel.findByIdAndUpdate(id, { isSuggested: false }, { new: true });

    res.status(200).json({ message: 'Request successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const event = await eventModel.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    const event = await eventModel.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await eventModel.findByIdAndDelete(id);

    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    const event = await eventModel.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updatedEvent = await eventModel.findByIdAndUpdate(id, { ...req.body }, { new: true });

    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getEvents,
  approveSuggestedEvent,
  createEvent,
  deleteEvent,
  updateEvent
};
