import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'noteGroup',
  title: 'Note Group',
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
      name: 'isRoot',
      title: 'Is root group',
      description:
        'Exactly one Note Group should be the root — the entry point the Notes tree starts from. (Separate from the Projects root group.)',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'children',
      title: 'Contains',
      description: 'Sub-groups and/or notes, in display order. Drag to reorder.',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'noteGroup'}, {type: 'note'}]}],
    }),
  ],
  preview: {
    select: {title: 'title', isRoot: 'isRoot'},
    prepare({title, isRoot}) {
      return {title: isRoot ? `${title} (root)` : title}
    },
  },
})
