import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'series',
  title: 'Series',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (fallback)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'titleKo', title: 'Title — 한국어', type: 'text', rows: 2}),
    defineField({name: 'titleEn', title: 'Title — English', type: 'text', rows: 2}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hidden',
      title: 'Hide project',
      description:
        'Hide this project from the website. Its content stays saved in Sanity and can be shown again at any time.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({name: 'year', title: 'Year', type: 'string'}),
    defineField({name: 'medium', title: 'Medium (fallback)', type: 'string'}),
    defineField({name: 'mediumKo', title: 'Medium — 한국어', type: 'string'}),
    defineField({name: 'mediumEn', title: 'Medium — English', type: 'string'}),
    defineField({name: 'note', title: 'Curatorial note (fallback)', type: 'text', rows: 3}),
    defineField({name: 'noteKo', title: 'Curatorial note — 한국어', type: 'text', rows: 3}),
    defineField({name: 'noteEn', title: 'Curatorial note — English', type: 'text', rows: 3}),
    defineField({
      name: 'layout',
      title: 'Project layout',
      description:
        'Default uses the regular grid. Cinematic displays every image on its own row, with no limit on the number of images.',
      type: 'string',
      initialValue: 'default',
      options: {
        layout: 'radio',
        list: [
          {title: 'Default', value: 'default'},
          {title: 'Cinematic — one image per row', value: 'cinematic'},
        ],
      },
    }),
    defineField({
      name: 'plates',
      title: 'Plates',
      description: 'The individual works in this series, in display order. Drag to reorder.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'plate',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {hotspot: true},
              validation: (Rule) => Rule.required(),
            }),
            defineField({name: 'title', title: 'Title (fallback)', type: 'string'}),
            defineField({name: 'titleKo', title: 'Title — 한국어', type: 'string'}),
            defineField({name: 'titleEn', title: 'Title — English', type: 'string'}),
            defineField({name: 'dimensions', title: 'Dimensions', type: 'string'}),
            defineField({name: 'edition', title: 'Edition', type: 'string'}),
          ],
          preview: {
            select: {title: 'title', media: 'image'},
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title', year: 'year', hidden: 'hidden', media: 'plates.0.image'},
    prepare({title, year, hidden, media}) {
      return {
        title,
        subtitle: [hidden ? 'Hidden' : '', year].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
