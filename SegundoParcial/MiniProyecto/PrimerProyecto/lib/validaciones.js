function validarCorreo(correo){
    if (typeof correo !== 'string') return false;
    return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.text(correo.trim());
}

function validarBoleta(boleta){
    if (typeof boleta !== 'string') return false;
    return /^\d{10}$/.test(boleta.trim());
}