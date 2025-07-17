// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const createOrUpdateAdmin = require('./createAdminIfNotExists');
const User = require('./models/User');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

process.env.TZ = 'America/Santiago';
console.log("Zona horaria configurada:", process.env.TZ);
console.log("Hora actual:", new Date().toLocaleString());

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
const allowedOrigins = [
  'http://localhost:5173',
  'https://registrodeatraso-frontend.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir sin origin (Postman) o si está en la lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Opciones para preflight
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

// Configuración de sesión para Passport (asegúrate de tener SESSION_SECRET en tu .env)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        sameSite: 'lax', // Compatible con desarrollo local
        secure: false    // Importante: false en localhost
        // domain: 'localhost' // Eliminado para evitar problemas en desarrollo local
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
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

// Conexión a MongoDB usando Mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado a MongoDB con Mongoose"))
  .catch(err => console.error("Error de conexión:", err));

// Importar rutas
const studentsRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');
const tardinessRoutes = require('./routes/tardiness');
const activityLogRoutes = require('./routes/activityLog');

// Montar las rutas
app.use('/api/students', studentsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tardiness', tardinessRoutes);
app.use('/api/activity-log', activityLogRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  await createOrUpdateAdmin(); // Llama a la función para crear el usuario administrador
});
