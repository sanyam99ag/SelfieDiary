const express = require('express')
const mongoose = require('mongoose')
const bodyparser = require('body-parser');
const bcrypt = require('bcryptjs')
const User = require('./user.js')
const Data = require('./data.js');
const passport = require('passport')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const flash = require('connect-flash');
const { response } = require('express');
require('dotenv').config()
    // const { Strategy } = require('passport-local')


const app = express();
PORT = process.env.PORT || 5000;
const MAP_API = process.env.MAP_API

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));


// using Bodyparser for getting form data
app.use(express.urlencoded({ extended: true }))
app.use(bodyparser.json({ limit: "50mb" }))

// using cookie-parser and session 
app.use(cookieParser('secret'));
app.use(session({
    secret: 'secret',
    maxAge: 3600000, //which is around 2 weeks
    resave: true,
    saveUninitialized: true,
}));

// Using passport for authentications 
app.use(passport.initialize());
app.use(passport.session());

// Using flash for flash messages 
app.use(flash());

// MIDDLEWARES
// Global variable
app.use(async(req, res, next) => {
    res.locals.success_message = req.flash('success_message');
    res.locals.error_message = req.flash('error_message');
    res.locals.error = req.flash('error');
    next();
});

// Check if user is authenticated and clear cache accordingly
const checkAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        return next();
    } else {
        res.redirect('/login');
    }
}


// Mongoose connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/selfiediary', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Database connected')).catch(err => console.log("database connectivity error " + err));


// Initial Register route
app.get('/', async(req, res) => {
    res.render('register')
})

// Register POST route to get the form data
app.post('/register', async(req, res) => {
    var { email, username, password, confirmpassword } = req.body;
    var err;

    // if any field is empty
    if (!email || !username || !password || !confirmpassword) {
        err = 'Please fill all details!'
        res.render('register', { 'err': err });
    }

    // if password doesn't match
    if (password != confirmpassword) {
        err = 'Passwords Don\'t match!'
        res.render('register', { 'err': err, 'email': email, 'username': username });
    }

    // if everything is fine then check for exiting email in db
    if (typeof err == 'undefined') {
        const check = await User.exists({ email: req.body.email })
        if (check == false) {
            bcrypt.genSalt(10, async(err, salt) => {
                if (err) throw err;
                bcrypt.hash(password, salt, async(err, hash) => {
                    if (err) throw err;
                    password = hash;

                    // save new user
                    await User.create({
                        email,
                        username,
                        password
                    })
                    req.flash('success_message', "Registered Successfully.. Login To Continue..");
                    res.redirect('/login');
                });
            });
        } else {
            console.log('user exists')
            err = 'User with this email already exists!'
            res.render('register', { 'err': err });
        }

    }
})


// PassportJs Authentication Strategy
var localStrategy = require('passport-local').Strategy;
passport.use(new localStrategy({ usernameField: 'email' }, async(email, password, done) => {
    User.findOne({ email: email }, async(err, data) => {
        if (err) throw err;
        if (!data) {
            return done(null, false, { message: "User Doesn't Exists.." });
        }
        bcrypt.compare(password, data.password, async(err, match) => {
            if (err) {
                return done(null, false);
            }
            if (!match) {
                return done(null, false, { message: "Password Doesn't Match" });
            }
            if (match) {
                return done(null, data);
            }
        });
    });
}));

passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    User.findById(id, function(err, user) {
        cb(err, user);
    });
});

// Login get route
app.get('/login', async(req, res) => {
    res.render('login');
})

// Login post route
app.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/index',
        failureFlash: true,
    })(req, res, next);
});

// Success route
app.get('/index', checkAuthenticated, async(req, res) => {
    res.render('index', { 'user': req.user, 'MAP_API': MAP_API });
});

app.get('/api', checkAuthenticated, async(req, res) => {
    user.findById(req.user._id).populate("data").exec(async(error, foundUser) => {
        if (error) {
            console.log(error);
            return res.redirect('/404')
        }

        if (!foundUser) {
            console.log("Api url does not exist");
            return res.redirect('/404')
        }
        // res.send( {'slots': foundUser.slots})
        // res.render('allslots', { 'user': foundUser.username, 'uid': foundUser._id, 'data': foundUser.data })
        res.send({ 'user': foundUser.username, 'uid': foundUser._id, 'data': foundUser.data })
    });

})
app.post('/api', checkAuthenticated, async(req, res) => {
    const info = req.body;

    const timestamp = Date.now();
    info.timestamp = timestamp;
    // console.log(info);


    const newData = await new Data({
        latitude: info.lat,
        longitude: info.lon,
        timestamp: timestamp,
        image: info.image64,
        caption: info.caption
    });
    console.log(newData)
    newData.save(async(error, savedData) => {
        if (error) {
            console.log(error);
            return res.status(404).json({ success: false, msg: "Something went wrong. Please try again" });
        }

        if (savedData) {
            User.findById(req.user._id, async(error, foundUser) => {
                if (error) {
                    console.log(error);
                    return res.status(404).json({ success: false, msg: "Something went wrong. Please try again" });
                }

                foundUser.data.push(savedData);
                foundUser.save(async(error, savedData) => {
                    if (error) {
                        console.log(error);
                        return res.status(404).json({ success: false, msg: "Something went wrong. Please try again" });
                    }
                    console.log(savedData)

                    req.flash('success_message', "Memory Saved!");

                });
            });
        }
    });
    res.json(info);
})

app.get('/display', async(req, res) => {
        User.findById(req.user._id).populate("data").exec(async(error, foundUser) => {
            if (error) {
                console.log(error);
                return res.redirect('/404')
            }

            if (!foundUser) {
                console.log("Api url does not exist");
                return res.redirect('/404')
            }

            res.render('display', { 'user': foundUser.username, 'uid': foundUser._id, 'data': foundUser.data })
        });
    })
    // Logout route
app.get('/logout', async(req, res) => {
    req.logout();
    res.redirect('/login');
})


app.listen(PORT, () => console.log(`Listening to the port ${PORT}`));