// routes/auth.js
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const router = express.Router();

// Lista de correos que serán administradores (ajusta según tus necesidades)
const adminEmails = ['lorenzo.grobier@colegiosaintarieli.cl'];

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  // Supongamos que el correo principal viene en profile.emails[0].value
  const email = profile.emails[0].value;
  // Asigna rol según el correo
  profile.role = adminEmails.includes(email) ? 'admin' : 'user';
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Ruta para iniciar sesión con Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback de autenticación con Google
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Redirige al dashboard o a donde prefieras
    res.redirect('/dashboard');
  }
);

module.exports = router;
