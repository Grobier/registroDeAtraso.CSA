// backend/createAdminIfNotExists.js
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function createOrUpdateAdmin() {
  try {
    const adminEmail = 'admin@example.com'; // Proporciona un correo válido
    const adminUsername = 'admin';
    const adminPassword = 'csa2025'; // Cambia la contraseña aquí

    // Verificar si el usuario administrador ya existe
    let adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      // Actualizar la contraseña del administrador existente
      const hashedPass = await bcrypt.hash(adminPassword, 10);
      adminUser.password = hashedPass;
      await adminUser.save();
      console.log('Contraseña del administrador actualizada');
    } else {
      // Crear un nuevo usuario administrador
      const hashedPass = await bcrypt.hash(adminPassword, 10);
      await User.create({
        username: adminUsername,
        password: hashedPass,
        email: adminEmail, // Proporciona un correo válido
        role: 'admin',
      });
      console.log('Usuario administrador creado exitosamente');
    }
  } catch (err) {
    console.error('Error al crear/actualizar usuario admin:', err);
  }
}

module.exports = createOrUpdateAdmin;
