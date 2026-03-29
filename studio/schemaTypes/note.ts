import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'note',
  title: 'Note',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        list: [
          {title: '书', value: '书'},
          {title: '画', value: '画'},
          {title: '影', value: '影'},
          {title: '器', value: '器'},
        ],
      },
    }),
    defineField({
      name: 'line',
      title: 'Line',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
    }),
  ],
})
