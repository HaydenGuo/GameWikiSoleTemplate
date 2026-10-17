import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const baseSha = process.argv[2];
if (!baseSha || !/^[0-9a-f]{40}$/i.test(baseSha)) {
  console.error('Usage: node scripts/check-release-policy.mjs <base-commit-sha>');
  process.exit(2);
}

const currentVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;
const previousPackage = JSON.parse(
  execFileSync('git', ['show', `${baseSha}:package.json`], { encoding: 'utf8' }),
);
const previousVersion = previousPackage.version;
const parseVersion = (value) => {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value ?? '');
  return match ? match.slice(1).map(Number) : null;
};
const current = parseVersion(currentVersion);
const previous = parseVersion(previousVersion);

if (!current) {
  console.error(`::error::package.json version "${currentVersion}" must use stable SemVer X.Y.Z.`);
  process.exit(1);
}
if (!previous) {
  console.error(
    `::error::Base package.json version "${previousVersion}" must use stable SemVer X.Y.Z.`,
  );
  process.exit(1);
}

const isNewer = current.some(
  (part, index) =>
    current.slice(0, index).every((value, prefixIndex) => value === previous[prefixIndex]) &&
    part > previous[index],
);
if (!isNewer) {
  console.error(
    `::error::Increase package.json version above the target branch version ${previousVersion}; PR version is ${currentVersion}.`,
  );
  process.exit(1);
}

const changelog = readFileSync('CHANGELOG.md', 'utf8');
const escapedVersion = currentVersion.replaceAll('.', '\\.');
const heading = new RegExp(`^## \\[${escapedVersion}\\] - (\\d{4}-\\d{2}-\\d{2})\\s*$`, 'm');
const match = heading.exec(changelog);
if (!match) {
  console.error(
    `::error::CHANGELOG.md must contain a dated heading for version ${currentVersion}.`,
  );
  process.exit(1);
}

const date = new Date(`${match[1]}T00:00:00Z`);
if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]) {
  console.error(`::error::Changelog date ${match[1]} is not a valid calendar date.`);
  process.exit(1);
}

const section = changelog
  .slice(match.index + match[0].length)
  .split(/^## /m, 1)[0]
  .trim();
if (!section) {
  console.error(`::error::The ${currentVersion} changelog section must contain release notes.`);
  process.exit(1);
}

console.log(
  `Release policy passed: ${previousVersion} → ${currentVersion} with a dated changelog entry.`,
);
