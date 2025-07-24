// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const createOrUpdateAdmin = require('./createAdminIfNotExists');
const User = require('./models/User');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const path = require('path');

dotenv.config();
process.env.TZ = 'America/Santiago';
console.log("Zona horaria configurada:", process.env.TZ);
console.log("Hora actual:", new Date().toLocaleString());

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
console.log('isProduction:', isProduction, '| NODE_ENV:', process.env.NODE_ENV);

// Servir archivos estáticos del frontend (SPA)
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware JSON
app.use(express.json());

// CORS
const allowedOrigins = ['*'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

app.options('*', cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

app.use(morgan('dev'));

// Sesión persistente con Mongo
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction ? true : false,
    httpOnly: true
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  console.log('Serializando usuario:', user._id);
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('🟨 ID recibido para deserializar:', id);
    const user = await User.findById(id);
    if (!user) {
      console.log('🟥 Usuario NO encontrado en la base de datos');
    } else {
      console.log('🟩 Usuario deserializado correctamente:', user.username);
    }
    done(null, user);
  } catch (err) {
    console.error('❌ Error en deserializeUser:', err);
    done(err);
  }
});

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) return done(null, false, { message: 'Usuario no encontrado' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: 'Contraseña incorrecta' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB con Mongoose"))
  .catch(err => console.error("❌ Error de conexión:", err));

// Rutas
const studentsRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');
const tardinessRoutes = require('./routes/tardiness');
const activityLogRoutes = require('./routes/activityLog');

app.use('/api/students', studentsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tardiness', tardinessRoutes);
app.use('/api/activity-log', activityLogRoutes);

// SPA: redirigir todo a index.html (excepto /api)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  await createOrUpdateAdmin();
});
