var express = require('express');
var router = express.Router();
var User = require('../models/user');
var mid = require('../middleware');
var bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken")
// GET /profile
router.get('/profile', mid.requiresLogin, function(req, res, next) {
  User.findById(req.session.userId)
      .exec(function (error, user) {
        if (error) {
          return next(error);
        } else {
          return res.render('profile', { title: 'Profile', name: user.name, favorite: user.favoriteBook });
        }
      });
});

// GET /logout
router.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

// GET /login
router.get('/login', mid.loggedOut, function(req, res, next) {
  return res.render('login', { title: 'Log In'});
});


const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

	res.cookie("jwt", token, {
		maxAge: 15 * 24 * 60 * 60 * 1000, // MS
		httpOnly: true, // prevent XSS attacks cross-site scripting attacks
		sameSite: "strict", // CSRF attacks cross-site request forgery attacks
		secure: process.env.NODE_ENV !== "development",
	});
};



router.post('/login', async function(req, res, next) {
	try {
		const { email, password } = req.body;
    console.log("username", email);
		const user = await User.findOne({ email:email });
    console.log("a", user);
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");
    console.log("a", isPasswordCorrect);
		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username or password" });
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			profilePic: user.profilePic,
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});


// POST /login
// router.post('/login', function(req, res, next) {
//   if (req.body.email && req.body.password) {
//     User.authenticate(req.body.email, req.body.password, function (error, user) {
//       if (error || !user) {
//         var err = new Error('Wrong email or password.');
//         err.status = 401;
//         return next(err);
//       }  else {
//         req.session.userId = user._id;
//         return res.redirect('/');
//       }
//     });
//   } else {
//     var err = new Error('Email and password are required.');
//     err.status = 401;
//     return next(err);
//   }
// });

// GET /register
router.get('/register', mid.loggedOut, function(req, res, next) {
  return res.render('register', { title: 'Sign Up' });
});

// POST /register
router.post('/register', function(req, res, next) {
  if (req.body.email &&
    req.body.pseudo &&
    req.body.password &&
    req.body.confirm_password) {

      // confirm that user typed same password twice
      // if (req.body.password !== req.body.confirmPassword) {
      //   var err = new Error('Passwords do not match.');
      //   err.status = 400;
      //   return next(err);
      // }

      // create object with form input
      var userData = {
        email: req.body.email,
        pseudo: req.body.pseudo,
        password: req.body.password
      };

      // use schema's `create` method to insert document into Mongo
      // User.create(userData, function (error, user) {
      //   if (error) {
      //     return next(error);
      //   } else {
      //     req.session.userId = user._id;
      //     return res.redirect('/profile');
      //   }
      // });
      User.create(userData)
        .then((result) => {
          res.send({ kq: 1, msg: 'Đã thêm thành công' })
        })
        .catch((err) => {
          res.send({ kq: 0, msg: 'kết nối DB thất bại' })
        })

    } else {
      var err = new Error('All fields required.');
      err.status = 400;
      return next(err);
    }
})

// GET /
router.get('/', function(req, res, next) {
  return res.render('index', { title: 'Home' });
});

// GET /about
router.get('/about', function(req, res, next) {
  return res.render('about', { title: 'About' });
});

// GET /contact
router.get('/contact', function(req, res, next) {
  return res.render('contact', { title: 'Contact' });
});

module.exports = router;
