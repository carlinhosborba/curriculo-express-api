// scripts/init-db.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  console.log('➡️ Iniciando init-db...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const client = await pool.connect();
  try {
    console.log('🔌 Conectado ao Postgres. Iniciando TRANSACTION...');
    await client.query('BEGIN');

    console.log('🧱 Criando tabelas...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS person (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT,
        summary TEXT,
        email TEXT,
        phone TEXT,
        city TEXT,
        state TEXT,
        website TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS education (
        id SERIAL PRIMARY KEY,
        person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
        school TEXT NOT NULL,
        course TEXT NOT NULL,
        start_year INTEGER,
        end_year INTEGER
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS experience (
        id SERIAL PRIMARY KEY,
        person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        description TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project (
        id SERIAL PRIMARY KEY,
        person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        url TEXT,
        description TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS skill (
        id SERIAL PRIMARY KEY,
        person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        level TEXT
      );
    `);

    console.log('🧹 Limpando dados anteriores...');
    await client.query('DELETE FROM skill;');
    await client.query('DELETE FROM project;');
    await client.query('DELETE FROM experience;');
    await client.query('DELETE FROM education;');
    await client.query('DELETE FROM person;');

    console.log('👥 Inserindo pessoas...');
    const ana = await client.query(
      `INSERT INTO person (name, title, summary, email, phone, city, state, website)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      ['Ana Silva','Dev Front-End','Gosta de criar interfaces simples e claras.','ana@exemplo.com','(81) 99999-1111','Recife','PE','https://ana.dev']
    );

    const carlos = await client.query(
      `INSERT INTO person (name, title, summary, email, phone, city, state, website)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      ['Carlos Borba','Dev Front-End','Desenvolvedor web freelancer. Direito (FACET) e SI (UNICAP).','carlos@exemplo.com','(81) 99999-2222','Aliança','PE','https://carlos.dev']
    );

    const anaId = ana.rows[0].id;
    const carlosId = carlos.rows[0].id;
    console.log(`✅ IDs criados: Ana (${anaId}) | Carlos (${carlosId})`);

    console.log('🎓 Inserindo educação...');
    await client.query(
      `INSERT INTO education (person_id, school, course, start_year, end_year)
       VALUES ($1,'UNICAP','Sistemas para Internet',2024,2026)`,
      [anaId]
    );
    await client.query(
      `INSERT INTO education (person_id, school, course, start_year, end_year)
       VALUES
       ($1,'FACET','Direito',2012,2016),
       ($1,'UNICAP','Sistemas para Internet',2024,2026)`,
      [carlosId]
    );

    console.log('💼 Inserindo experiência...');
    await client.query(
      `INSERT INTO experience (person_id, company, role, start_date, end_date, description)
       VALUES ($1,'Prefeitura Recife','Estagiária Front-End','2024-01-01',NULL,'Suporte em front-end.')`,
      [anaId]
    );
    await client.query(
      `INSERT INTO experience (person_id, company, role, start_date, end_date, description)
       VALUES ($1,'Prefeitura da Aliança','Assessor Técnico','2019-01-01',NULL,'Atuação em gestão e inovação.')`,
      [carlosId]
    );

    console.log('🧩 Inserindo projetos...');
    await client.query(
      `INSERT INTO project (person_id, name, url, description)
       VALUES ($1,'Healnet','https://healnet-ipw.vercel.app/','Site para conexão com médicos.')`,
      [anaId]
    );
    await client.query(
      `INSERT INTO project (person_id, name, url, description)
       VALUES ($1,'Portfolio','https://portfolio.exemplo.com','Portfolio pessoal com Next.js')`,
      [carlosId]
    );

    console.log('🛠️ Inserindo skills...');
    await client.query(
      `INSERT INTO skill (person_id, name, level)
       VALUES ($1,'React','Intermediário'), ($1,'CSS','Intermediário')`,
      [anaId]
    );
    await client.query(
      `INSERT INTO skill (person_id, name, level)
       VALUES ($1,'JavaScript','Intermediário'), ($1,'Next.js','Intermediário')`,
      [carlosId]
    );

    await client.query('COMMIT');
    console.log('🎉 Banco criado e populado com sucesso!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('💥 Falha ao criar/popular banco:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log('👋 Conexão encerrada.');
  }
})();
