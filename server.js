require('dotenv').config();
console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── BASE DE DATOS ────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'servicios2ml_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ─── INICIALIZAR BASE DE DATOS ────────────────────────────────────────────────
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS servicios (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(20) UNIQUE NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        precio_min DECIMAL(10,2),
        precio_max DECIMAL(10,2),
        imagen_url VARCHAR(500),
        disponible BOOLEAN DEFAULT true,
        eliminado BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Crear admin por defecto si no existe
    const adminExists = await pool.query("SELECT id FROM admin_users WHERE username = 'admin'");
    if (adminExists.rows.length === 0) {
      const hash = await bcrypt.hash('admin', 10);
      await pool.query("INSERT INTO admin_users (username, password) VALUES ('admin', $1)", [hash]);
      console.log('✅ Usuario admin creado');
    }

    // Insertar servicios iniciales si la tabla está vacía
    const serviciosExist = await pool.query("SELECT COUNT(*) FROM servicios WHERE eliminado = false");
    if (parseInt(serviciosExist.rows[0].count) === 0) {
      const serviciosIniciales = [
        { codigo: 'S2ML-001', nombre: 'Certificaciones de Nacimiento', descripcion: 'Tramitamos tu certificación de nacimiento ante el RENAP. Servicio rápido y confiable. Necesitas traer tu DPI original y copia.', precio_min: 15.00, precio_max: 25.00, imagen_url: 'https://img.icons8.com/fluency/96/birth-certificate.png' },
        { codigo: 'S2ML-002', nombre: 'Pagos de la SAT', descripcion: 'Realizamos tus pagos a la Superintendencia de Administración Tributaria (SAT). Incluye pagos de impuestos, declaraciones y más.', precio_min: 10.00, precio_max: 20.00, imagen_url: 'https://img.icons8.com/fluency/96/tax.png' },
        { codigo: 'S2ML-003', nombre: 'Antecedentes Penales', descripcion: 'Gestión de constancia de antecedentes penales en línea. Documento oficial emitido por el Ministerio de Gobernación de Guatemala.', precio_min: 15.00, precio_max: 20.00, imagen_url: 'https://img.icons8.com/fluency/96/police-badge.png' },
        { codigo: 'S2ML-004', nombre: 'Trámite de NIT', descripcion: 'Te ayudamos a solicitar tu Número de Identificación Tributaria (NIT) ante la SAT. Necesario para realizar facturas y trámites fiscales.', precio_min: 15.00, precio_max: 25.00, imagen_url: 'https://img.icons8.com/fluency/96/document.png' },
        { codigo: 'S2ML-005', nombre: 'Antecedentes Policiacos', descripcion: 'Tramitamos tu constancia de antecedentes policiacos emitida por la Policía Nacional Civil (PNC) de Guatemala.', precio_min: 15.00, precio_max: 20.00, imagen_url: 'https://img.icons8.com/fluency/96/detective.png' },
        { codigo: 'S2ML-006', nombre: 'Asesoría Contable', descripcion: 'Brindamos asesoría contable para empresas y personas individuales. Declaraciones, contabilidad general, planillas y más.', precio_min: 50.00, precio_max: 200.00, imagen_url: 'https://img.icons8.com/fluency/96/accounting.png' },
        { codigo: 'S2ML-007', nombre: 'Emplasticado', descripcion: 'Plastificado de documentos importantes como DPI, carné de vacunas, documentos personales y más. Protege tus documentos.', precio_min: 5.00, precio_max: 15.00, imagen_url: 'https://img.icons8.com/fluency/96/lamination.png' },
        { codigo: 'S2ML-008', nombre: 'Fotocopias', descripcion: 'Servicio de fotocopiado de documentos en blanco y negro y a color. Copias de alta calidad a precios accesibles.', precio_min: 0.50, precio_max: 2.00, imagen_url: 'https://img.icons8.com/fluency/96/copy.png' },
        { codigo: 'S2ML-009', nombre: 'Remesas', descripcion: 'Recepción y envío de remesas del extranjero. Servicio seguro y confiable para recibir dinero de tus familiares en el exterior.', precio_min: 10.00, precio_max: 30.00, imagen_url: 'https://img.icons8.com/fluency/96/money-transfer.png' },
        { codigo: 'S2ML-010', nombre: 'Depósitos', descripcion: 'Realizamos depósitos a diferentes bancos del sistema bancario guatemalteco. Rápido, seguro y sin filas.', precio_min: 5.00, precio_max: 15.00, imagen_url: 'https://img.icons8.com/fluency/96/bank-building.png' },
        { codigo: 'S2ML-011', nombre: 'Retiro de Ahorro', descripcion: 'Gestión de retiros de cuentas de ahorro de diferentes entidades bancarias. Servicio ágil y seguro.', precio_min: 5.00, precio_max: 15.00, imagen_url: 'https://img.icons8.com/fluency/96/savings.png' },
        { codigo: 'S2ML-012', nombre: 'Pago de Cheques', descripcion: 'Cobro y gestión de cheques de diferentes bancos del sistema financiero guatemalteco.', precio_min: 10.00, precio_max: 20.00, imagen_url: 'https://img.icons8.com/fluency/96/cheque.png' },
        { codigo: 'S2ML-013', nombre: 'Recargas Telefónicas', descripcion: 'Recargas para todas las operadoras: Tigo, Claro, Movistar y más. Inmediatas y al instante en cualquier monto.', precio_min: 5.00, precio_max: 100.00, imagen_url: 'https://img.icons8.com/fluency/96/phone-disconnected.png' },
        { codigo: 'S2ML-014', nombre: 'Pago de Servicios', descripcion: 'Pago de luz (EEGSA, DEOCSA, DEORSA), teléfono, agua, internet, cable y muchos servicios más. Todo en un solo lugar.', precio_min: 5.00, precio_max: 15.00, imagen_url: 'https://img.icons8.com/fluency/96/electricity.png' }
      ];

      for (const s of serviciosIniciales) {
        await pool.query(
          `INSERT INTO servicios (codigo, nombre, descripcion, precio_min, precio_max, imagen_url) VALUES ($1,$2,$3,$4,$5,$6)`,
          [s.codigo, s.nombre, s.descripcion, s.precio_min, s.precio_max, s.imagen_url]
        );
      }
      console.log('✅ Servicios iniciales insertados');
    }

    console.log('✅ Base de datos inicializada correctamente');
  } catch (err) {
    console.error('❌ Error inicializando BD:', err.message);
  }
}

