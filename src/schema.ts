import { z } from 'zod'

/**
 * Validation gate for `data/profile.json`.
 *
 * This is the only validation in the pipeline. Nunjucks templates are
 * stringly-typed (a renamed field renders as an empty string rather than
 * failing), and personal-site consumes the published JSON without re-checking
 * it. Bad data has to be stopped here or it reaches both destinations silently.
 *
 * Objects are strict so a typo'd key is an error rather than a field that
 * quietly vanishes from the output.
 */

const url = z
  .string()
  .refine(value => URL.canParse(value), 'must be a parsable URL')

const icon = z
  .strictObject({
    title: z.string().min(1),
    href: url,
    /** Simple Icons slug, resolved against their CDN. */
    slug: z.string().min(1).optional(),
    /** Basename of a local SVG in `icons/`, for logos Simple Icons dropped. */
    fileName: z.string().min(1).optional(),
  })
  .refine(
    ({ slug, fileName }) => Boolean(slug) !== Boolean(fileName),
    'icon needs exactly one of `slug` or `fileName`',
  )

const social = z.strictObject({
  /** Doubles as the icon basename on personal-site (`/icons/{name}.svg`). */
  name: z.string().min(1),
  label: z.string().min(1),
  href: url,
  /** Displayed instead of the raw href where the README spells it out. */
  value: z.string().min(1).optional(),
})

const project = z.strictObject({
  name: z.string().min(1),
  repo: z.strictObject({
    owner: z.string().min(1),
    name: z.string().min(1),
  }),
  tagline: z.string().min(1),
  /** Markdown. Rendered by the README; unused by the site today. */
  description: z.string().min(1),
  /** Live deployment, where one exists. */
  url: url.optional(),
})

export const profileSchema = z.strictObject({
  socials: z.array(social).nonempty(),
  projects: z.array(project).nonempty(),
  skills: z.strictObject({
    hard: z
      .array(
        z.strictObject({
          title: z.string().min(1),
          icons: z.array(icon).nonempty(),
        }),
      )
      .nonempty(),
    soft: z
      .array(
        z.strictObject({
          title: z.string().min(1),
          desc: z.string().min(1),
        }),
      )
      .nonempty(),
  }),
})

export type Profile = z.infer<typeof profileSchema>
