

const talleres = [
  { nombre: 'Introducción a Python', instructor: 'Ing. María López', cupo: 25, inscritos: 25 },
  { nombre: 'Fundamentos de Redes', instructor: 'Ing. Carlos Ramírez', cupo: 30, inscritos: 18 },
  { nombre: 'Diseño de Bases de Datos', instructor: 'Ing. Ana Torres', cupo: 20, inscritos: 20 },
  { nombre: 'Desarrollo Web con JS', instructor: 'Ing. María López', cupo: 25, inscritos: 10 },
];



function pintarTabla(){
    const tabla = document.getElementById('tabla-talleres');
    tabla.innerHTML = '';

    talleres.forEach((taller) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${taller.nombre}</td>
            <td>${taller.instructor}</td>
            <td>${taller.cupo}</td>
            <td>${taller.inscritos}</td>
        `;
        tabla.appendChild(fila);
    });

    //debe de obtener la tabla y rellenarla con los datos de talleres
}
const formArreglos = document.getElementById('form-arreglos');
const resultadoArreglos = document.getElementById('resultado-arreglo');
const selectOperacionArreglo = document.getElementById('operacion-arreglo');

formArreglos.addEventListener('submit', (evento) =>{
    evento.preventDefault();
    const operacion = selectOperacionArreglo.value;

    let resultado;

    switch(operacion){
        case 'forEach':
            resultado = talleres.map((t) => `- ${t.nombre} (${t.inscritos}/${t.cupo})`).join('<br>');
            break;
        case 'map':
            resultado = talleres.map((t) => t.nombre).join(', ');
            break;
        case 'filter':
            resultado = talleres.filter((t) => t.inscritos >= t.cupo).map((t) => t.nombre).join(', ');
            break;
        case 'find':
            const taller = talleres.find((t) => t.instructor === 'Ing. María López');
            resultado = taller ? taller.nombre : 'No se encontró el taller';
            break;
        
        
    pintarTabla(resultado);
    }


    resultadoArreglos.textContent = resultado;
});
pintarTabla();
//Segunda parte
const formObjeto = document.getElementById('form-objeto');
const resultadoObjeto = document.getElementById('resultado-objeto');

formObjeto.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const taller = {
        nombre : document.getElementById('obj-nombre').value,
        instructor: document.getElementById('obj-instructor').value,
        cupo : Number(document.getElementById('obj-cupo').value),
        inscritos : Number(document.getElementById('obj-inscritos').value)
    };
    const operacion = document.getElementById('operacion-objeto').value;

    let resultado;
    switch(operacion){
        case'keys':
            resultado = JSON.stringify(Object.keys(taller));
        break;
        case'values':
        break;
        case'entries':
        resultado = Object.entries(taller).map(([campo, valor]) => '$(campo):$(valor)').join('\n'); 
        break;
        case'stringify':
        break;
        case'roundtrip':
        break;
    }
    resultadoObjeto.textContent = resultado;
})