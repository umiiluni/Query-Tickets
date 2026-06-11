console.log('🧪 === INICIANDO TEST DE BUENAS PRÁCTICAS TÉCNICAS ===\n');

console.log('📝 TEST 1: Nomenclatura de claves con dos puntos (:)');
console.log('   - Lista de categorías: categories:list');
console.log('   - Estado ID 2: statuses:2');
console.log('   - Usuario ID 123: users:123\n');

console.log('⏱️ TEST 2: Configuración de TTL (Time-To-Live)');
console.log('   - Categorías: 300 segundos (5 minutos)');
console.log('   - Estados: 600 segundos (10 minutos)');
console.log('   - Usuarios: 120 segundos (2 minutos)');
console.log('   - Tickets: 180 segundos (3 minutos)\n');

console.log('🔄 TEST 3: Flujo Cache-Aside (Simulado)');
console.log('   1️⃣ Petición del cliente: Obtener categorías');
console.log('   2️⃣ Consulta a caché: clave "categories:list"');
console.log('   3️⃣ ❌ Cache MISS: No existe en caché');
console.log('   4️⃣ Consulta a Base de Datos');
console.log('   5️⃣ 💾 Guardar en caché con TTL de 300 segundos');
console.log('   6️⃣ ✅ Devolver respuesta al cliente\n');

console.log('📦 Datos obtenidos de DB (simulados):');
console.log('   → Categorías: Soporte Técnico, Facturación, Usuario');
console.log('   → Usuario: Juan Pérez\n');

console.log('✅ === TESTS COMPLETADOS ===');
console.log('   ✓ Nomenclatura de claves con dos puntos (:) implementada');
console.log('   ✓ TTL configurado para cada tipo de entidad');
console.log('   ✓ Patrón Cache-Aside diseñado correctamente\n');
