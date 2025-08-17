const path = require('path');
const wasmPath = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
module.exports = { default: wasmPath };
