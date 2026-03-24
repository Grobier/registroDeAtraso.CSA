// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
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
// Necesario para cookies 'secure' detrás de proxies/local
app.set('trust proxy', 1);
// Forzar desarrollo local para evitar problemas de CORS
const isProduction = process.env.NODE_ENV === 'production';
console.log('🔧 CORS Config - isProduction:', isProduction, '| NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 CORS Config - Origin permitido:', isProduction 
  ? 'https://registrodeatraso-csa.onrender.com'
  : ['http://localhost:5173', 'http://localhost:3000']
);

// Servir archivos estáticos del frontend (SPA)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Middleware JSON
app.use(express.json());

// Middleware para parsear cookies
app.use(cookieParser());

// Middleware para verificar cookies antes de CORS
app.use((req, res, next) => {
  console.log(`\n🔍 ${req.method} ${req.path} - ANTES DE CORS`);
  console.log('🍪 Cookie header raw:', req.headers.cookie);
  console.log('📋 Origin:', req.headers.origin);
  next();
});

// Configuración de CORS: reflejar origen permitido dinámicamente
const allowedOrigins = isProduction
  ? ['https://registrodeatraso-csa.onrender.com', 'http://localhost:5000', 'http://localhost:5173', 'http://localhost:3000']
  : ['http://localhost:5000', 'http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Peticiones same-origin o desde herramientas sin origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
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
    // Ajuste para entorno local con HTTP: permite que el navegador
    // guarde y envíe la cookie de sesión correctamente
    sameSite: 'lax',
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
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
  console.log('\n🔄 DESERIALIZE USER LLAMADO');
  console.log('🟨 ID recibido para deserializar:', id);
  console.log('🟨 Tipo de ID:', typeof id);
  try {
    const user = await User.findById(id);
    if (!user) {
      console.log('🟥 Usuario NO encontrado en la base de datos');
      console.log('🟥 ID buscado:', id);
    } else {
      console.log('🟩 Usuario deserializado correctamente:', user.username);
      console.log('🟩 Usuario completo:', user);
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

// Middleware de logging para debugging (después de Passport)
app.use((req, res, next) => {
  console.log(`\n🔍 ${req.method} ${req.path}`);
  console.log('📋 Headers:', {
    'cookie': req.headers.cookie ? 'Presente' : 'Ausente',
    'origin': req.headers.origin,
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });
  console.log('🍪 Cookies recibidas:', req.cookies);
  console.log('🍪 Cookie header completo:', req.headers.cookie);
  console.log('👤 req.user:', req.user ? req.user.username : 'undefined');
  console.log('🔐 req.isAuthenticated():', req.isAuthenticated());
  console.log('🆔 Session ID:', req.sessionID);
  next();
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB con Mongoose"))
  .catch(err => console.error("❌ Error de conexión:", err));

// Rutas
const studentsRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');
const tardinessRoutes = require('./routes/tardiness');
const activityLogRoutes = require('./routes/activityLog');
const notificationsRoutes = require('./routes/notifications');
const emergenciesRoutes = require('./routes/emergencies');

app.use('/api/students', studentsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tardiness', tardinessRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/emergencies', emergenciesRoutes);

// SPA: redirigir todo a index.html (excepto /api)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  await createOrUpdateAdmin();
});
