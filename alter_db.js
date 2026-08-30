require('dotenv').config();
const db = require('./src/config/db');

async function alterTable() {
    try {
        await db.execute('ALTER TABLE Productos ADD COLUMN imagen_url VARCHAR(255) NULL;');
        console.log('Columna agregada exitosamente.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('La columna ya existe.');
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        process.exit();
    }
}
alterTable();
