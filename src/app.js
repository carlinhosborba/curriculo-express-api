// src/app.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ ok: true, api: 'curriculo' });
});

/**
 * Helper simples para gerar CRUD de tabela.
 * ATENÇÃO: só vai funcionar após criarmos as tabelas no Item 10.
 */
function crud(table, fields, fkField = null) {
  const router = express.Router();

  // LISTA (opcionalmente filtrando por chave estrangeira: ?person_id=1)
  router.get('/', async (req, res) => {
    try {
      if (fkField && req.query[fkField]) {
        const { rows } = await db.query(
          `SELECT * FROM ${table} WHERE ${fkField} = $1 ORDER BY id`,
          [req.query[fkField]]
        );
        return res.json(rows);
      }
      const { rows } = await db.query(`SELECT * FROM ${table} ORDER BY id`);
      res.json(rows);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'erro listando' });
    }
  });

  // BUSCA POR ID
  router.get('/:id', async (req, res) => {
    try {
      const { rows } = await db.query(
        `SELECT * FROM ${table} WHERE id = $1`,
        [req.params.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'nao encontrado' });
      res.json(rows[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'erro buscando' });
    }
  });

  // CRIA
  router.post('/', async (req, res) => {
    try {
      const cols = [];
      const vals = [];
      const params = [];
      fields.forEach((f) => {
        if (req.body[f] !== undefined) {
          cols.push(f);
          vals.push(`$${params.length + 1}`);
          params.push(req.body[f]);
        }
      });
      if (!cols.length) return res.status(400).json({ error: 'sem campos' });

      const { rows } = await db.query(
        `INSERT INTO ${table} (${cols.join(',')}) VALUES (${vals.join(',')}) RETURNING *`,
        params
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'erro criando' });
    }
  });

  // ATUALIZA
  router.put('/:id', async (req, res) => {
    try {
      const sets = [];
      const params = [];
      fields.forEach((f) => {
        if (req.body[f] !== undefined) {
          params.push(req.body[f]);
          sets.push(`${f} = $${params.length}`);
        }
      });
      if (!sets.length) return res.status(400).json({ error: 'sem campos' });
      params.push(req.params.id);

      const { rows } = await db.query(
        `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (!rows[0]) return res.status(404).json({ error: 'nao encontrado' });
      res.json(rows[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'erro atualizando' });
    }
  });

  // REMOVE
  router.delete('/:id', async (req, res) => {
    try {
      const { rowCount } = await db.query(
        `DELETE FROM ${table} WHERE id = $1`,
        [req.params.id]
      );
      if (!rowCount) return res.status(404).json({ error: 'nao encontrado' });
      res.status(204).send();
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'erro removendo' });
    }
  });

  return router;
}

// Rotas das entidades (funcionarão após criarmos as tabelas no Item 10)
app.use('/people',      crud('person',    ['name','title','summary','email','phone','city','state','website']));
app.use('/educations',  crud('education', ['person_id','school','course','start_year','end_year'], 'person_id'));
app.use('/experiences', crud('experience',['person_id','company','role','start_date','end_date','description'], 'person_id'));
app.use('/projects',    crud('project',   ['person_id','name','url','description'], 'person_id'));
app.use('/skills',      crud('skill',     ['person_id','name','level'], 'person_id'));

// Rotas de relacionamento por pessoa (também dependem das tabelas)
app.get('/people/:id/educations', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM education WHERE person_id=$1 ORDER BY id', [req.params.id]);
  res.json(rows);
});
app.get('/people/:id/experiences', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM experience WHERE person_id=$1 ORDER BY id', [req.params.id]);
  res.json(rows);
});
app.get('/people/:id/projects', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM project WHERE person_id=$1 ORDER BY id', [req.params.id]);
  res.json(rows);
});
app.get('/people/:id/skills', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM skill WHERE person_id=$1 ORDER BY id', [req.params.id]);
  res.json(rows);
});

module.exports = app;
