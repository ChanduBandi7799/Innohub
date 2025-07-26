const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  sector: String,
  problem: String,
  description: String,
  datePosted: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Problem', problemSchema);
