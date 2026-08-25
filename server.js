const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const path = require('path');

// Le decimos a Node que sirva los archivos estáticos de tu carpeta webapp
app.use(express.static(path.join(__dirname, 'src/main/webapp')));

// Conexión a la base de datos SQLite (se crea el archivo 'equipo.db')
const db = new sqlite3.Database('./equipo.db', (err) => {
    if (err) {
        console.error("Error al conectar a la BD:", err.message);
    } else {
        console.log("Conectado a la base de datos SQLite 'equipo.db'.");
        
        // Tabla SQL de Jugadores
        db.run(`CREATE TABLE IF NOT EXISTS jugadores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            dorsal INTEGER,
            posicion TEXT,
            asistencias INTEGER DEFAULT 0
        )`);

        // Tabla SQL de Partidos (guardamos los goleadores como texto separado por comas)
        db.run(`CREATE TABLE IF NOT EXISTS partidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT,
            rival TEXT,
            golesLocal TEXT,
            golesVisitante TEXT,
            goleadores TEXT
        )`);
    }
});

// ==========================================
// RUTAS API PARA JUGADORES
// ==========================================

// Obtener todos los jugadores
app.get('/api/jugadores', (req, res) => {
    db.all("SELECT * FROM jugadores", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Guardar un nuevo jugador
app.post('/api/jugadores', (req, res) => {
    const { nombre, dorsal, posicion } = req.body;
    db.run("INSERT INTO jugadores (nombre, dorsal, posicion) VALUES (?, ?, ?)", 
        [nombre, dorsal, posicion], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Editar un jugador
app.put('/api/jugadores/:id', (req, res) => {
    const { nombre, dorsal, posicion, asistencias } = req.body;
    db.run("UPDATE jugadores SET nombre = ?, dorsal = ?, posicion = ?, asistencias = ? WHERE id = ?", 
        [nombre, dorsal, posicion, asistencias, req.params.id], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

// Borrar un jugador
app.delete('/api/jugadores/:id', (req, res) => {
    db.run("DELETE FROM jugadores WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// ==========================================
// RUTAS API PARA PARTIDOS
// ==========================================

// Obtener todos los partidos
app.get('/api/partidos', (req, res) => {
    db.all("SELECT * FROM partidos", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Convertimos el texto de goleadores de vuelta a un Array
        const partidosFormatted = rows.map(p => ({
            ...p,
            goleadores: p.goleadores ? p.goleadores.split(',') : []
        }));
        res.json(partidosFormatted);
    });
});

// Guardar un nuevo partido
app.post('/api/partidos', (req, res) => {
    const { fecha, rival, golesLocal, golesVisitante, goleadores } = req.body;
    const goleadoresTxt = Array.isArray(goleadores) ? goleadores.join(',') : '';
    db.run("INSERT INTO partidos (fecha, rival, golesLocal, golesVisitante, goleadores) VALUES (?, ?, ?, ?, ?)", 
        [fecha, rival, golesLocal, golesVisitante, goleadoresTxt], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Editar un partido
app.put('/api/partidos/:id', (req, res) => {
    const { fecha, rival, golesLocal, golesVisitante, goleadores } = req.body;
    const goleadoresTxt = Array.isArray(goleadores) ? goleadores.join(',') : '';
    db.run("UPDATE partidos SET fecha = ?, rival = ?, golesLocal = ?, golesVisitante = ?, goleadores = ? WHERE id = ?", 
        [fecha, rival, golesLocal, golesVisitante, goleadoresTxt, req.params.id], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

// Borrar un partido
app.delete('/api/partidos/:id', (req, res) => {
    db.run("DELETE FROM partidos WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// Encendemos el servidor en el puerto 3000
app.listen(3000, () => {
    console.log('¡Servidor SQL (Node.js + Express) activo en http://localhost:3000 !');
});