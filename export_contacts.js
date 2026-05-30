const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);
const dynamicFileName = `${new Date().toISOString().replace(/[:.]/g, '-')}.wechat_contacts_node.csv`;
const OUTPUT = path.resolve('e:/apps/temp/output', dynamicFileName);
const CONCURRENCY = 10;

function run(cmd) {
  return execAsync(cmd, {
    encoding: 'utf-8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    maxBuffer: 10 * 1024 * 1024,
  }).then(r => r.stdout);
}

async function getContactList() {
  console.log('Step 1: Querying contacts from a-z and 0-9 ...');
  const all = [];
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (const ch of chars) {
    const out = await run(`wechat-cli contacts --query "${ch}" --format json`);
    const re = /"username":\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(out))) all.push(m[1]);
  }
  const unique = [...new Set(all)];
  const skip = new Set(['qmessage', 'qqmail', 'medianote', 'floatbottle', 'filehelper']);
  const realContacts = unique.filter(u =>
    !u.startsWith('gh_') && !u.includes('@chatroom') && !skip.has(u)
  );
  console.log(`  Total unique: ${unique.length}, Real contacts: ${realContacts.length}`);
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
  console.log(`Step 2: Getting contact details (concurrency=${CONCURRENCY}) ...`);
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
  const contacts = await getContactList();
  const results = await fetchAllDetails(contacts);

  console.log('\n');

  // Write CSV (BOM for Excel)
  const esc = v => `"${String(v).replace(/"/g, '""')}"`;
  const header = 'wxid,nickname,wechat_id,remark,description';
  const lines = results.map(r => [r.wxid, r.nickname, r.wechat_id, r.remark, r.description].map(esc).join(','));
  fs.writeFileSync(OUTPUT, '\ufeff' + header + '\n' + lines.join('\n'), 'utf-8');

  console.log(`Done! Total: ${contacts.length} contacts`);
  console.log(`Output: ${OUTPUT}`);

  // preview
  console.log('\nPreview (first 20):');
  results.slice(0, 20).forEach(r => {
    const nick = r.nickname.padEnd(20).slice(0, 20);
    const wid = (r.wechat_id || '-').padEnd(18).slice(0, 18);
    const rem = (r.remark || '-').padEnd(12).slice(0, 12);
    console.log(`  ${r.wxid.padEnd(28).slice(0, 28)} ${nick} ${wid} ${rem}`);
  });
  if (results.length > 20) console.log(`  ... and ${results.length - 20} more`);
}

main().catch(console.error);
