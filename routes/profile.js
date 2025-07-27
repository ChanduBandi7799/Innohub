import express from 'express';
import mongoose from 'mongoose';
import User from './models/User.js';
import Idea from './models/Idea.js';
import Problem from './models/Problem.js';

const app = express();
app.use(express.urlencoded({ extended: true }));

// GET: Show edit profile page
app.get('/profile/edit', async (req, res) => {
  try {
    const userId = req.session.userId; // assuming user is logged in
    
    // Fetch user data
    const user = await User.findById(userId);
    
    // Fetch user's ideas using contributorId
    const ideas = await Idea.find({ contributorId: userId });
    
    // Fetch user's problems using contributorId
    const problems = await Problem.find({ contributorId: userId });
    
    console.log('User:', user);
    console.log('Ideas found:', ideas.length);
    console.log('Problems found:', problems.length);
    
    res.render('edit-profile', { 
      user, 
      ideas, 
      problems 
    });
  } catch (err) {
    console.error('Error fetching profile data:', err);
    res.status(500).send('Error loading profile');
  }
});

// POST: Update profile
app.post('/profile/edit', async (req, res) => {
  const { name, bio } = req.body;
  const userId = req.session.userId;

  try {
    await User.findByIdAndUpdate(userId, { name, bio });
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile');
  }
});

// GET: Edit specific idea
app.get('/idea/edit/:id', async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).send('Idea not found');
    }
    res.render('edit-idea', { idea });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading idea');
  }
});

// POST: Update idea
app.post('/idea/edit/:id', async (req, res) => {
  const { sector, problem, description } = req.body;
  try {
    await Idea.findByIdAndUpdate(req.params.id, { sector, problem, description });
    res.redirect('/profile/edit');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating idea');
  }
});

// POST: Delete idea
app.post('/idea/delete/:id', async (req, res) => {
  try {
    await Idea.findByIdAndDelete(req.params.id);
    res.redirect('/profile/edit');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting idea');
  }
});

// GET: Edit specific problem
app.get('/problem/edit/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).send('Problem not found');
    }
    res.render('edit-problem', { problem });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading problem');
  }
});

// POST: Update problem
app.post('/problem/edit/:id', async (req, res) => {
  const { title, sector, description } = req.body;
  try {
    await Problem.findByIdAndUpdate(req.params.id, { title, sector, description });
    res.redirect('/profile/edit');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating problem');
  }
});

// POST: Delete problem
app.post('/problem/delete/:id', async (req, res) => {
  try {
    await Problem.findByIdAndDelete(req.params.id);
    res.redirect('/profile/edit');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting problem');
  }
});

// POST: Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');
  });
});

export default app;