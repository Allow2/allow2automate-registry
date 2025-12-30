# Allow2Automate Plugin Registry

**Simplified, Auto-Discovering Plugin Registry System**

## Overview

This registry eliminates duplication by using GitHub releases and package.json as the single source of truth. Plugin metadata is automatically discovered rather than manually maintained.

## Architecture

### Minimal Plugin Files

Each plugin has ONE small file: `plugins/@namespace/plugin-name.json`

```json
{
  "namespace": "@allow2",
  "name": "allow2automate-wemo",
  "repository": "https://github.com/Allow2/allow2automate-wemo"
}
```

**That's it!** Only 3 fields. No versions, no dates, no duplicated metadata.

### Auto-Discovery Process

The `build-registry.js` script:

1. Reads all minimal plugin files
2. Fetches latest release from GitHub API
3. Extracts package.json from that release
4. Builds complete `plugins.json` with all metadata

### Single Source of Truth

All plugin metadata lives in the plugin's `package.json` in the `allow2automate` section.

## Usage

### Building the Registry

```bash
cd registry
npm run build          # Build registry from GitHub
npm run build:verify   # Build and validate
npm run validate       # Validate existing registry
```

### Adding a New Plugin

1. Create minimal plugin file
2. Ensure plugin repo has tagged release and complete package.json
3. Run `npm run build`

Done! The plugin will be auto-discovered.

### Updating a Plugin Version

**Old workflow**: 8 manual steps with high error rate

**New workflow**: 3 steps
1. Update plugin's package.json version
2. Create git tag and release
3. Run `npm run build`

## Benefits

- Version exists once (git tag)
- Dates from GitHub (no manual updates)
- Plugin files: 58 lines → 3 lines
- Manual updates: 8 steps → 1 step
- Error rate: High → Low
- Scalability: Poor → Excellent

## Documentation

See `/mnt/ai/automate/docs/research/simplified-registry-design.md` for complete details.

## License

MIT
