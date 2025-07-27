const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: String,
  sector: String,
  description: String,
  contributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  datePosted: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Prevent OverwriteModelError and ensure proper export
const Problem = mongoose.models.Problem || mongoose.model('Problem', problemSchema);

module.exports = Problem;