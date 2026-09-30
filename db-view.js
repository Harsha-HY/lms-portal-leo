const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.db');

if (!fs.existsSync(dbPath)) {
  console.error(`\n❌ Error: Cannot find database file at: ${dbPath}\n`);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }

  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", async (e, tables) => {
    if (e) {
      console.error('Error fetching tables:', e.message);
      return;
    }

    const output = {};
    for (const table of tables) {
      const rows = await new Promise((resolve) => {
        db.all(`SELECT * FROM ${table.name}`, (err, res) => resolve(res || []));
      });
      output[table.name] = rows;
    }

    console.log(JSON.stringify(output, null, 2));
    db.close();
  });
});
