const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const statisticSchema = new Schema({
  appVisits: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Statistic', statisticSchema);
