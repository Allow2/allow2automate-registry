#!/usr/bin/env node

/**
 * Simplify Plugin Files
 *
 * Converts existing verbose plugin JSON files to minimal format:
 * - Only keeps: namespace, name, repository
 * - All other metadata will be auto-discovered by build-registry.js
 */

const fs = require('fs').promises;
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, 'plugins');

async function simplifyPluginFile(filePath) {
  console.log(`Processing: ${path.basename(filePath)}`);

  const current = JSON.parse(await fs.readFile(filePath, 'utf8'));

  // Extract repository URL
  let repoUrl = current.repository?.url || current.repository;
  if (typeof repoUrl === 'string') {
    repoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
  }

  // Extract namespace from file path or name
  const namespace = current.namespace || '@allow2';

  // Extract plugin name (without namespace)
  const fullName = current.name;
  const pluginName = fullName.replace('@allow2/', '').replace(/^allow2automate-/, 'allow2automate-');

  // Create minimal version
  const minimal = {
    namespace,
    name: pluginName,
    repository: repoUrl
  };

  // Backup original
  const backupPath = filePath + '.backup';
  await fs.copyFile(filePath, backupPath);

  // Write simplified version
  await fs.writeFile(filePath, JSON.stringify(minimal, null, 2) + '\n');

  console.log(`  ✓ Simplified (backup: ${path.basename(backupPath)})`);
  console.log(`    ${Object.keys(current).length} fields → ${Object.keys(minimal).length} fields`);

  return minimal;
}

async function findPluginFiles() {
  const namespaces = await fs.readdir(PLUGINS_DIR);
  const files = [];

  for (const namespace of namespaces) {
    const nsPath = path.join(PLUGINS_DIR, namespace);
    const stat = await fs.stat(nsPath);

    if (stat.isDirectory()) {
      const pluginFiles = await fs.readdir(nsPath);

      for (const file of pluginFiles) {
        if (file.endsWith('.json') && !file.endsWith('.backup')) {
          files.push(path.join(nsPath, file));
        }
      }
    }
  }

  return files;
}

(async () => {
  try {
    console.log('🔧 Simplifying Plugin Files...\n');
    console.log('═'.repeat(60));

    const files = await findPluginFiles();
    console.log(`\nFound ${files.length} plugin files\n`);

    for (const file of files) {
      await simplifyPluginFile(file);
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`✅ All plugin files simplified!`);
    console.log(`   Files processed: ${files.length}`);
    console.log(`   Backups created: ${files.length}`);
    console.log('\nNote: Original files saved as *.json.backup');
    console.log('Run "npm run registry:build" to generate full registry');

  } catch (error) {
    console.error('\n❌ Simplification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
