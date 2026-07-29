import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'group',
  title: 'Project Group (Parent Project)',
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
      name: 'isRoot',
      title: 'Is root group',
      description:
        'Only the top-level Projects container should use this. Parent projects such as "태몽" should leave it off.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'hidden',
      title: 'Hide project group',
      description:
        'Hide this group and all projects inside it from the website. The root Projects group is always used as the site entry point.',
      type: 'boolean',
      initialValue: false,
      hidden: ({document}) => document?.isRoot === true,
    }),
    defineField({
      name: 'children',
      title: 'Child projects',
      description:
        'Add Series documents such as "한라봉" and "말띠", or another Project Group for deeper nesting. Drag to set the display order.',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'group'}, {type: 'series'}]}],
    }),
  ],
  preview: {
    select: {title: 'title', isRoot: 'isRoot', hidden: 'hidden'},
    prepare({title, isRoot, hidden}) {
      return {
        title: isRoot ? `${title} (root)` : title,
        subtitle: hidden ? 'Hidden' : undefined,
      }
    },
  },
})
