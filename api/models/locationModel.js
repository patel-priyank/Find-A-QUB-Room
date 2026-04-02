const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const locationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true
    },
    building: {
      type: String,
      trim: true,
      default: ''
    },
    floor: {
      type: String,
      default: ''
    },
    coordinates: {
      type: [Number],
      required: true
    },
    directions: {
      type: String,
      trim: true,
      default: ''
    },
    additionalInfo: {
      type: String,
      trim: true,
      default: ''
    },
    isAccessible: {
      type: String,
      required: true
    },
    isSuggested: {
      type: Boolean,
      required: true
    },
    imageData: {
      type: [
        {
          url: {
            type: String,
            required: true
          },
          publicId: {
            type: String,
            required: true
          }
        }
      ],
      default: []
    },
    openDays: {
      type: [
        {
          key: {
            type: String,
            required: true
          },
          label: {
            type: String,
            required: true
          },
          openOnDay: {
            type: Boolean,
            required: true
          },
          openingTime: {
            type: String,
            required: true
          },
          closingTime: {
            type: String,
            required: true
          }
        }
      ],
      required: true
    },
    feedback: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
          },
          message: {
            type: String,
            trim: true,
            required: true
          },
          time: {
            type: Date,
            default: Date.now
          },
          resolved: {
            type: Boolean,
            default: false
          }
        }
      ],
      default: []
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Location', locationSchema);
