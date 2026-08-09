import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nunjucks from 'nunjucks'
import { profileSchema } from './schema.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'data/profile.json')

const result = profileSchema.safeParse(
  JSON.parse(readFileSync(dataPath, 'utf8')),
)

if (!result.success) {
  console.error('data/profile.json failed validation:\n')
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
  }
  process.exit(1)
}

// autoescape stays off: this renders Markdown, not HTML. With it on, the
// ampersands in "Quick Learner & Adaptable" would be committed as `&amp;`.
//
// trimBlocks eats the newline after every block tag, which keeps the loops from
// padding the output but makes a line-terminal `{% endif %}` swallow that line's
// break. Blank lines are load-bearing in Markdown, so the template uses inline
// `if` *expressions* (`{{ a if b else '' }}`) at end-of-line instead.
const env = nunjucks.configure(path.join(root, 'templates'), {
  autoescape: false,
  trimBlocks: true,
  lstripBlocks: true,
})

// Keyed lookup so the template can address one social by name
// (`social.linkedin.href`) rather than looping to find it. The README wraps
// each link in its own sentence, so those three are referenced individually.
const social = Object.fromEntries(
  result.data.socials.map(entry => [entry.name, entry]),
)

const banner =
  '<!-- Generated from data/profile.json by src/render.ts. Do not edit by hand. -->'
const body = env
  .render('README.md.njk', { ...result.data, social })
  .trimEnd()

writeFileSync(path.join(root, 'README.md'), `${banner}\n\n${body}\n`)

console.log('Rendered README.md')
