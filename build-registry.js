#!/usr/bin/env node

/**
 * Build Plugin Registry
 *
 * Auto-generates the full plugin registry by:
 * 1. Reading minimal plugin files from registry/plugins directory
 * 2. Fetching latest release data from GitHub API
 * 3. Extracting package.json from each release
 * 4. Building complete registry.json with all metadata
 *
 * This eliminates duplication - version/date/metadata exists only in:
 * - Git tags (version & date)
 * - package.json (all metadata)
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Configuration
const REGISTRY_DIR = path.join(__dirname);
const PLUGINS_DIR = path.join(REGISTRY_DIR, 'plugins');
const OUTPUT_FILE = path.join(REGISTRY_DIR, 'plugins.json');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional, increases rate limit

// GitHub API helpers
async function githubRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Allow2Automate-Registry-Builder',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else if (res.statusCode === 404) {
          resolve(null);
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchLatestRelease(repoUrl) {
  // Extract owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }

  const [, owner, repo] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

  console.log(`  Fetching latest release: ${owner}/${repo}`);
  const release = await githubRequest(apiUrl);

  if (!release) {
    // No releases, try tags
    const tagsUrl = `https://api.github.com/repos/${owner}/${repo}/tags`;
    const tags = await githubRequest(tagsUrl);

    if (!tags || tags.length === 0) {
      throw new Error(`No releases or tags found for ${owner}/${repo}`);
    }

    // Use first tag as "release"
    return {
      tag_name: tags[0].name,
      published_at: new Date().toISOString(), // Approximate
      tarball_url: tags[0].tarball_url,
      zipball_url: tags[0].zipball_url
    };
  }

  return release;
}

async function fetchPackageJson(repoUrl, tagName) {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }

  const [, owner, repo] = match;

  // Try to fetch package.json from the release tag
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${tagName}/package.json`;

  console.log(`  Fetching package.json from ${tagName}`);

  return new Promise((resolve, reject) => {
    https.get(rawUrl, (res) => {
      let data = '';

      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid package.json: ${e.message}`));
          }
        } else {
          reject(new Error(`Failed to fetch package.json: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
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
        if (file.endsWith('.json')) {
          files.push(path.join(nsPath, file));
        }
      }
    }
  }

  return files;
}

function extractShortName(fullName) {
  // @allow2/allow2automate-steam -> steam
  return fullName.split('-').pop();
}

function buildInstallationInfo(repoUrl, tagName) {
  const version = tagName.replace(/^v/, '');

  return {
    type: "git",
    url: `git+${repoUrl}.git`,
    install_url: `git+${repoUrl}.git#${tagName}`
  };
}

function extractMetadataFromPackageJson(pkg) {
  const allow2 = pkg.allow2automate || {};

  return {
    name: pkg.name,
    shortName: allow2.shortName || extractShortName(pkg.name),
    version: pkg.version,
    description: pkg.description,
    publisher: pkg.author?.name || pkg.author || 'allow2',
    author: pkg.author?.name || pkg.author || 'Allow2',
    category: allow2.category || 'utilities',
    keywords: pkg.keywords || [],
    repository: pkg.repository,
    bugs: pkg.bugs,
    homepage: pkg.homepage,
    main: pkg.main,
    compatibility: {
      automate: allow2.minAppVersion || ">=2.0.0",
      node: pkg.engines?.node || ">=14.0.0"
    },
    dependencies: pkg.dependencies || {},
    metadata: {
      hasGUI: allow2.metadata?.hasGUI || false,
      hasConfig: allow2.metadata?.hasConfig || false,
      requiresCredentials: allow2.metadata?.requiresCredentials || false,
      requiresNetwork: allow2.metadata?.requiresNetwork || false,
      requiresPermissions: allow2.metadata?.requiresPermissions || false,
      platform: allow2.metadata?.platform || ["win32", "darwin", "linux"],
      verified: allow2.metadata?.verified || false,
      featured: allow2.metadata?.featured || false
    },
    api: allow2.api || undefined,
    screenshots: [],
    documentation: pkg.homepage || `${pkg.repository?.url}#readme`,
    support: pkg.bugs?.url || `${pkg.repository?.url}/issues`,
    license: pkg.license || 'MIT'
  };
}

async function buildPluginEntry(pluginFile) {
  const minimal = JSON.parse(await fs.readFile(pluginFile, 'utf8'));

  console.log(`\nProcessing: ${minimal.name}`);

  try {
    // Fetch release data from GitHub
    const release = await fetchLatestRelease(minimal.repository);

    // Fetch package.json from that release
    const packageJson = await fetchPackageJson(minimal.repository, release.tag_name);

    // Build full plugin metadata
    const plugin = {
      ...extractMetadataFromPackageJson(packageJson),
      namespace: minimal.namespace,
      pluginFile: path.relative(REGISTRY_DIR, pluginFile),
      releases: {
        latest: release.tag_name.replace(/^v/, ''),
        versions: {
          [release.tag_name.replace(/^v/, '')]: {
            published: release.published_at,
            changelog: release.body || "Updated release"
          }
        }
      },
      installation: buildInstallationInfo(minimal.repository, release.tag_name)
    };

    console.log(`  ✓ Version ${plugin.version} published ${release.published_at}`);

    return plugin;
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    throw error;
  }
}

function aggregateCategories(plugins) {
  const categories = {
    gaming: {
      name: "Gaming",
      description: "Plugins for gaming platform parental controls"
    },
    connectivity: {
      name: "Connectivity",
      description: "Plugins for remote device connectivity and control"
    },
    iot: {
      name: "IoT & Smart Home",
      description: "Plugins for Internet of Things and smart home device control"
    },
    "parental-controls": {
      name: "Parental Controls",
      description: "Plugins for third-party parental control systems"
    },
    utilities: {
      name: "Utilities",
      description: "Utility plugins for automation, scripting, and plugin development"
    }
  };

  return categories;
}

function aggregateNamespaces(plugins) {
  const namespaces = {};

  plugins.forEach(plugin => {
    if (!namespaces[plugin.namespace]) {
      namespaces[plugin.namespace] = {
        name: plugin.namespace === '@allow2' ? 'Allow2' : plugin.namespace,
        description: `Official ${plugin.namespace} plugins`,
        homepage: plugin.repository?.url?.replace(/\/[^\/]+$/, '') || '',
        totalPlugins: 0
      };
    }
    namespaces[plugin.namespace].totalPlugins++;
  });

  return namespaces;
}

async function buildRegistry() {
  console.log('🔨 Building Plugin Registry...\n');
  console.log('═'.repeat(60));

  // Find all plugin files
  const pluginFiles = await findPluginFiles();
  console.log(`\nFound ${pluginFiles.length} plugin files`);

  // Process each plugin
  const plugins = [];
  for (const file of pluginFiles) {
    try {
      const plugin = await buildPluginEntry(file);
      plugins.push(plugin);
    } catch (error) {
      console.error(`Failed to process ${file}:`, error.message);
      if (process.argv.includes('--strict')) {
        process.exit(1);
      }
    }
  }

  // Build full registry
  const registry = {
    $schema: "./schema.json",
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    plugins: plugins.sort((a, b) => a.name.localeCompare(b.name)),
    namespaces: aggregateNamespaces(plugins),
    categories: aggregateCategories(plugins),
    metadata: {
      totalPlugins: plugins.length,
      totalNamespaces: Object.keys(aggregateNamespaces(plugins)).length,
      namespaceOrganization: {
        enabled: true,
        structure: "plugins/@namespace/plugin-name.json",
        description: "Plugins are organized by namespace folders for better management and scalability"
      },
      templates: {
        excluded: true,
        description: "Template plugins (like allow2automate-plugin) are maintained as starter kits but excluded from the registry to avoid confusion with production plugins"
      }
    }
  };

  // Write output
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(registry, null, 2));

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Registry built successfully!`);
  console.log(`   Plugins: ${plugins.length}`);
  console.log(`   Output: ${OUTPUT_FILE}`);
  console.log(`   Updated: ${registry.lastUpdated}`);

  return registry;
}

async function validateRegistry() {
  console.log('🔍 Validating Registry...\n');

  const registry = JSON.parse(await fs.readFile(OUTPUT_FILE, 'utf8'));
  let errors = 0;

  // Check for duplicate names
  const names = new Set();
  registry.plugins.forEach(plugin => {
    if (names.has(plugin.name)) {
      console.error(`✗ Duplicate plugin name: ${plugin.name}`);
      errors++;
    }
    names.add(plugin.name);
  });

  // Validate required fields
  registry.plugins.forEach(plugin => {
    const required = ['name', 'version', 'description', 'repository', 'category'];
    required.forEach(field => {
      if (!plugin[field]) {
        console.error(`✗ Missing ${field} in ${plugin.name}`);
        errors++;
      }
    });
  });

  if (errors === 0) {
    console.log('✅ Registry is valid!');
    return true;
  } else {
    console.error(`\n✗ Found ${errors} validation errors`);
    return false;
  }
}

// Main execution
(async () => {
  try {
    if (process.argv.includes('--validate')) {
      const valid = await validateRegistry();
      process.exit(valid ? 0 : 1);
    } else {
      await buildRegistry();

      if (process.argv.includes('--verify')) {
        await validateRegistry();
      }
    }
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
