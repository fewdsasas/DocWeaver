import { ScanFileItem, ProjectMetadata } from '../types/context';

function findFile(files: ScanFileItem[], name: string): ScanFileItem | undefined {
  return files.find((f) => f.path === name || f.path.endsWith('/' + name));
}

export function parseAllMetadata(files: ScanFileItem[]): ProjectMetadata {
  const metadata: ProjectMetadata = {};

  // Node.js - package.json
  const pkgJson = findFile(files, 'package.json');
  if (pkgJson) {
    try {
      const p = JSON.parse(pkgJson.content);
      metadata.name = p.name;
      metadata.version = p.version;
      metadata.scripts = p.scripts || {};
      metadata.dependencies = p.dependencies ? Object.keys(p.dependencies) : [];
      metadata.devDependencies = p.devDependencies ? Object.keys(p.devDependencies) : [];
      metadata.packageManager = 'npm';
    } catch {
      console.warn(`⚠️ 无法解析 ${pkgJson.path}，已跳过`);
    }
  }

  // Go - go.mod
  const goMod = findFile(files, 'go.mod');
  if (goMod) {
    const m = goMod.content.match(/^module\s+(\S+)/m);
    const v = goMod.content.match(/^go\s+(\S+)/m);
    if (m) {
      metadata.name = metadata.name || m[1];
      metadata.packageManager = metadata.packageManager || 'go';
    }
    if (v) metadata.goVersion = v[1];
    const deps = goMod.content.match(/^\s+(\S+)\s+v[\d.]+/gm);
    if (deps && !metadata.dependencies) {
      metadata.dependencies = deps.map((d) => d.trim().split(/\s+/)[0]);
    }
  }

  // Rust - Cargo.toml
  const cargoToml = findFile(files, 'Cargo.toml');
  if (cargoToml) {
    const n = cargoToml.content.match(/^name\s*=\s*"([^"]+)"/m);
    const ver = cargoToml.content.match(/^version\s*=\s*"([^"]+)"/m);
    if (n) {
      metadata.name = metadata.name || n[1];
      metadata.packageManager = metadata.packageManager || 'cargo';
    }
    if (ver) metadata.version = metadata.version || ver[1];
  }

  // Python - pyproject.toml
  const pyproject = findFile(files, 'pyproject.toml');
  if (pyproject) {
    const n = pyproject.content.match(/^name\s*=\s*['"](.+?)['"]/m);
    const ver = pyproject.content.match(/^version\s*=\s*['"](.+?)['"]/m);
    if (n) {
      metadata.name = metadata.name || n[1];
      metadata.packageManager = metadata.packageManager || 'poetry/pip';
    }
    if (ver) metadata.version = metadata.version || ver[1];
  }

  // Python - requirements.txt
  const reqTxt = findFile(files, 'requirements.txt');
  if (reqTxt) {
    metadata.packageManager = metadata.packageManager || 'pip';
    const deps = reqTxt.content.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
    if (deps.length && !metadata.dependencies) {
      metadata.dependencies = deps.map((d) => d.split(/[=<>~!]/)[0].trim());
    }
  }

  // Java - pom.xml (Maven)
  const pomXml = findFile(files, 'pom.xml');
  if (pomXml) {
    const a = pomXml.content.match(/<artifactId>(.+?)<\/artifactId>/);
    const ver = pomXml.content.match(/<version>(.+?)<\/version>/);
    if (a && !a[1].includes('$')) {
      metadata.name = metadata.name || a[1];
    }
    if (ver && !ver[1].startsWith('$')) {
      metadata.version = metadata.version || ver[1];
    }
    metadata.packageManager = metadata.packageManager || 'maven';
  }

  // Java - build.gradle (Gradle)
  const gradle = findFile(files, 'build.gradle');
  if (gradle) {
    metadata.packageManager = metadata.packageManager || 'gradle';
    if (!metadata.name) {
      const rootName = gradle.content.match(/rootProject\.name\s*=\s*['"](.+?)['"]/);
      if (rootName) metadata.name = rootName[1];
    }
  }

  // Fallback
  if (!metadata.name) metadata.name = '待补充';
  if (!metadata.version) metadata.version = '0.1.0';

  return metadata;
}
