// Funcion para llamar respuestas
async function llamar(metodo, url, datosBody = null) {
  const opciones = {
    method: metodo,
    headers: { 'Content-Type': 'application/json' }
  };
  if (datosBody) {
    opciones.body = JSON.stringify(datosBody);
  }
  try {
    const respuesta = await fetch(url, opciones);
    const datos = await respuesta.json();
    return { status: respuesta.status, datos };
  } catch (error) {
    return { status: 500, datos: { error: error.message } };
  }
}
//Funcion para agregar en la bitacora los botones segun lo que vallamos presionando
function agregarABitacora(metodo, url, status, datos) {
  const bitacora = document.getElementById('bitacora');
  let claseColor = 'codigo error';
  if (status >= 200 && status < 300) claseColor = 'codigo ok';
  else if (status === 401) claseColor = 'codigo e401';
  else if (status === 403) claseColor = 'codigo e403';

  const li = document.createElement('li');
  const spanInfo = document.createElement('span');
  spanInfo.className = claseColor;
  spanInfo.textContent = `[${status}] ${metodo} ${url}`;

  const preJson = document.createElement('pre');
  preJson.textContent = JSON.stringify(datos, null, 2);

  li.appendChild(spanInfo);
  li.appendChild(preJson);
  bitacora.prepend(li);
}

// Funcion refrescar para refrescar todo
async function refrescarTodo() {
  // Etapa 3: Estado y cookies
  const resSesion = await llamar('GET', '/api/sesion');
  const divEstado = document.getElementById('estado');
  const preCookie = document.getElementById('cookie-js');
  preCookie.textContent = document.cookie || '(vacío)';

  if (resSesion.status === 200) {
    const d = resSesion.datos;
    divEstado.className = 'estado con-sesion';
    divEstado.textContent = `Conectado como ${d.usuario.nombre} (${d.usuario.rol}) · Sesión: ${d.sesion} · Expira en ${d.expiraEnSegundos ?? 'N/A'}s`;
  } else {
    divEstado.className = 'estado sin-sesion';
    divEstado.textContent = 'Sin sesión (el servidor responde 401)';
  }

  // Diagnostica la sesion en el que pone la fecha y todo eso
  const resDiag = await llamar('GET', '/api/diagnostico/sesiones');
  const pDonde = document.getElementById('donde');
  const tbody = document.getElementById('tabla-sesiones');

  if (resDiag.status === 200) {
    pDonde.textContent = `Almacenamiento actual: ${resDiag.datos.almacen}`;
    tbody.innerHTML = '';
    
    if (resDiag.datos.sesiones.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">(sin sesiones)</td></tr>';
      return;
    }

    resDiag.datos.sesiones.forEach(s => {
      const tr = document.createElement('tr');
      if (s.esLaTuya) tr.className = 'tuya';

      const tdSesion = document.createElement('td');
      tdSesion.textContent = s.esLaTuya ? `${s.sesion} (la tuya)` : s.sesion;
      const tdUsuario = document.createElement('td');
      tdUsuario.textContent = s.usuario;
      const tdVisitas = document.createElement('td');
      tdVisitas.textContent = s.visitas;
      const tdVence = document.createElement('td');
      tdVence.textContent = s.expira ? new Date(s.expira).toLocaleTimeString() : 'N/A';

      tr.appendChild(tdSesion);
      tr.appendChild(tdUsuario);
      tr.appendChild(tdVisitas);
      tr.appendChild(tdVence);
      tbody.appendChild(tr);
    });
  }
}


document.addEventListener('DOMContentLoaded', async () => {
  //  Cargar config al iniciar
  const resConfig = await llamar('GET', '/api/config');
  document.getElementById('config').textContent = JSON.stringify(resConfig.datos, null, 2);

  await refrescarTodo();

  //  Manejar formulario de Login
  const formLogin = document.querySelector('form'); // O el selector de tu form de login
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usuario = document.getElementById('usuario').value; // Ajusta según tus IDs
      const contrasena = document.getElementById('contrasena').value;

      const res = await llamar('POST', '/api/login', { usuario, contrasena });
      agregarABitacora('POST', '/api/login', res.status, res.datos);
      await refrescarTodo();
    });
  }

  //  Botones con data-url
  document.querySelectorAll('button[data-url]').forEach(boton => {
    boton.addEventListener('click', async () => {
      const metodo = boton.dataset.metodo;
      const url = boton.dataset.url;
      const res = await llamar(metodo, url);
      agregarABitacora(metodo, url, res.status, res.datos);
      await refrescarTodo();
    });
  });
// Cambio automático de contraseña en el <select> que lo selecciona el usuario y pone la contraseña
  const selectUsuario = document.getElementById('usuario');
  const inputContrasena = document.getElementById('contrasena');
  if (selectUsuario && inputContrasena) {
    const contraseñasPorDefecto = { ana: 'ana12345', luis: 'luis12345', admin: 'admin12345' };
    selectUsuario.addEventListener('change', () => {
      inputContrasena.value = contraseñasPorDefecto[selectUsuario.value] || '';
    });
  }
});