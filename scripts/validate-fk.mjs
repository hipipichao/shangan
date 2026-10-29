import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');

function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const env = loadEnv(envPath);
const NEON_URL = env.DIRECT_URL || env.DATABASE_URL;

console.log('🔌 连接 Neon...');
const neonPool = new Pool({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false } });

const FK_TABLES = [
  { table: 'tasks', fkCol: 'userId', refTable: 'users', refCol: 'id' },
  { table: 'journals', fkCol: 'userId', refTable: 'users', refCol: 'id' },
  { table: 'recurring_tasks', fkCol: 'userId', refTable: 'users', refCol: 'id' },
  { table: 'recurring_task_completions', fkCol: 'userId', refTable: 'users', refCol: 'id' },
  { table: 'recurring_task_completions', fkCol: 'recurringTaskId', refTable: 'recurring_tasks', refCol: 'id' },
  { table: 'idiom_wrongs', fkCol: 'userId', refTable: 'users', refCol: 'id' },
  { table: 'idiom_searches', fkCol: 'userId', refTable: 'users', refCol: 'id' },
  { table: 'custom_idioms', fkCol: 'userId', refTable: 'users', refCol: 'id' },
];

async function main() {
  const client = await neonPool.connect();
  try {
    await client.query('BEGIN');

    for (const { table, fkCol, refTable, refCol } of FK_TABLES) {
      const countRes = await client.query(
        `SELECT COUNT(*) FROM "${table}" t WHERE NOT EXISTS (SELECT 1 FROM "${refTable}" r WHERE r."${refCol}" = t."${fkCol}")`
      );
      const orphanCount = parseInt(countRes.rows[0].count, 10);

      if (orphanCount > 0) {
        console.log(`🗑️  ${table}: 删除 ${orphanCount} 行孤儿数据 (${fkCol})`);
        await client.query(
          `DELETE FROM "${table}" t WHERE NOT EXISTS (SELECT 1 FROM "${refTable}" r WHERE r."${refCol}" = t."${fkCol}")`
        );
      } else {
        console.log(`✅ ${table}: 无孤儿数据 (${fkCol})`);
      }
    }

    console.log('\n🔍 查找所有 NOT VALID 外键约束并校验...');
    const fkRes = await client.query(`
      SELECT conrelid::regclass AS table_name, conname
      FROM pg_constraint
      WHERE contype = 'f' AND convalidated = false
    `);

    for (const fk of fkRes.rows) {
      try {
        await client.query(`ALTER TABLE "${fk.table_name}" VALIDATE CONSTRAINT "${fk.conname}"`);
        console.log(`✅ 校验通过: ${fk.table_name}.${fk.conname}`);
      } catch (e) {
        console.log(`❌ 校验失败: ${fk.table_name}.${fk.conname}: ${e.message}`);
      }
    }

    await client.query('COMMIT');
    console.log('\n🎉 完成！所有孤儿数据已删除，外键约束已校验');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ 出错:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await neonPool.end();
  }
}

main();