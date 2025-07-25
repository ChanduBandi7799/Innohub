const express = require('express');
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Idea = require('../models/Idea');
const User = require('../models/User');

const router = express.Router();

// Middleware to ensure authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// GET: View chat for an idea
router.get('/:ideaId', ensureAuthenticated, async (req, res) => {
  const ideaId = req.params.ideaId;
  console.log("Chat route hit for ideaId:", ideaId);
  console.log("Current user ID:", req.user._id);

  // ✅ ADD: Validate ideaId
  if (!ideaId || ideaId === 'undefined') {
    console.log("Invalid ideaId received");
    return res.status(400).send("Invalid idea ID");
  }

  try {
    const idea = await Idea.findById(ideaId).populate('contributorId');
    if (!idea) {
      console.log("Idea not found in DB for ID:", ideaId);
      return res.status(404).send("Idea not found");
    }

    // Check if a chat already exists for this idea and the logged-in user
    let chat = await Chat.findOne({
      idea: ideaId,
      participants: req.user._id, // ✅ FIXED: Use req.user._id instead of req.session.userId
    }).populate('messages.sender');

    // If not, create one
    if (!chat) {
      chat = await Chat.create({
        idea: ideaId,
        participants: [req.user._id, idea.contributorId._id], // ✅ FIXED: Use req.user._id
        messages: [],
      });
    }

    res.render('chat', {
      chat,
      currentUser: req.user // ✅ FIXED: Pass the full user object
    });

  } catch (err) {
    console.error("Error in GET /chat/:ideaId", err);
    res.status(500).send("Internal Server Error");
  }
});

// POST: Send message in chat
router.post('/:chatId/message', ensureAuthenticated, async (req, res) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).send('Unauthorized: Please log in.');
    }

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).send('Chat not found');

    chat.messages.push({
      sender: currentUser._id,
      content: req.body.content,
    });

    // ✅ ADD: Update the updatedAt timestamp
    chat.updatedAt = new Date();
    await chat.save();
    
    // ✅ FIXED: Redirect back to the chat using the idea ID
    res.redirect(`/chat/${chat.idea}`);
  } catch (err) {
    console.error("Error in POST /chat/:chatId/message", err);
    res.status(500).send('Error sending message.');
  }
});

module.exports = router;