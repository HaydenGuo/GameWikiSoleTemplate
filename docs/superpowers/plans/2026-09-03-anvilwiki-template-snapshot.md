# AnvilWiki Template Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate `D:\HBCodeRepo\GameWebs\template - AnvilWiki` with a clean, reusable AnvilWiki template snapshot while excluding runtime artifacts and source-control history.

**Architecture:** Copy the template source surface directly from `D:\github_repos\AnvilWiki` into the isolated destination. Preserve versioned source, configuration, documentation, Skills, workflows, tests, and tool source; deliberately exclude dependencies, generated output, caches, secrets, logs, and `.git`. Validate the result structurally without installing or executing anything.

**Tech Stack:** Astro, TypeScript, MDX, pnpm, GitHub Actions, PowerShell.

---

### Task 1: Copy the filtered template surface

**Files:**
- Create: `D:\HBCodeRepo\GameWebs\template - AnvilWiki\` (all allowed AnvilWiki source files)
- Source: `D:\github_repos\AnvilWiki\`

- [ ] **Step 1: Define the exact excluded directory and file patterns**

Use this PowerShell data set:

```powershell
$excludedDirectories = @('.git', 'node_modules', '.astro', 'dist', 'coverage')
$excludedFilePatterns = @('.env', '.env.*', '*.log')
```

Keep `.env.example` despite the `.env.*` pattern.

- [ ] **Step 2: Copy only allowed files and directories into the empty destination**

Run:

```powershell
$source = 'D:\github_repos\AnvilWiki'
$target = 'D:\HBCodeRepo\GameWebs\template - AnvilWiki'
Copy-Item -LiteralPath (Join-Path $source '.agent') -Destination $target -Recurse
Copy-Item -LiteralPath (Join-Path $source '.github') -Destination $target -Recurse
robocopy (Join-Path $source 'docs') (Join-Path $target 'docs') /E /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -gt 7) { throw "Documentation copy failed with robocopy exit code $LASTEXITCODE" }
Copy-Item -LiteralPath (Join-Path $source 'public') -Destination $target -Recurse
Copy-Item -LiteralPath (Join-Path $source 'requirements') -Destination $target -Recurse
Copy-Item -LiteralPath (Join-Path $source 'scripts') -Destination $target -Recurse
Copy-Item -LiteralPath (Join-Path $source 'src') -Destination $target -Recurse
Copy-Item -LiteralPath (Join-Path $source 'tests') -Destination $target -Recurse
Copy-Item -LiteralPath (Join-Path $source 'tools') -Destination $target -Recurse
Copy-Item -LiteralPath (Join-Path $source '.env.example') -Destination $target
Copy-Item -LiteralPath (Join-Path $source '.gitattributes') -Destination $target
Copy-Item -LiteralPath (Join-Path $source '.gitignore') -Destination $target
Copy-Item -LiteralPath (Join-Path $source '.nvmrc') -Destination $target
Copy-Item -LiteralPath (Join-Path $source '.prettierignore') -Destination $target
Copy-Item -LiteralPath (Join-Path $source '.prettierrc') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'AGENTS.md') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'CHANGELOG.md') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'CONTRIBUTING.md') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'LICENSE') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'README.md') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'astro.config.ts') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'eslint.config.js') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'package.json') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'pnpm-lock.yaml') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'pnpm-workspace.yaml') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'tailwind.config.mjs') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'tsconfig.json') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'vitest.config.ts') -Destination $target
```

- [ ] **Step 3: Confirm the copied template contains its required entry surfaces**

Run:

```powershell
$target = 'D:\HBCodeRepo\GameWebs\template - AnvilWiki'
$required = @(
  'package.json',
  'src\content.config.ts',
  '.agent\skills\anvil-new-article\SKILL.md',
  '.agent\skills\anvil-batch-articles\SKILL.md',
  '.github\workflows\ci.yml',
  '.github\workflows\auto-content.yml',
  'docs\content-format.md',
  'scripts\check-content.ts'
)
$missing = $required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $target $_)) }
if ($missing) { throw ('Missing required template files: ' + ($missing -join ', ')) }
Write-Output 'Required template inputs present.'
```

Expected: `Required template inputs present.`

### Task 2: Verify the template is clean and isolated

**Files:**
- Verify: `D:\HBCodeRepo\GameWebs\template - AnvilWiki\`

- [ ] **Step 1: Verify excluded runtime directories are absent**

Run:

```powershell
$target = 'D:\HBCodeRepo\GameWebs\template - AnvilWiki'
$forbidden = @('.git', 'node_modules', '.astro', 'dist', 'coverage')
$found = $forbidden | Where-Object { Test-Path -LiteralPath (Join-Path $target $_) }
if ($found) { throw ('Forbidden runtime directories found: ' + ($found -join ', ')) }
Write-Output 'No forbidden runtime directories found.'
```

Expected: `No forbidden runtime directories found.`

- [ ] **Step 2: Verify no local secret or runtime-log file was copied**

Run:

```powershell
$target = 'D:\HBCodeRepo\GameWebs\template - AnvilWiki'
$unexpected = Get-ChildItem -LiteralPath $target -Recurse -Force -File |
  Where-Object {
    ($_.Name -eq '.env' -or ($_.Name -like '.env.*' -and $_.Name -ne '.env.example') -or $_.Name -like '*.log')
  }
if ($unexpected) { throw ('Unexpected local files: ' + (($unexpected.FullName) -join ', ')) }
Write-Output 'No local secret or runtime-log files found.'
```

Expected: `No local secret or runtime-log files found.`

- [ ] **Step 3: Record the snapshot boundary in the destination README supplement**

Review `docs/superpowers/specs/2026-09-03-anvilwiki-template-snapshot-design.md` and retain it in the copied template as the durable scope record. No upstream source file needs modification.

- [ ] **Step 4: Report the completed snapshot without claiming a build**

State that the snapshot was structurally verified, that dependencies were intentionally not installed, and that no build, deployment, Git initialization, or provider operation occurred.
