// backend/createAdminIfNotExists.js
const User = require('./models/User');

async function createOrUpdateAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const adminUsername = 'admin';
    const adminPassword = 'csa2025';

    // Verificar si el usuario administrador ya existe por username
    let adminUser = await User.findOne({ username: adminUsername });
    if (adminUser) {
      // Asignar en texto plano: el pre-save hook del modelo se encarga de hashear
      adminUser.password = adminPassword;
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('Contraseña del administrador actualizada');
    } else {
      // User.create también dispara el pre-save hook
      await User.create({
        username: adminUsername,
        password: adminPassword,
        email: adminEmail,
        role: 'admin',
      });
      console.log('Usuario administrador creado exitosamente');
    }
  } catch (err) {
    console.error('Error al crear/actualizar usuario admin:', err);
  }
}

module.exports = createOrUpdateAdmin;
