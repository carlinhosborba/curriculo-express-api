// api/index.js
const app = require('../src/app');
module.exports = (req, res) => app(req, res); // Vercel chama a função e passamos para o Express
