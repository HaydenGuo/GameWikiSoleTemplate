import { readFileSync } from 'node:fs';

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const targetCommit = process.env.GITHUB_SHA;
if (!repository || !token || !targetCommit) {
  console.error('GITHUB_REPOSITORY, GITHUB_TOKEN, and GITHUB_SHA are required.');
  process.exit(2);
}

const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const changelog = readFileSync('CHANGELOG.md', 'utf8');
const escapedVersion = version.replaceAll('.', '\\.');
const heading = new RegExp(`^## \\[${escapedVersion}\\] - \\d{4}-\\d{2}-\\d{2}\\s*$`, 'm');
const match = heading.exec(changelog);
if (!match) {
  console.error(`No dated changelog section found for ${version}.`);
  process.exit(1);
}
const notes = changelog
  .slice(match.index + match[0].length)
  .split(/^## /m, 1)[0]
  .trim();
if (!notes) {
  console.error(`Changelog section for ${version} is empty.`);
  process.exit(1);
}

const api = `https://api.github.com/repos/${repository}/releases`;
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
};
const tag = `v${version}`;
const existing = await fetch(`${api}/tags/${encodeURIComponent(tag)}`, { headers });
if (existing.ok) {
  console.log(`GitHub Release ${tag} already exists; nothing to do.`);
  process.exit(0);
}
if (existing.status !== 404) {
  console.error(`Could not check for existing release (${existing.status}).`);
  process.exit(1);
}

const response = await fetch(api, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tag_name: tag,
    target_commitish: targetCommit,
    name: tag,
    body: notes,
    draft: false,
    prerelease: false,
    generate_release_notes: false,
  }),
});
if (!response.ok) {
  console.error(`GitHub Release creation failed (${response.status}).`);
  process.exit(1);
}
const release = await response.json();
console.log(`Created ${tag}: ${release.html_url}`);
