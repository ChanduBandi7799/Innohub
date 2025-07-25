const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  sector: String,
  problem: String,
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

// ✅ Prevent OverwriteModelError
module.exports = mongoose.models.Idea || mongoose.model('Idea', ideaSchema);
