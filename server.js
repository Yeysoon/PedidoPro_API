require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Servidor PedidoPro API corriendo en http://${HOST}:${PORT}`);
});
