// ============================================================================
// TEST SIMPLE: VERIFICACIÓN UNITARIA DE LLAVES
// ============================================================================

const { buildKey, KEY_PREFIXES } = require('./cache-service');

console.log('🚀 Ejecutando verificación de firmas de llaves...');

try {
    const keyLista = buildKey(KEY_PREFIXES.EVENTOS);
    const keyDetalle = buildKey(KEY_PREFIXES.RECINTOS, 3);

    if (keyLista === 'eventos:lista:activos' && keyDetalle === 'recintos:estructura:id:3') {
        console.log('🟢 [OK]: Las llaves construidas coinciden exactamente con la entrega teórica del grupo.');
        console.log(`   -> Lista: ${keyLista}`);
        console.log(`   -> Detalle: ${keyDetalle}`);
    } else {
        console.log('🔴 [FAIL]: Desajuste en el formato de strings.');
        console.log(`   Recibido Lista: ${keyLista}`);
        console.log(`   Recibido Detalle: ${keyDetalle}`);
    }
} catch (error) {
    console.error('❌ Error crítico al ejecutar el test unitario:', error.message);
}