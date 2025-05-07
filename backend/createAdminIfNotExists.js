// backend/createAdminIfNotExists.js
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function createOrUpdateAdmin() {
  try {
    const newAdminPassword = 'csa2025'; // Cambia la contraseña aquí
    const hashedPass = await bcrypt.hash(newAdminPassword, 10);

    // Buscar el usuario admin
    let adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      // Actualizar la contraseña
      adminUser.password = hashedPass;
      await adminUser.save();
      console.log('Contraseña del admin actualizada');
    } else {
      // Crear el admin si no existe
      await User.create({
        username: 'admin',
        password: hashedPass,
        role: 'admin'
      });
      console.log('Usuario administrador creado por defecto con la nueva contraseña');
    }
  } catch (err) {
    console.error('Error al crear/actualizar usuario admin:', err);
  }
}

module.exports = createOrUpdateAdmin;
