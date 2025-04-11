// backend/createAdminIfNotExists.js
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function createAdminIfNotExists() {
  try {
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      const hashedPass = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPass,
        role: 'admin'
      });
      console.log('Usuario administrador creado por defecto');
    }
  } catch (err) {
    console.error('Error al crear usuario admin:', err);
  }
}

module.exports = createAdminIfNotExists;
