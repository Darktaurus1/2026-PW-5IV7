// La aplicación de la demo. server.js la arranca; las pruebas la arrancan con otras configuraciones.
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { crearModeloUsuarios } = require('./modelos/usuarios.modelo');

const NOMBRE_COOKIE = 'connect.sid';

// Si hay una sesion preexistente obtenerla del almacen, sino crearla
function todasLasSesiones(almacen) {
  return new Promise((resolve, reject) => {
    const promesa = almacen.all((error, sesiones) => (error ? reject(error) : resolve(sesiones)));
    if (promesa && typeof promesa.then === 'function') promesa.then(resolve, reject);
  });
}

function crearApp(config, pool) {
  const app = express();
  app.use(express.json());

  app.use(express.static(path.join(__dirname, 'public')));

  // Obtener el modelo de la bd
  const usuarios = crearModeloUsuarios(pool);

  // Definir el almacén de sesiones (memoria o MySQL)
  const almacen = config.almacen === 'memoria' 
    ? new session.MemoryStore() 
    : new MySQLStore({ createDatabaseTable: false, clearExpired: false }, pool);
  
  app.locals.almacen = almacen;

  // Configuración del middleware de sesiones
  app.use(
    session({
      name: NOMBRE_COOKIE,
      secret: process.env.SESSION_SECRET || 'secreto-solo.para-la-demo',
      store: almacen,
      resave: true, // IMPORTANTE: true para que resetee y guarde los cambios en perfil/visitas
      saveUninitialized: false,
      rolling: config.rolling || false,
      cookie: {
        maxAge: config.maxAge || config.maxAgeMs || 1000 * 60 * 60 * 24,
        httpOnly: config.httpOnly ?? true,
        sameSite: config.sameSite || 'lax',
        secure: config.secure || false,
      }
    })
  );

  // Función auxiliar para recortar el ID de sesión
  const cortoId = (id) => (id ? `${id.slice(0, 8)}...` : null);

  // Verificar si la sesión ha expirado
  function vencida(sesionSesion) {
    const tiempoMaximo = config.maxAge || config.maxAgeMs || 1000 * 60 * 60 * 24;
    const desde = config.rolling ? sesionSesion.ultimoUso : sesionSesion.creada;
    return Date.now() - desde > tiempoMaximo;
  }

  // Middleware para requerir sesión activa
  function requiereSesion(req, res, next) {
    if (req.session.usuario && vencida(req.session)) {
      return req.session.destroy((error) => {
        if (error) return next(error);
        res.clearCookie(NOMBRE_COOKIE);
        res.status(401).json({ error: '401 tu sesion ya expiro' });
      });
    }
    if (!req.session.usuario) {
      return res.status(401).json({ error: '401 no has iniciado sesion con la cuenta correcta' });
    }
    req.session.ultimoUso = Date.now();
    next();
  }

  // Middleware para requerir un rol específico
  function requiereRol(rol) {
    return (req, res, next) => {
      if (!req.session.usuario || req.session.usuario.rol !== rol) {
        const nombreUsuario = req.session.usuario ? req.session.usuario.usuario : 'invitado';
        return res.status(403).json({ error: `Eres ${nombreUsuario}, pero esta ruta es para ${rol}` });
      }
      next();
    };
  }

  // --- RUTAS DE LA API ---

  app.get('/api/config', (req, res) => {
    res.json(config);
  });

  app.post('/api/visita', (req, res) => {
    if (!req.session) return res.json({ error: 'no tiene acceso' });
    req.session.visitas = (req.session.visitas || 0) + 1;
    res.json({ visitas: req.session.visitas, sesion: cortoId(req.sessionID) });
  });

  app.post('/api/login', async (req, res, next) => {
    try {
      const { usuario, contrasena } = req.body || {};
      const datos = await usuarios.verificar(usuario, contrasena);
      
      if (!datos) return res.status(401).json({
        error: 'Usuario o contraseña no encontrado'
      });

      const antes = req.session.visitas !== undefined ? cortoId(req.sessionID) : null;
      const visitas = req.session.visitas || 0;

      const realizarLogin = () => {
        req.session.usuario = datos;
        req.session.visitas = visitas;
        req.session.creada = Date.now();
        req.session.ultimoUso = Date.now();
        
        // Al tocar la cookie y la sesión, forzamos su serialización limpia
        req.session.cookie.maxAge = config.maxAge || config.maxAgeMs || 1000 * 60 * 60 * 24;

        res.json({ 
          usuario: datos, 
          sesionAntes: antes, 
          sesionDespues: cortoId(req.sessionID) 
        });
      };

      if (config.regenerarAlEntrar) {
        req.session.regenerate((error) => {
          if (error) return next(error);
          realizarLogin();
        });
      } else {
        realizarLogin();
      }
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/logout', (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie(NOMBRE_COOKIE);
      res.json({ mensaje: 'Sesion cerrada' });
    });
  });

  app.get('/api/sesion', requiereSesion, (req, res) => {
    const tiempoMaximo = config.maxAge || config.maxAgeMs || 1000 * 60 * 60 * 24;
    const desde = config.rolling ? req.session.ultimoUso : req.session.creada;
    res.json({
      usuario: req.session.usuario,
      sesion: cortoId(req.sessionID),
      expiraEnSegundos: Math.max(0, Math.round((desde + tiempoMaximo - Date.now()) / 1000)),
    });
  });

app.get('/api/perfil', requiereSesion, (req, res, next) => {
  req.session.visitas = (req.session.visitas || 0) + 1;
  req.session.save((error) => {
    if (error) return next(error);
    res.json({
      usuario: req.session.usuario,
      visitas: req.session.visitas,
      mensaje: `Hola ${req.session.usuario.nombre} rol: ${req.session.usuario.rol}, visitas: ${req.session.visitas}`
    });
  });
});

  app.get('/api/admin/reporte', requiereSesion, requiereRol('admin'), (req, res) => {
    res.json({ mensaje: `Bienvenido al reporte exclusivo de administrador, ${req.session.usuario.nombre}` });
  });

  app.get('/api/diagnostico/sesiones', async (req, res, next) => {
    try {
      const sesiones = await todasLasSesiones(almacen);
      const lista = Object.entries(sesiones || {}).map(([id, s]) => ({
        sesion: cortoId(id),
        esLaTuya: id === req.sessionID,
        usuario: s.usuario ? s.usuario.usuario : 'Sin iniciar sesion',
        visitas: s.visitas || 0,
        expira: s.cookie && s.cookie.expires,
      }));
      res.json({ almacen: config.almacen, sesiones: lista });
    } catch (error) {
      next(error);
    }
  });

  return app;
}

module.exports = { crearApp, NOMBRE_COOKIE };