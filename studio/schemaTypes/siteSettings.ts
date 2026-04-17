import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Site Title',
      type: 'string',
    }),
    // 原来的 8 个 homeScreen 字段已经被彻底超度了 🗑️
    defineField({
      name: 'signature',
      title: 'Signature',
      type: 'string',
      initialValue: '皓野',
    }),
    defineField({
      name: 'domainText',
      title: 'Domain Text',
      type: 'string',
      initialValue: 'haoye.cyou',
    }),
  ],
})