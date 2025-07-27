const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Idea = require('./models/Idea');
const Problem = require('./models/Problem');
const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problem');
const chatRoutes = require('./routes/chat');
const Chat = require('./models/Chat');
const dotenv = require('dotenv');
dotenv.config();



require('dotenv').config();

const app = express();

// DB connection
mongoose.connect("mongodb+srv://chandubandi7799:WrwWtx3uapRDr3us@innohub.uaajegr.mongodb.net/?retryWrites=true&w=majority&appName=Innohub")
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// View engine
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
// Session
app.use(session({
  secret: "SKILLSWAP_SECRET_23Z8NDFA",
  resave: false,
  saveUninitialized: false
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());
app.use('/', problemRoutes);
app.use('/chat', chatRoutes);

// Passport serialization
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Local Strategy
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return done(null, false, { message: 'No user found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return done(null, false, { message: 'Wrong password' });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://innohub.onrender.com/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName
    });
  }
  return done(null, user);
}));

// Middleware to protect routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Routes
app.use(authRoutes);

// Pages
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/login', (req, res) => {
  res.render('login');
});
app.post('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/'); // or redirect to '/login' if you have a login page
  });
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

// Home (All Ideas)
app.get('/home', ensureAuthenticated, async (req, res) => {
  const ideas = await Idea.find();
  res.render('home', { user: req.user, ideas });
});

// Search

app.get('/search', async (req, res) => {
  const { sector, keyword, type = 'idea' } = req.query;

  const filter = {};
  if (sector) filter.sector = sector;
  if (keyword) filter.description = new RegExp(keyword, 'i');

  let results = [];
  if (type === 'problem') {
    results = await Problem.find(filter).sort({ datePosted: -1 });
  } else {
    results = await Idea.find(filter).sort({ datePosted: -1 });
  }

  res.render('search', { results, type });
});

// Post page
app.get('/post', ensureAuthenticated, (req, res) => {
  res.render('post', { user: req.user });
});

// Handle Post Idea
app.post('/post-idea', ensureAuthenticated, async (req, res) => {
  const { sector, problem, description } = req.body;

  try {
    const idea = new Idea({
      sector,
      problem,
      description,
      contributorId: req.user._id,
      datePosted: new Date()
    });

    await idea.save();
    res.redirect('/home');
  } catch (err) {
    console.error('Error saving idea:', err);
    res.status(500).send('Internal server error while posting idea.');
  }
});
app.post('/post-problem', ensureAuthenticated, async (req, res) => {
  const { sector, title, description } = req.body;

  try {
    const problem = new Problem({
      sector,
      title,
      description,
      contributorId: req.user._id,
      datePosted: new Date()
    });

    await problem.save();
    res.redirect('/problems'); // or you can redirect to /problems if you build that view
  } catch (err) {
    console.error('Error saving problem:', err);
    res.status(500).send('Internal server error while posting problem.');
  }
});
app.get('/problems', ensureAuthenticated, async (req, res) => {
  try {
    const problems = await Problem.find();
    res.render('problems', { user: req.user, problems });
  } catch (err) {
    res.status(500).send('Error fetching problems.');
  }
});


// Profile Page
app.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const ideas = await Idea.find({ contributorId: req.user._id }).lean();
    const problems = await Problem.find({ contributorId: req.user._id }).lean(); // ✅ matches your schema

    res.render('profile', {
      user: req.user,
      ideas: ideas || [],
      problems: problems || []
    });
  } catch (err) {
    console.error('Error fetching ideas or problems:', err);
    res.status(500).send('Internal Server Error');
  }
});




app.post('/edit-profile', async (req, res) => {
  const userId = req.session.userId;
  const { name, email, bio } = req.body;

  try {
    await User.findByIdAndUpdate(userId, {
      name,
      email,
      bio,
    });

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile');
  }
});
//Edit Profile Page
app.get('/profile/edit', ensureAuthenticated, (req, res) => {
  res.render('edit-profile', { user: req.user });
});

app.post('/profile/edit', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id; // ✅ FIXED: use Passport's user object
    const { name, email, bio } = req.body;

    await User.findByIdAndUpdate(userId, {
      name,
      bio,
    });

    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating profile');
  }
});


app.post('/idea/delete/:id', async (req, res) => {
  try {
    const ideaId = req.params.id;
    await Idea.findByIdAndDelete(ideaId);
    res.redirect('/profile'); // or wherever you list the ideas
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete idea');
  }
});
app.get('/problem/edit/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).send('Problem not found');
    }
    res.render('editProblem', { problem });
  } catch (err) {
    console.error('Error loading problem for edit:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/edit-problem/:id', async (req, res) => {
  try {
    const { sector, problem: problemTitle, description } = req.body;
    await Problem.findByIdAndUpdate(req.params.id, {
      sector,
      problem: problemTitle,
      description
    });
    res.redirect('/home'); // or wherever you list problems
  } catch (err) {
    console.error('Error updating problem:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/idea/edit/:id', async (req, res) => {
  const ideaId = req.params.id;

  try {
    const idea = await Idea.findById(ideaId); // assuming you're using Mongoose
    if (!idea) {
      return res.status(404).send('Idea not found');
    }

    res.render('editIdea', { idea }); // assumes you're using EJS or some template engine
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
// Add this in your server.js or in your routes file
app.get('/idea/:id', async (req, res) => {
  try {
    const ideaId = req.params.id;

    const idea = await Idea.findById(ideaId).populate('contributorId');
    if (!idea) {
      return res.status(404).send('Idea not found');
    }

    res.render('ideaDetail', {
      idea,
      currentUser: req.user, // or whatever you use to store logged-in user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/edit-idea/:id', async (req, res) => {
  try {
    const ideaId = req.params.id;
    const { sector, problem, description } = req.body;

    // Update the idea in your MongoDB collection
    await Idea.findByIdAndUpdate(ideaId, {
      sector,
      problem,
      description,
    });

    // Redirect or send a success response
    res.redirect('/home'); // or wherever you show the updated ideas
  } catch (err) {
    console.error('Error updating idea:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/chats', ensureAuthenticated, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
    .populate({
      path: 'idea',
      select: 'sector problem description',
      // This will handle cases where the idea might have been deleted
      match: { _id: { $exists: true } }
    })
    .populate({
      path: 'messages.sender',
      select: 'name'
    })
    .sort({ updatedAt: -1 }); // Show most recently updated chats first

    // Filter out chats where idea population failed (idea was deleted)
    const validChats = chats.filter(chat => chat.idea !== null);

    res.render('chats', { 
      user: req.user, 
      chats: validChats || [] 
    });
  } catch (err) {
    console.error('Error fetching chats:', err);
    res.status(500).send('Error fetching chats.');
  }
});
// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
