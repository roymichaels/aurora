const fs = require('fs');
const path = require('path');
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8'));
const deps = pkg.dependencies || {};

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

if (deps['react-day-picker'] && deps['react-day-picker'].startsWith('9.0')) {
  assert(deps.react === '18.2.0', 'react-day-picker 9.0.x requires react 18.2.0');
  assert(deps['react-dom'] === '18.2.0', 'react-day-picker 9.0.x requires react-dom 18.2.0');
  assert(deps['date-fns'] === '3.6.0', 'react-day-picker 9.0.x requires date-fns 3.6.0');
}
