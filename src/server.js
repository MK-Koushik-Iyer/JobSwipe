  const express = require("express");
  const session = require("express-session");
  const bcrypt = require("bcryptjs");
  const path = require("path");
  const hbs = require("hbs");


  const { User, JobPosting } = require("../src/mongodb"); // Updated import

  const app = express();
  const PORT = 8080;

  // Template path setup
  const templatePath = path.join(__dirname, "../templates");
  app.use(express.static('public'));
  // Middleware setup
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  }));
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    next();
  });



  const helmet = require('helmet');

  
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Allow content from the same origin by default
      fontSrc: ["'self'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'], // Allow fonts from Google Fonts and CDN
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'], // Allow inline styles and external styles
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'], // Allow inline scripts and scripts from CDN
      imgSrc: ["'self'", 'data:'], // Allow images from the same origin and data URIs
      connectSrc: ["'self'", 'https://apis.google.com'], // Example: Allow API connections (for OAuth, etc.)
      upgradeInsecureRequests: [], // Upgrade HTTP requests to HTTPS
    },
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
      res.redirect("/loginpage");
    }
  };

  // Routes

    
  app.get("/", (req, res) => res.redirect("/loginpage"));

  app.get("/loginpage", (req, res) => res.render("loginpage"));
  app.get("/signup", (req, res) => res.render("signup"));
  app.get("/forgot-password", (req, res) => res.render("forgot-password"));
  // Updated signup routes for Seeker and Hirer roles
  app.get('/signuphirer', (req, res) => {
    res.render('signuphirer'); // This assumes you're using 'signuphirer.hbs' as a template
  });

  app.get('/profilesetupseeker', (req, res) => {
    res.render('profilesetupseeker'); // Make sure the file is in your views folder
  });



  // Updated signup route with role-based redirection
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

      // Redirect to specific setup page based on role
      if (role === 'hirer') {
        res.redirect('/signuphirer'); // Redirect to the Hirer setup page
      } else {
        res.redirect('/signupseeker'); // Redirect to the Seeker setup page
      }

    } catch (error) {
      console.error('Signup error:', error);
      res.render('signup', {
        error: 'Error creating account. Please try again.'
      });
    }
  });


  // Login handler with role-based routing
  app.post("/loginpage", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.render("loginpage", { error: "Invalid email or password" });
      }

      req.session.userId = user._id;
      req.session.userRole = user.role;
      user.lastActive = new Date();
      await user.save();

      res.redirect(user.role === "hirer" ? "/signuphirer" : "/profilesetupseeker");

    } catch (error) {
      console.error("Login error:", error);
      res.render("loginpage", { error: "Error logging in. Please try again." });
    }
  });

  // Hirer Dashboard Route
  app.get("/hirer", authenticateUser, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== "hirer") return res.redirect("/index");

      const postedJobs = await JobPosting.find({ hirer: user._id }).sort({ createdAt: -1 });

      res.render("hirer", { user, postedJobs, companyInfo: user.hirerProfile || {} });

    } catch (error) {
      console.error("Hirer dashboard error:", error);
      res.redirect("/loginpage");
    }
  });

  // Seeker Dashboard Route
  app.get("/index", authenticateUser, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) return res.redirect("/loginpage");

      const jobs = await JobPosting.find({ status: "active" }).sort({ createdAt: -1 }).limit(10);

      res.render("index", { user, jobs, seekerProfile: user.seekerProfile || {} });

    } catch (error) {
      console.error("Index page error:", error);
      res.redirect("/loginpage");
    }
  });

  // Job Posting
  app.post("/post-job", authenticateUser, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== "hirer") return res.status(403).send("Unauthorized");

      const newJob = new JobPosting({
        hirer: user._id,
        title: req.body.title,
        description: req.body.description,
        requirements: req.body.requirements.split(",").map(r => r.trim()),
        location: req.body.location,
        type: req.body.type,
        salary: { min: req.body.salaryMin, max: req.body.salaryMax, currency: req.body.currency || "USD" },
        skills: req.body.skills.split(",").map(s => s.trim()),
        status: "active"
      });

      await newJob.save();
      res.redirect("/hirer");

    } catch (error) {
      console.error("Job posting error:", error);
      res.redirect("/hirer");
    }
  });

  // Profile Update Routes
  app.post("/update-hirer-profile", authenticateUser, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== "hirer") return res.status(403).send("Unauthorized");

      user.hirerProfile = {
        companyName: req.body.companyName,
        industry: req.body.industry,
        companySize: req.body.companySize,
        companyDescription: req.body.companyDescription,
        website: req.body.website
      };
      user.profileComplete = true;
      await user.save();

      res.redirect("/hirer");

    } catch (error) {
      console.error("Profile update error:", error);
      res.redirect("/hirer");
    }
  });

  app.post("/update-seeker-profile", authenticateUser, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== "seeker") return res.status(403).send("Unauthorized");

      user.seekerProfile = {
        title: req.body.title,
        experience: parseInt(req.body.experience),
        skills: req.body.skills.split(",").map(s => s.trim()),
        education: [{ degree: req.body.degree, institution: req.body.institution, year: parseInt(req.body.graduationYear) }],
        expectedSalary: { min: parseInt(req.body.expectedSalaryMin), max: parseInt(req.body.expectedSalaryMax), currency: req.body.currency || "USD" }
      };
      user.profileComplete = true;
      await user.save();

      res.redirect("/index");

    } catch (error) {
      console.error("Profile update error:", error);
      res.redirect("/index");
    }
  });

  // Logout
  app.get("/logout", (req, res) => {
    req.session.destroy(err => {
      if (err) console.error("Logout error:", err);
      res.redirect("/loginpage");
    });
  });

  // Toggle Role
  app.post("/toggle-role", (req, res) => {
    const { role } = req.body;
    if (role !== "job_seeker" && role !== "hirer") return res.status(400).send("Invalid role");

    req.session.role = role;
    res.send("Role toggled successfully");
  });

  // Start Server
  app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
