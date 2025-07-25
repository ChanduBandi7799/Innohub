const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');

// Delete Problem
router.post('/delete-problem/:id', async (req, res) => {
  try {
    await Problem.findByIdAndDelete(req.params.id);
    res.redirect('/profile'); // Go back to profile after deletion
  } catch (err) {
    console.error('Error deleting problem:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
