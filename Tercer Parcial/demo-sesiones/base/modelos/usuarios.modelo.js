// Consultas a la tabla usuarios. Siempre con ? (consulta parametrizada), nunca pegando texto en el SQL.
const bcrypt = require('bcryptjs');

function crearModeloUsuarios(pool) {
  // Regresa el usuario (sin el hash) si la contraseña es correcta, o null si no.
  async function verificar(usuario, contrasenaIngresada) {
    // 1. Buscamos al usuario seleccionando la columna 'contrasena_hash'
    const [filas] = await pool.query(
      'SELECT id, usuario, nombre, rol, contrasena_hash FROM usuarios WHERE usuario = ?',
      [usuario]
    );

    // Si no existe el usuario, regresamos null
    if (filas.length === 0) {
      return null;
    }

    const usuarioEncontrado = filas[0];

    // 2. Comparamos la contraseña con 'contrasena_hash' usando bcrypt
    const esValida = await bcrypt.compare(contrasenaIngresada, usuarioEncontrado.contrasena_hash);

    if (!esValida) {
      return null; // Contraseña incorrecta
    }

    // 3. Regresamos los datos excluyendo el hash por seguridad
    const { contrasena_hash: _, ...datosUsuario } = usuarioEncontrado;
    return datosUsuario;
  }

  return { verificar };
}

module.exports = { crearModeloUsuarios };