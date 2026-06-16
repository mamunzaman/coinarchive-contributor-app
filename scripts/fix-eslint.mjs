import fs from 'fs'

function read(f) {
  return fs.readFileSync(f, 'utf8')
}

function write(f, c) {
  fs.writeFileSync(f, c)
}

function addRunAfterCommitImport(content, filePath) {
  if (content.includes("from '../lib/runAfterCommit'") || content.includes('from "../../lib/runAfterCommit"')) {
    return content
  }
  const depth = filePath.split('/').length - 2
  const prefix = '../'.repeat(depth)
  const importLine = `import { runAfterCommit } from '${prefix}lib/runAfterCommit'\n`
  const lastImport = content.lastIndexOf('\nimport ')
  if (lastImport === -1) {
    return importLine + content
  }
  const nextNewline = content.indexOf('\n', lastImport + 1)
  return content.slice(0, nextNewline + 1) + importLine + content.slice(nextNewline + 1)
}

function wrapLoadEffects(content) {
  return content.replace(
    /useEffect\(\(\) => \{\s*void (load[A-Za-z]+)\(\)\s*\}, \[([^\]]+)\]\)/g,
    'useEffect(() => {\n    runAfterCommit(() => { void $1() })\n  }, [$2])',
  )
}

const loadEffectFiles = [
  'src/pages/DashboardPage.tsx',
  'src/pages/MySubmissionsPage.tsx',
  'src/pages/SubmissionDetailPage.tsx',
  'src/pages/EditSubmissionPage.tsx',
  'src/pages/VerifyEmailPage.tsx',
  'src/pages/admin/AdminDashboardPage.tsx',
  'src/pages/admin/AdminSubmissionDetailPage.tsx',
  'src/pages/admin/AdminSubmissionsPage.tsx',
  'src/pages/AdminApprovePage.tsx',
]

for (const file of loadEffectFiles) {
  let content = read(file)
  content = addRunAfterCommitImport(content, file)
  content = wrapLoadEffects(content)
  write(file, content)
}

console.log('Updated load effect files:', loadEffectFiles.length)
