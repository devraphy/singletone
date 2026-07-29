import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'note',
  title: 'Note',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (fallback)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'titleKo', title: 'Title — 한국어', type: 'string'}),
    defineField({name: 'titleEn', title: 'Title — English', type: 'string'}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt (fallback)',
      description: 'Short teaser shown in the notes list',
      type: 'text',
      rows: 3,
    }),
    defineField({name: 'excerptKo', title: 'Excerpt — 한국어', type: 'text', rows: 3}),
    defineField({name: 'excerptEn', title: 'Excerpt — English', type: 'text', rows: 3}),
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
  ],
  preview: {
    select: {title: 'title', subtitle: 'date'},
  },
})
