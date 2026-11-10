// La aplicación de la demo. server.js la arranca; las pruebas la arrancan con otras configuraciones.
// Lo que dice "(en clase)" lo programamos juntos, paso por paso. Mientras no esté, esa ruta responde 501.
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { crearModeloUsuarios } = require('./modelos/usuarios.modelo');

const NOMBRE_COOKIE = 'connect.sid';

//Si hay una funcion preexistente obtenerlo del almacen sino crearla




function todasLasSesiones(almacen) {
  return new Promise((resolve, reject) => {
    const promesa = almacen.all((error, sesiones) => (error ? reject(error) : resolve(sesiones)));
    if (promesa && typeof promesa.then === 'function') promesa.then(resolve, reject);
  });
}
function crearApp(config, pool) {
  const app = express();
  app.use(express.json());
  //primero debemos obtener el modelo de la bd
  const usuarios = crearModeloUsuarios(pool);
//aqui nosotros debemos de identifacar la seson sera por tabla en bd, o la sesion sera una cookie en memoria del navegador, o es una mezcla, sesion en memoria de servidor y por tabla en bd y cookie en navgador y bd
  const almacen =
    config.almacen === 'memoria'
      ? new session.MemoryStore()
      : new MySQLStore({ createDatabaseTable: false, clearExpired: false }, pool);
  app.locals.almacen = almacen;
}
app.use(
  session({
    name : NOMBRE_COOKIE,
    secret : process.env.SESSION_SECRET || 'secreto-solo-para-la-demo',
    store : almacen,
    resave : false,
    //no se crea la sesion ni la cookie
    saveUninitialized : false,
    rolling : config.rolling || false, 
    cookie : {
      maxAge : config.maxAge || 1000 * 60 * 60 * 24, //1 dia
      httpOnly : config.httpOnly || true,
      sameSite : config.sameSite || 'lax',
      secure : config.secure || false,
    },
  })
);

//necesitamos visualizar el id de la sesion para compararla en la pantalla.

const cortoId = (id) => (id ? `${id.slice(0, 8)}...`: null);

//nosotros estamos ocupando un widdLeware , el cual es el que se encarga de comunicar el back y el front , para ello nosotros debemos de obtener la sesion a partir de express, pero en cada peticion debemos de devolver la sesion , para ello el atributo rolling , la extienede aunque le hayamos dado false, nose puede confiar en que la expire, para ello debemos identificarla y validar en sus diferentes momentos

function vencida(sesion){
  const desde = config.rolling ? sesion.ultimoUso : 
  sesion.creada;
}