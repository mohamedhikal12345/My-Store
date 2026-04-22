const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

router.get("/google", passport.authenticate("google", { scope: ["email", "profile"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/login",
  }),
  async (req, res) => {
    // check user is available or not using google id or email

    try {
      const profile = req.user;
      const token = await handleOAuthCallback(profile, "googleId");

      res.json({
        message: "Google Login Success! ✅",
        token: token,
      });
      // res.redirect(`http://localhost:5173/dashboard?token=${token}`);
    } catch (err) {
      res.redirect("http://localhost:5173/login?error=auth_failed");
    }
  },
);

router.get("/facebook", passport.authenticate("facebook", { scope: ["public_profile", "email"] }));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "http://localhost:5173/login",
  }),
  async (req, res) => {
    // check user is available or not using google id or email
    try {
      const profile = req.user;

      const token = await handleOAuthCallback(profile, "facebookId");

      res.json({
        message: "Facebook Login Success! ✅",
        token: token,
      });
      // res.redirect(`http://localhost:5173/dashboard?token=${token}`);
    } catch (err) {
      res.redirect("http://localhost:5173/login?error=auth_failed");
    }
  },
);

const handleOAuthCallback = async (profile, providerId) => {
  try {
    let user = await User.findOne({
      $or: [{ [providerId]: profile.id }, { email: profile.emails[0].value }],
    });
    // if user is  available -update google id & generate gwt token and send it in the res
    if (user) {
      if (user[providerId] !== profile.id) {
        user[providerId] = profile.id;
        await user.save();
      }
    } else {
      //User is not available - create new user & generate gwt token and send it in res
      user = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        [providerId]: profile.id,
      });

      await user.save();
    }
    const token = jwt.sign({ _id: user._id, name: user.name, role: user.role }, process.env.JWT_KEY, {
      expiresIn: "2h",
    });
    return token;
    // res.json(token);
  } catch (err) {
    throw new Error(err.message);
  }
};
module.exports = router;