// ─── RUTAS PÚBLICAS (usuarios) ─────────────────────────────────────────────────
app.get('/api/servicios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM servicios WHERE eliminado = false ORDER BY codigo ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/servicios/:codigo', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM servicios WHERE codigo = $1 AND eliminado = false',
      [req.params.codigo]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── RUTAS DE AUTENTICACIÓN ────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

    req.session.adminId = user.id;
    req.session.adminUsername = user.username;
    res.json({ success: true, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  if (req.session.adminId) {
    res.json({ authenticated: true, username: req.session.adminUsername });
  } else {
    res.json({ authenticated: false });
  }
});

// ─── MIDDLEWARE DE AUTENTICACIÓN ───────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.adminId) return res.status(401).json({ error: 'No autorizado' });
  next();
}

// ─── RUTAS DE ADMIN (inventario) ───────────────────────────────────────────────
app.get('/api/admin/servicios', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM servicios ORDER BY codigo ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/servicios', requireAuth, async (req, res) => {
  const { nombre, descripcion, precio_min, precio_max, imagen_url, disponible } = req.body;
  try {
    // Generar código único
    const lastCodigo = await pool.query(
      "SELECT codigo FROM servicios ORDER BY id DESC LIMIT 1"
    );
    let newNum = 1;
    if (lastCodigo.rows.length > 0) {
      const lastNum = parseInt(lastCodigo.rows[0].codigo.split('-')[1]);
      newNum = lastNum + 1;
    }
    const codigo = `S2ML-${String(newNum).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO servicios (codigo, nombre, descripcion, precio_min, precio_max, imagen_url, disponible)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [codigo, nombre, descripcion, precio_min, precio_max, imagen_url || '', disponible !== false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/servicios/:codigo', requireAuth, async (req, res) => {
  const { nombre, descripcion, precio_min, precio_max, imagen_url, disponible } = req.body;
  try {
    const result = await pool.query(
      `UPDATE servicios SET nombre=$1, descripcion=$2, precio_min=$3, precio_max=$4,
       imagen_url=$5, disponible=$6, updated_at=NOW()
       WHERE codigo=$7 RETURNING *`,
      [nombre, descripcion, precio_min, precio_max, imagen_url, disponible, req.params.codigo]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/servicios/:codigo', requireAuth, async (req, res) => {
  try {
    // Soft delete — el código queda guardado para siempre
    const result = await pool.query(
      'UPDATE servicios SET eliminado=true, updated_at=NOW() WHERE codigo=$1 RETURNING *',
      [req.params.codigo]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ success: true, message: `Servicio ${req.params.codigo} eliminado (código reservado permanentemente)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PÁGINAS HTML ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/servicios', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/inventario', (req, res) => res.sendFile(path.join(__dirname, 'public', 'inventario.html')));

// ─── INICIAR SERVIDOR ──────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Error fatal:', err);
});
