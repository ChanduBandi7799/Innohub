// models/Problem.js
const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  sector: String,
  title: String,
  description: String,
  contributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  datePosted: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Problem', problemSchema);
