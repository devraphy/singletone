import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'menuLabel',
      title: 'Menu label (fallback)',
      description: 'The text shown in the navigation menu. Renaming this renames the menu item.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'menuLabelKo', title: 'Menu label — 한국어', type: 'string'}),
    defineField({name: 'menuLabelEn', title: 'Menu label — English', type: 'string'}),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'The URL path, e.g. "statement" becomes /statement',
      type: 'slug',
      options: {source: 'menuLabel'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Menu order',
      description: 'Lower numbers appear first in the menu',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'showInNav',
      title: 'Show in navigation',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'body',
      title: 'Content (fallback)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [{name: 'href', title: 'URL', type: 'url'}],
              },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'bodyKo',
      title: 'Content — 한국어',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [{name: 'href', title: 'URL', type: 'url'}],
              },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'bodyEn',
      title: 'Content — English',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [{name: 'href', title: 'URL', type: 'url'}],
              },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'exhibitions',
      title: 'Exhibitions / CV list',
      description: 'Optional numbered list, e.g. an exhibition history',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'exhibition',
          fields: [
            defineField({name: 'year', title: 'Year', type: 'string'}),
            defineField({name: 'title', title: 'Title (fallback)', type: 'string'}),
            defineField({name: 'titleKo', title: 'Title — 한국어', type: 'string'}),
            defineField({name: 'titleEn', title: 'Title — English', type: 'string'}),
            defineField({name: 'venue', title: 'Venue (fallback)', type: 'string'}),
            defineField({name: 'venueKo', title: 'Venue — 한국어', type: 'string'}),
            defineField({name: 'venueEn', title: 'Venue — English', type: 'string'}),
          ],
          preview: {select: {title: 'title', subtitle: 'year'}},
        }),
      ],
    }),
    defineField({
      name: 'links',
      title: 'Links',
      description: 'Optional label/value link list, e.g. Email, Instagram',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'link',
          fields: [
            defineField({name: 'label', title: 'Label (fallback)', type: 'string'}),
            defineField({name: 'labelKo', title: 'Label — 한국어', type: 'string'}),
            defineField({name: 'labelEn', title: 'Label — English', type: 'string'}),
            defineField({name: 'value', title: 'Display text (fallback)', type: 'string'}),
            defineField({name: 'valueKo', title: 'Display text — 한국어', type: 'string'}),
            defineField({name: 'valueEn', title: 'Display text — English', type: 'string'}),
            defineField({name: 'url', title: 'URL', type: 'string'}),
            defineField({name: 'note', title: 'Note (fallback)', type: 'string'}),
            defineField({name: 'noteKo', title: 'Note — 한국어', type: 'string'}),
            defineField({name: 'noteEn', title: 'Note — English', type: 'string'}),
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        }),
      ],
    }),
    defineField({
      name: 'location',
      title: 'Location line (fallback)',
      description: 'Optional single line, e.g. "Based in Seoul, South Korea."',
      type: 'string',
    }),
    defineField({name: 'locationKo', title: 'Location line — 한국어', type: 'string'}),
    defineField({name: 'locationEn', title: 'Location line — English', type: 'string'}),
  ],
  preview: {
    select: {title: 'menuLabel', subtitle: 'slug.current'},
  },
})
