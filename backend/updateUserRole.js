// Script para actualizar el rol de un usuario
const mongoose = require('mongoose');
const User = require('./models/User');

// Conectar a la base de datos
mongoose.connect('mongodb://localhost:27017/atrasos', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateUserRole() {
  try {
    // Actualizar el rol del usuario "aurelio" a "profesor"
    const result = await User.updateOne(
      { username: 'aurelio' },
      { role: 'profesor' }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Usuario "aurelio" actualizado a rol "profesor"');
    } else {
      console.log('❌ No se encontró el usuario "aurelio" o no se pudo actualizar');
    }
    
    // Verificar el cambio
    const user = await User.findOne({ username: 'aurelio' });
    console.log('📋 Usuario actualizado:', {
      username: user.username,
      role: user.role,
      email: user.email
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateUserRole();
