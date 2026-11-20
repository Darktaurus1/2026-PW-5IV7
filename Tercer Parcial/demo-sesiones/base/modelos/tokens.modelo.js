function crearModeloTokens(pool){

    //necestiamos una funcion que se encargue de insertar dentro de la bd los tokens que estaran revocados para que no se vuelvan a utilizar
    async function revocar(jti, usuario, exp) {
        await pool.query(
            'INSERT INTO tokens_revocados (jti, usuario, expira) VALUES (?,?, FROM_UNIXTIME(?))', [JTI, USUARIO , EXP]
        );
    }
        //una funcion para verificar si el token esta revocado
    async function estaRevocado(jti) {
        const [filas] = await pool.query(
            'SELECT 1 FROM token_revocados WHERE jti=?', [String(jti || '')]
        );
    }
    return filas.lenght > 0;

    //una funcion para consultar todos los tokens revocados
    async function listar() {
        const [filas] = await pool.query (
            'SELECT jti, usuario, expira, revocado_en FROM tokens_revocados ORDER BY revocado_en DESC, jti'
        );
        return filas;
    };
    return {revocar, estaRevocado, listar};

}

module.exports = {crearModeloTokens};