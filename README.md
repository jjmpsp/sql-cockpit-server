# SQL Cockpit Server installer test

Minimal Electron, React and TypeScript Hello World application. Not production-ready; does not run a server or connect to databases.

## Development
Node 22.12+ required. Run `npm ci`, `npm run dev`. Checks: `npm test`, `npm run build`, `npm run smoke`.

## Platform-specific files
Put Windows files in `payloads/win32/`, macOS files in `payloads/darwin/`, Linux files in `payloads/linux/`. electron-builder's platform-specific `extraResources` copies only the selected directory to `resources/server-payload/` outside ASAR. At runtime use `process.resourcesPath`. The placeholder validates and prints hello.txt on startup. Keep hello.txt until replacing that validation with real server startup checks. For architecture-specific payloads, add architecture filters or a beforePack hook before shipping architecture-specific executables. Payload files do not execute automatically; implement lifecycle, permissions and service registration explicitly for real server deployment.

## Installers
`npm run package:win`, `npm run package:mac`, `npm run package:linux`. Build on the corresponding operating system. macOS has arm64 and x64 DMGs; Windows x64 EXE; Linux x64 AppImage. Dependencies and generated binaries are ignored.

## Releases
Update package.json and package-lock.json together (`npm version 0.0.2 --no-git-tag-version`). Add releases/v0.0.2.md, commit, push main, tag v0.0.2, push the tag. GitHub Actions builds all four installers, tests the renderer/version bridge, verifies filenames and checksums, then publishes a stable latest test release. Read-only build jobs; only the publishing job has contents:write via GITHUB_TOKEN. No npm or app-store publishing.

## Future signing
Current Windows/Linux builds are unsigned. Mac is ad-hoc signed, not notarized. Configure real signing only with your own certificates and secrets: electron-builder CSC_LINK/CSC_KEY_PASSWORD for certificates, plus Apple notarization credentials and hardened runtime. Enable Windows executable signing and replace the macOS ad-hoc identity only after configuring credentials. Never commit certificates. Test-build release notes must continue to identify signing status accurately.
