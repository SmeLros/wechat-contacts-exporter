const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const execAsync = promisify(exec);
const CONCURRENCY = 10;

function run(cmd) {
  return execAsync(cmd, {
    encoding: 'utf-8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    maxBuffer: 10 * 1024 * 1024,
  }).then(r => r.stdout);
}

function askOutputDir() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const defaultDir = path.join(os.homedir(), 'Desktop');
  return new Promise(resolve => {
    rl.question(`Output directory / 输出目录 (default / 默认: ${defaultDir}): `, answer => {
      rl.close();
      const dir = answer.trim() || defaultDir;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      resolve(dir);
    });
  });
}

async function getContactList() {
  console.log('Step 1: Querying contacts from a-z and 0-9 ...');
  console.log('步骤 1：正在搜索所有联系人 ...');
  const all = [];
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (const ch of chars) {
    const out = await run(`wechat-cli contacts --query "${ch}" --format json`);
    const re = /"username":\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(out))) all.push(m[1]);
  }
  const unique = [...new Set(all)];
  const realContacts = unique.filter(u => u.startsWith('wxid_'));
  console.log(`  Total unique / 共去重后: ${unique.length}, Real contacts / 真实联系人: ${realContacts.length}`);
  return realContacts;
}

async function detail(username) {
  try {
    const out = await run(`wechat-cli contacts --detail "${username}" --format json`);
    const obj = JSON.parse(out);
    return {
      wxid: obj.username ?? '',
      nickname: obj.nick_name ?? '',
      wechat_id: obj.alias ?? '',
      remark: obj.remark ?? '',
      description: obj.description ?? '',
    };
  } catch {
    return { wxid: username, nickname: '', wechat_id: '', remark: '', description: '' };
  }
}

async function fetchAllDetails(contacts) {
  console.log('Step 2: Getting contact details ...');
  console.log(`步骤 2：正在获取联系人详情 (并发=${CONCURRENCY}) ...`);
  const total = contacts.length;
  const results = new Array(total);
  let next = 0;

  const worker = async () => {
    while (true) {
      const idx = next++;
      if (idx >= total) break;
      results[idx] = await detail(contacts[idx]);
      if (idx % 5 === 0 || idx === total - 1) {
        process.stdout.write(`\r  ${Math.min(idx + 1, total)}/${total}`);
      }
    }
  };

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('='.repeat(50));
  console.log('WeChat Contacts Exporter');
  console.log('='.repeat(50));
  console.log('');
  console.log('[Security Advice / 安全建议]');
  console.log('wechat-cli runs fully locally, all data stays on your machine.');
  console.log('wechat-cli 为纯本地操作，所有数据不会离开本机。');
  console.log('For maximum safety, consider disconnecting the network before proceeding.');
  console.log('为了极致的数据安全并避免微信风控误检，建议先断开网络再执行。');
  console.log('');

  const outputDir = await askOutputDir();

  const contacts = await getContactList();
  const results = await fetchAllDetails(contacts);

  console.log('\n');

  const fileName = `${new Date().toISOString().replace(/[:.]/g, '-')}.wechat_contacts.csv`;
  const outputPath = path.join(outputDir, fileName);

  const esc = v => `"${String(v).replace(/"/g, '""')}"`;
  const header = 'wxid,nickname,wechat_id,remark,description';
  const lines = results.map(r => [r.wxid, r.nickname, r.wechat_id, r.remark, r.description].map(esc).join(','));
  fs.writeFileSync(outputPath, '\ufeff' + header + '\n' + lines.join('\n'), 'utf-8');

  console.log(`Done / 完成! Total / 共计: ${contacts.length} contacts / 位联系人`);
  console.log(`Output / 输出: ${outputPath}`);
}

main().catch(console.error);
