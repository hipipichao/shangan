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

const SUPABASE_CONFIG = {
  user: 'postgres.jpzmtwyguofwuiftwkcu',
  password: 'QOZaIgFknPeGAO5h',
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
};
const NEON_URL = env.DIRECT_URL || env.DATABASE_URL;

if (!NEON_URL) {
  console.error('❌ 找不到 Neon 数据库连接字符串，请检查 .env');
  process.exit(1);
}

console.log('🔌 连接 Supabase（源）...');
const supabasePool = new Pool(SUPABASE_CONFIG);

console.log('🔌 连接 Neon（目标）...');
const neonPool = new Pool({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false } });

const TABLES = [
  { name: 'tasks', fkCol: 'userId', fkRef: 'users' },
  { name: 'journals', fkCol: 'userId', fkRef: 'users' },
  { name: 'recurring_tasks', fkCol: 'userId', fkRef: 'users' },
  { name: 'recurring_task_completions', fkCol: 'userId', fkRef: 'users' },
  { name: 'idiom_wrongs', fkCol: 'userId', fkRef: 'users' },
  { name: 'idiom_searches', fkCol: 'userId', fkRef: 'users' },
  { name: 'custom_idioms', fkCol: 'userId', fkRef: 'users' },
];

async function getColumns(pool, table) {
  const res = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
    [table]
  );
  return res.rows.map(r => r.column_name);
}

async function getFkConstraints(pool, table) {
  const res = await pool.query(`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = $1::regclass AND contype = 'f'
  `, [table]);
  return res.rows;
}

async function migrateTable(table) {
  const tableName = table.name;
  console.log(`\n📋 迁移表: ${tableName}`);

  const sourceColumns = await getColumns(supabasePool, tableName);
  const targetColumns = await getColumns(neonPool, tableName);

  if (sourceColumns.length === 0) {
    console.log(`  ⚠️  源表 ${tableName} 不存在，跳过`);
    return;
  }

  if (targetColumns.length === 0) {
    console.log(`  ⚠️  目标表 ${tableName} 不存在，跳过`);
    return;
  }

  const commonColumns = sourceColumns.filter(c => targetColumns.includes(c));
  console.log(`  📊 源表列数: ${sourceColumns.length}, 目标表列数: ${targetColumns.length}, 共同列: ${commonColumns.length}`);

  if (commonColumns.length === 0) {
    console.log(`  ❌ 没有共同列，跳过`);
    return;
  }

  const colList = commonColumns.map(c => `"${c}"`).join(', ');
  const orderBy = commonColumns.includes('createdAt') ? 'ORDER BY "createdAt" ASC NULLS LAST' : '';
  const sourceRes = await supabasePool.query(`SELECT ${colList} FROM "${tableName}" ${orderBy}`);
  const rows = sourceRes.rows;
  console.log(`  📥 读取到 ${rows.length} 行数据`);

  if (rows.length === 0) {
    console.log(`  ✅ 表 ${tableName} 无数据，跳过`);
    return;
  }

  const fkConstraints = await getFkConstraints(neonPool, tableName);
  console.log(`  🔗 找到 ${fkConstraints.length} 个外键约束`);

  const neonClient = await neonPool.connect();
  try {
    await neonClient.query('BEGIN');

    for (const fk of fkConstraints) {
      await neonClient.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${fk.conname}"`);
    }

    let inserted = 0;
    let failed = 0;
    for (const row of rows) {
      const placeholders = commonColumns.map((_, i) => `$${i + 1}`).join(', ');
      const values = commonColumns.map(c => row[c]);

      try {
        await neonClient.query(
          `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
        inserted++;
      } catch (e) {
        failed++;
        if (failed <= 3) {
          console.log(`  ⚠️  插入失败 (id=${row.id || 'unknown'}): ${e.message}`);
        }
      }
    }

    for (const fk of fkConstraints) {
      try {
        await neonClient.query(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${fk.conname}" ${fk.def} NOT VALID`);
        console.log(`  ✅ 重建外键约束 ${fk.conname}（NOT VALID）`);
      } catch (e) {
        console.log(`  ⚠️  重建外键约束 ${fk.conname} 失败: ${e.message}`);
      }
    }

    await neonClient.query('COMMIT');
    console.log(`  ✅ 表 ${tableName} 迁移完成（成功: ${inserted}, 失败: ${failed}）`);
  } catch (e) {
    await neonClient.query('ROLLBACK');
    console.error(`  ❌ 表 ${tableName} 迁移失败: ${e.message}`);
    throw e;
  } finally {
    neonClient.release();
  }
}

async function main() {
  try {
    console.log('🚀 开始数据迁移: Supabase → Neon（跳过 users 表）\n');

    for (const table of TABLES) {
      await migrateTable(table);
    }

    console.log('\n🎉 迁移完成！');
  } catch (e) {
    console.error('\n❌ 迁移过程出错:', e.message);
    process.exit(1);
  } finally {
    await supabasePool.end();
    await neonPool.end();
  }
}

main();