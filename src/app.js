const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');

const app = express();

// Middlewares globales
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/public', express.static('public'));
app.use(morgan('dev')); // Logging HTTP en consola

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const mesasRoutes = require('./routes/mesasRoutes');
const menuRoutes = require('./routes/menuRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const cocinaRoutes = require('./routes/cocinaRoutes');
const cajaRoutes = require('./routes/cajaRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Definir endpoints base
app.use('/api/auth', authRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/cocina', cocinaRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/dashboard', dashboardRoutes);

const db = require('./config/db');

app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT COUNT(*) as total_usuarios FROM Usuarios');
        res.json({
            status: 'online',
            db_connected: true,
            total_usuarios: rows[0].total_usuarios,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        res.status(500).json({
            status: 'error',
            db_connected: false,
            error: e.message
        });
    }
});

app.get('/', (req, res) => {
    res.send('API de PedidoPro funcionando correctamente.');
});

module.exports = app;



