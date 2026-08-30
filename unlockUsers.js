require("dotenv").config();
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'caboose.proxy.rlwy.net',
    user: process.env.DB_USER || 'ybarillas',
    password: process.env.DB_PASSWORD || 'Umg1234!',
    database: process.env.DB_NAME || 'railway',
    port: parseInt(process.env.DB_PORT) || 42857,
    ssl: { rejectUnauthorized: false }
  });
  
  const hash = await bcrypt.hash("admin123", 10);
  
  // Reactivar todos los usuarios y asegurar contraseñas
  await conn.execute("UPDATE Usuarios SET activo = 1, contrasena_hash = ? WHERE email IN ('admin@pedidopro.com', 'ybarillas@pedidopro.com', 'ybarillss@pedidopro.com')", [hash]);

  const [users] = await conn.execute("SELECT id_usuario, nombre, email, activo FROM Usuarios");
  console.log("Usuarios activos en DB:", users);
  await conn.end();
})().catch(e => { console.error("Error:", e.message); process.exit(1); });
