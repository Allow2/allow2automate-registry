# Allow2Automate Plugin Registry

This directory contains the official plugin registry for Allow2Automate. The registry uses a **namespace-based structure** to organize plugins by publisher, providing a scalable and organized approach to plugin distribution.

## 🏗️ Registry Structure

```
registry/
├── plugins.json              # Master registry index (all plugins)
├── schema.json              # JSON Schema for validation
├── README.md                # This file
└── plugins/                 # Namespace folders for publishers
    ├── @allow2/            # Official Allow2 plugins
    │   ├── allow2automate-wemo.json
    │   ├── allow2automate-ssh.json
    │   ├── allow2automate-battle.net.json
    │   ├── allow2automate-playstation.json
    │   └── ...
    ├── @mcafee/            # McAfee namespace (example)
    │   └── allow2automate-safefamily.json
    ├── @community/         # Community-contributed plugins
    │   └── ...
    └── @your-publisher/    # Your namespace
        └── your-plugin.json
```

## 📦 Namespace Organization

### What is a Namespace?

A namespace is a folder that groups all plugins from a single publisher or organization. This structure provides:

- **Organization:** Clear separation between official, third-party, and community plugins
- **Scalability:** Easy to add new publishers without cluttering the root directory
- **Discovery:** Users can browse plugins by publisher
- **Trust:** Official namespaces (like `@allow2`) are easily identifiable

### Namespace Naming Conventions

- Use lowercase letters, numbers, and hyphens only
- Start with `@` symbol (e.g., `@allow2`, `@mcafee`)
- Choose meaningful, recognizable names
- Examples:
  - `@allow2` - Official Allow2 plugins
  - `@mcafee` - McAfee plugins
  - `@community` - Community-contributed plugins
  - `@your-company` - Your organization's namespace

## 📄 Plugin File Structure

Each plugin has its own JSON file within a namespace folder:

```json
{
  "id": "allow2automate-wemo",
  "name": "@allow2/allow2automate-wemo",
  "shortName": "wemo",
  "version": "0.0.4",
  "description": "Enable Allow2Automate to control WeMo devices",
  "publisher": "allow2",
  "author": "Allow2",
  "category": "iot",
  "keywords": ["allow2automate", "wemo", "smart-home"],

  "repository": {
    "type": "git",
    "url": "https://github.com/Allow2/allow2automate-wemo"
  },

  "bugs": {
    "url": "https://github.com/Allow2/allow2automate-wemo/issues"
  },

  "homepage": "https://github.com/Allow2/allow2automate-wemo#readme",

  "main": "./dist/index.js",

  "releases": {
    "latest": "0.0.4"
  },

  "compatibility": {
    "automate": ">=2.0.0",
    "node": ">=14.0.0"
  },

  "dependencies": {
    "wemo-client": "^0.15.0"
  },

  "installation": {
    "type": "git",
    "url": "git+https://github.com/Allow2/allow2automate-wemo.git",
    "install_url": "git+https://github.com/Allow2/allow2automate-wemo.git#v0.0.4"
  },

  "metadata": {
    "hasGUI": true,
    "hasConfig": true,
    "requiresNetwork": true,
    "platform": ["win32", "darwin", "linux"],
    "verified": true,
    "featured": false
  },

  "pluginFile": "@allow2/allow2automate-wemo.json"
}
```

### Required Fields

- **id** (string): Unique plugin identifier (package name)
- **name** (string): Full scoped package name (e.g., `@allow2/plugin-name`)
- **version** (string): Semantic version (x.y.z)
- **description** (string): Brief description
- **repository** (object): Git repository information
- **pluginFile** (string): Path to this file within registry (e.g., `@allow2/plugin.json`)

### Optional Fields

- **shortName** - Display name
- **publisher** - Publisher/organization
- **author** - Author name
- **category** - Plugin category
- **keywords** - Search keywords
- **main** - Entry point file
- **releases** - Version information
- **compatibility** - Version requirements
- **dependencies** - NPM dependencies
- **installation** - Git installation URLs
- **metadata** - Additional flags

## 🆕 Adding New Plugins

### For Plugin Authors

#### Step 1: Choose Your Namespace

If you don't have a namespace yet:
1. Create a folder under `plugins/` with your namespace (e.g., `@my-company/`)
2. Ensure the name follows conventions (lowercase, `@prefix`)

#### Step 2: Create Plugin Metadata File

1. Copy the template structure above
2. Fill in all required fields
3. Save as `plugins/@your-namespace/your-plugin-name.json`

#### Step 3: Update Master Index

Add your plugin entry to `plugins.json`:

