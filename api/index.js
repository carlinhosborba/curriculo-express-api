// api/index.js
const app = require('../src/app');

// exporta uma função que delega para o Express
module.exports = (req, res) => app(req, res);
