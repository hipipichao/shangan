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

console.log('🔌 连接 Supabase（源）...');
const supabasePool = new Pool(SUPABASE_CONFIG);

console.log('🔌 连接 Neon（目标）...');
const neonPool = new Pool({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false } });

const BUSINESS_TABLES = [
  'tasks',
  'journals',
  'recurring_tasks',
  'recurring_task_completions',
  'idiom_wrongs',
  'idiom_searches',
  'custom_idioms',
];

async function main() {
  try {
    console.log('🔍 读取 Supabase users 表...');
    const supabaseUsers = await supabasePool.query(
      `SELECT id, email FROM users WHERE email IS NOT NULL`
    );
    console.log(`   Supabase 用户数: ${supabaseUsers.rows.length}`);

    console.log('🔍 读取 Neon users 表...');
    const neonUsers = await neonPool.query(
      `SELECT id, email FROM users WHERE email IS NOT NULL`
    );
    console.log(`   Neon 用户数: ${neonUsers.rows.length}`);

    const neonUsersByEmail = new Map(neonUsers.rows.map(u => [u.email.toLowerCase(), u.id]));

    const idMapping = new Map();
    for (const su of supabaseUsers.rows) {
      const neonId = neonUsersByEmail.get(su.email.toLowerCase());
      if (neonId) {
        idMapping.set(su.id, neonId);
        console.log(`   ✅ 匹配: ${su.email}  ${su.id} → ${neonId}`);
      } else {
        console.log(`   ❌ 未匹配: ${su.email} (Supabase id: ${su.id})`);
      }
    }

    if (idMapping.size === 0) {
      console.error('\n❌ 没有匹配的用户，无法继续');
      return;
    }

    console.log(`\n🔄 开始更新业务表的 userId...`);

    for (const table of BUSINESS_TABLES) {
      console.log(`\n📋 表: ${table}`);
      const neonClient = await neonPool.connect();
      try {
        await neonClient.query('BEGIN');

        let totalUpdated = 0;
        for (const [oldId, newId] of idMapping) {
          const res = await neonClient.query(
            `UPDATE "${table}" SET "userId" = $1 WHERE "userId" = $2`,
            [newId, oldId]
          );
          if (res.rowCount > 0) {
            console.log(`   ${oldId} → ${newId}: 更新 ${res.rowCount} 行`);
            totalUpdated += res.rowCount;
          }
        }

        await neonClient.query('COMMIT');
        console.log(`   ✅ 表 ${table} 更新完成，共 ${totalUpdated} 行`);
      } catch (e) {
        await neonClient.query('ROLLBACK');
        console.error(`   ❌ 表 ${table} 更新失败: ${e.message}`);
        throw e;
      } finally {
        neonClient.release();
      }
    }

    console.log('\n🎉 所有 userId 映射完成！');
  } catch (e) {
    console.error('\n❌ 出错:', e.message);
    process.exit(1);
  } finally {
    await supabasePool.end();
    await neonPool.end();
  }
}

main();