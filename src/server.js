const express = require("express");
const expressSession = require('express-session');
const app = express();
const path = require("path");
const hbs = require("hbs");
const bcrypt = require('bcrypt');
const session = require('express-session');
const { User, JobPosting } = require("../src/mongodb"); // Updated import

const templatePath = path.join(__dirname, "../templates");

// Middleware setup
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Static file serving
app.use(express.static("public/images"));
app.use(express.static("public/images2"));
app.use(express.static("trialcpi", {
  setHeaders: (res, path) => {
    if (path.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript");
    }
  },
}));

// View engine setup
app.set("view engine", "hbs");
app.set("views", templatePath);

// Authentication middleware
const authenticateUser = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/loginpage');
  }
};

// Routes
app.get("/loginpage", (req, res) => {
  res.render("loginpage");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});


// In server.js - Updated signup handler
// In server.js - Fixed signup handler
app.post("/signup", async (req, res) => {
  try {
    const { fname, lname, email, password, role } = req.body;

    // Input validation
    if (!fname || !lname || !email || !password || !role) {
      return res.render('signup', {
        error: 'Please fill all required fields'
      });
    }

    // Validate role
    if (role !== 'seeker' && role !== 'hirer') {
      return res.render('signup', {
        error: 'Invalid role selected'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('signup', {
        error: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create base user object
    const userData = {
      fname,
      lname,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      profileComplete: false
    };

    // Add role-specific empty profile structure
    if (role === 'hirer') {
      userData.hirerProfile = {
        companyName: '',
        industry: '',
        companySize: '',
        companyDescription: '',
        website: ''
      };
    } else {
      userData.seekerProfile = {
        title: '',
        experience: 0,
        skills: [],
        education: [],
        expectedSalary: {
          min: 0,
          max: 0,
          currency: 'USD'
        }
      };
    }

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    // Set session
    req.session.userId = newUser._id;
    req.session.userRole = role;

    // Redirect based on role
    if (role === 'hirer') {
      res.redirect('/hirer');
    } else {
      res.redirect('/index');
    }

  } catch (error) {
    console.error('Signup error:', error);
    res.render('signup', {
      error: 'Error creating account. Please try again.'
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    // Send a response that triggers client-side redirect
    res.status(200).send(`
      <script>
        localStorage.clear(); // Clear any stored data
        sessionStorage.clear();
        window.location.href = '/loginpage';
      </script>
    `);
  });
});


// Signup handler with role selection and password hashing
// app.post("/signup", async (req, res) => {
//   try {
//     const { fname, lname, email, password, role } = req.body;

//     // Input validation
//     if (!fname || !lname || !email || !password) {
//       return res.status(400).render('signup', {
//         error: 'Please fill all required fields'
//       });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).render('signup', {
//         error: 'Email already registered'
//       });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create new user
//     const newUser = new User({
//       fname,
//       lname,
//       email,
//       password: hashedPassword,
//       role: role || 'seeker',
//       createdAt: new Date(),
//       profileComplete: false
//     });

//     await newUser.save();

//     res.redirect('/loginpage');
//   } catch (error) {
//     console.error('Signup error:', error);
//     res.status(500).render('signup', {
//       error: 'Error creating account. Please try again.'
//     });
//   }
// }); 

// Login handler with role-based routing
app.post("/loginpage", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).render('loginpage', {
        error: 'Invalid email or password'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).render('loginpage', {
        error: 'Invalid email or password'
      });
    }

    // Set session
    req.session.userId = user._id;
    req.session.userRole = user.role;

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Redirect based on role
    if (user.role === 'hirer') {
      res.redirect('/hirer');
    } else {
      res.redirect('/index');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('loginpage', {
      error: 'Error logging in. Please try again.'
    });
  }
});

// Protected routes
app.get("/hirer", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'hirer') {
      return res.redirect('/index');
    }

    // Get posted jobs for this hirer
    const postedJobs = await JobPosting.find({ hirer: user._id })
                                     .sort({ createdAt: -1 });

    res.render("hirer", { 
      user,
      postedJobs,
      companyInfo: user.hirerProfile || {}
    });
  } catch (error) {
    console.error('Hirer dashboard error:', error);
    res.redirect('/loginpage');
  }
});

app.get("/index", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/loginpage');
    }

    // Get active job postings
    const jobs = await JobPosting.find({ status: 'active' })
                                .sort({ createdAt: -1 })
                                .limit(10);

    res.render("index", { 
      user,
      jobs,
      seekerProfile: user.seekerProfile || {}
    });
  } catch (error) {
    console.error('Index page error:', error);
    res.redirect('/loginpage');
  }
});

// Job posting routes
app.post("/post-job", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'hirer') {
      return res.status(403).send('Unauthorized');
    }

    const newJob = new JobPosting({
      hirer: user._id,
      title: req.body.title,
      description: req.body.description,
      requirements: req.body.requirements.split(',').map(r => r.trim()),
      location: req.body.location,
      type: req.body.type,
      salary: {
        min: req.body.salaryMin,
        max: req.body.salaryMax,
        currency: req.body.currency || 'USD'
      },
      skills: req.body.skills.split(',').map(s => s.trim()),
      status: 'active'
    });

    await newJob.save();
    res.redirect('/hirer');
  } catch (error) {
    console.error('Job posting error:', error);
    res.redirect('/hirer');
  }
});

app.get("/", (req, res)=>
{
  res.redirect("/loginpage");
});

// Profile update routes
app.post("/update-hirer-profile", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'hirer') {
      return res.status(403).send('Unauthorized');
    }

    user.hirerProfile = {
      companyName: req.body.companyName,
      industry: req.body.industry,
      companySize: req.body.companySize,
      companyDescription: req.body.companyDescription,
      website: req.body.website
    };
    user.profileComplete = true;
    await user.save();

    res.redirect('/hirer');
  } catch (error) {
    console.error('Profile update error:', error);
    res.redirect('/hirer');
  }
});

app.post("/update-seeker-profile", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'seeker') {
      return res.status(403).send('Unauthorized');
    }

    user.seekerProfile = {
      title: req.body.title,
      experience: parseInt(req.body.experience),
      skills: req.body.skills.split(',').map(s => s.trim()),
      education: [{
        degree: req.body.degree,
        institution: req.body.institution,
        year: parseInt(req.body.graduationYear)
      }],
      expectedSalary: {
        min: parseInt(req.body.expectedSalaryMin),
        max: parseInt(req.body.expectedSalaryMax),
        currency: req.body.currency || 'USD'
      }
    };
    user.profileComplete = true;
    await user.save();

    res.redirect('/index');
  } catch (error) {
    console.error('Profile update error:', error);
    res.redirect('/index');
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/loginpage');
  });
});


app.post('/toggle-role', (req, res) => {
  const { role } = req.body;

  // Validate role
  if (role !== 'job_seeker' && role !== 'hirer') {
    return res.status(400).send('Invalid role');
  }

  // Update role in session or database
  req.session.role = role;

  res.send('Role toggled successfully');
});


app.use(expressSession({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: true
}));

app.post('/toggle-role', (req, res) => {
  const { role } = req.body;
  req.session.role = role;
  res.send('Role toggled successfully');
});

app.listen(8080, () => {
  console.log("Server listening at 8080");
});