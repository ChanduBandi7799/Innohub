const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');

// Delete Problem
// POST: Delete problem
router.post('/problem/delete/:id', async (req, res) => {
  try {
    await Problem.findByIdAndDelete(req.params.id);
    console.log('Problem deleted:', req.params.id);
    res.redirect('/profile');
  } catch (err) {
    console.error('Error deleting problem:', err);
    res.status(500).send('Error deleting problem');
  }
});

module.exports = router;
