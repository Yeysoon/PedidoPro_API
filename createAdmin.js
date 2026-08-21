require("dotenv").config();
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306
  });
  console.log("Conectado a la DB");
  const hash = await bcrypt.hash("admin123", 10);
  const [roles] = await conn.execute("SELECT id_rol FROM Roles WHERE nombre_rol = 'Administrador'");
  if (!roles.length) { console.log("ERROR: Rol Administrador no existe. Ejecuta primero el SQL de tablas."); await conn.end(); return; }
  await conn.execute(
    "INSERT INTO Usuarios (id_rol, nombre, email, contrasena_hash, activo) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE contrasena_hash=VALUES(contrasena_hash), activo=1",
    [roles[0].id_rol, "Admin Principal", "admin@pedidopro.com", hash, 1]
  );
  console.log("Admin creado exitosamente");
  console.log("Email: admin@pedidopro.com");
  console.log("Password: admin123");
  await conn.end();
})().catch(e => { console.error("Error:", e.message); process.exit(1); });
