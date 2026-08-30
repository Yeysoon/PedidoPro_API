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
  const id_rol = roles[0]?.id_rol || 1;

  // Insert or update admin@pedidopro.com
  await conn.execute(
    "INSERT INTO Usuarios (id_rol, nombre, email, contrasena_hash, activo) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE contrasena_hash=VALUES(contrasena_hash), activo=1",
    [id_rol, "Admin Principal", "admin@pedidopro.com", hash, 1]
  );

  // Insert or update ybarillas@pedidopro.com
  await conn.execute(
    "INSERT INTO Usuarios (id_rol, nombre, email, contrasena_hash, activo) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE contrasena_hash=VALUES(contrasena_hash), activo=1",
    [id_rol, "Yeysoon Barillas", "ybarillas@pedidopro.com", hash, 1]
  );

  // Insert or update ybarillss@pedidopro.com (por si hay typo)
  await conn.execute(
    "INSERT INTO Usuarios (id_rol, nombre, email, contrasena_hash, activo) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE contrasena_hash=VALUES(contrasena_hash), activo=1",
    [id_rol, "Yeysoon Barillas", "ybarillss@pedidopro.com", hash, 1]
  );

  console.log("Usuarios actualizados correctamente con password: admin123");
  const [users] = await conn.execute("SELECT id_usuario, nombre, email, activo FROM Usuarios");
  console.log("Lista final de usuarios en DB:", users);
  await conn.end();
})().catch(e => { console.error("Error:", e.message); process.exit(1); });
