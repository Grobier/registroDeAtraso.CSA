// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Configuración de sesión para Passport (asegúrate de tener SESSION_SECRET en tu .env)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// Conexión a MongoDB usando Mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Conectado a MongoDB con Mongoose"))
.catch(err => console.error("Error de conexión:", err));

// Importar rutas
const studentsRoutes = require('./routes/students');
// Asumiendo que ya tienes otras rutas (auth y tardiness), las importas si es necesario:
const authRoutes = require('./routes/auth');
const tardinessRoutes = require('./routes/tardiness');

// Montar las rutas (cada una solo una vez)
app.use('/api/students', studentsRoutes);
app.use('/auth', authRoutes);
app.use('/api/tardiness', tardinessRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