```json
{
  "plugins": [
    ...existing plugins...,
    {
      "id": "your-plugin-id",
      "name": "@your-namespace/your-plugin-name",
      "namespace": "@your-namespace",
      "pluginFile": "@your-namespace/your-plugin-name.json",
      "version": "1.0.0",
      "description": "...",
      "repository": { ... },
      "installation": { ... }
    }
  ]
}
```

#### Step 4: Update Timestamp

Update the `lastUpdated` field in `plugins.json`:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-12-23T15:30:00Z",
  ...
}
```

#### Step 5: Validate

Run schema validation:

```bash
npx ajv-cli validate -s schema.json -d plugins.json
```

#### Step 6: Submit

Submit a pull request with:
- Your new namespace folder (if first plugin)
- Your plugin metadata file
- Updated `plugins.json`
- Updated `lastUpdated` timestamp

## 🔍 Validation

### Schema Validation

All plugin files must conform to `schema.json`. Validate before submitting:

```bash
# Validate master registry
npx ajv-cli validate -s schema.json -d plugins.json

# Validate individual plugin file
npx ajv-cli validate -s schema.json -d plugins/@namespace/plugin.json
```

### Required Checks

Before submitting, ensure:
- ✅ Plugin ID is unique across all namespaces
- ✅ Semantic versioning is used (x.y.z format)
- ✅ Repository URL is valid and accessible
- ✅ Git install URL includes version tag
- ✅ All required fields are present
- ✅ Plugin file path matches namespace folder

## 🏷️ Categories

Available plugin categories:

| Category | Description |
|----------|-------------|
| `gaming` | Gaming platform parental controls |
| `connectivity` | Remote device connectivity and control |
| `iot` | IoT and smart home device control |
| `parental-controls` | Third-party parental control systems |
| `security` | Security and privacy tools |
| `utilities` | General utility plugins |

## 🚀 Installation

### Git-Based Installation

Plugins are installed directly from their Git repositories:

```bash
# Install latest version
npm install git+https://github.com/Allow2/allow2automate-wemo.git

# Install specific version
npm install git+https://github.com/Allow2/allow2automate-wemo.git#v0.0.4
```

### Allow2Automate UI

Users can browse and install plugins through the Allow2Automate interface:
1. Open Plugin Marketplace
2. Search or browse by category/namespace
3. Click "Install"
4. Plugin is cloned and installed automatically

## 📋 Namespace Guidelines

### Creating a New Namespace

1. **Official Organizations:** Contact Allow2 team for verified namespace
2. **Third-Party Publishers:** Submit PR with namespace folder
3. **Community:** Use `@community/` namespace

### Namespace Ownership

- `@allow2/` - Reserved for Allow2 official plugins
- `@mcafee/`, `@norton/`, etc. - Reserved for verified partners
- `@community/` - Open for community contributions
- Custom namespaces require verification for trademark protection

### Multiple Publishers

Each namespace folder should contain plugins from a single publisher:

```
plugins/
  @publisher-a/
    plugin1.json
    plugin2.json
  @publisher-b/
    plugin1.json
```

## 🔒 Security & Trust

### Verification Levels

Plugins can have different verification levels:

- **Verified** (`verified: true`) - Officially reviewed by Allow2
- **Community** - Popular community plugins
- **Unverified** - New or untested plugins

### Trust Indicators

Plugin metadata includes trust signals:
- Repository stars/forks
- Installation count
- User ratings
- Last update date
- Security scan results

## 🛠️ Development Workflow

### Local Testing

Test your plugin locally before submitting:

```bash
# Clone your plugin repo
git clone https://github.com/your-org/your-plugin.git

# Link for local development
cd your-plugin
npm link

# In Allow2Automate plugins directory
npm link your-plugin-name
```

### Versioning

Follow semantic versioning:
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes

Update version in:
1. Your plugin's `package.json`
2. Registry metadata file
3. Git tag (e.g., `v1.0.0`)

## 📖 API (Future)

The registry will be accessible via API:

```
GET /api/plugins                    # List all plugins
GET /api/plugins?namespace=@allow2  # Filter by namespace
GET /api/plugins/:id                # Get specific plugin
GET /api/namespaces                 # List all namespaces
GET /api/namespaces/:name/plugins   # Plugins in namespace
```

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Code of conduct
- Pull request process
- Plugin review criteria
- Namespace application process

## 📄 License

See repository [LICENSE](../LICENSE) file.

## 💬 Support

- **Issues:** [GitHub Issues](https://github.com/Allow2/automate/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Allow2/automate/discussions)
- **Email:** plugins@allow2.com

---

**Registry Version:** 1.0.0
**Last Updated:** 2025-12-23
