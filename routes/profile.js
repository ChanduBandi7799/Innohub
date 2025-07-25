import express from 'express';
import mongoose from 'mongoose';
import User from './models/User.js';
import Idea from './models/Idea.js';

const app = express();
app.use(express.urlencoded({ extended: true }));

// POST: Update profile
app.post('/edit-profile', async (req, res) => {
  const { name, email, bio } = req.body;
  const userId = req.session.userId; // assuming user is logged in

  try {
    await User.findByIdAndUpdate(userId, { name, email, bio });
    res.redirect('/profile'); // or render profile again
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile');
  }
});

// GET: Edit problem page
app.get('/edit-idea/:id', async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    res.render('edit-idea', { idea });
  } catch (err) {
    console.error(err);
    res.status(500).send('Problem not found');
  }
});

// POST: Update problem
app.post('/edit-idea/:id', async (req, res) => {
  const { sector, problem, description } = req.body;
  try {
    await Idea.findByIdAndUpdate(req.params.id, { sector, problem, description });
    res.redirect('/profile'); // or ideas list
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating idea');
  }
});
