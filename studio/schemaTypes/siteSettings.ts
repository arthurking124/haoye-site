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
    defineField({
      name: 'homeScreen1Text',
      title: 'Home Screen 1 Text',
      type: 'string',
    }),
    defineField({
      name: 'homeScreen1Image',
      title: 'Home Screen 1 Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'homeScreen2Text',
      title: 'Home Screen 2 Text',
      type: 'string',
    }),
    defineField({
      name: 'homeScreen2Image',
      title: 'Home Screen 2 Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'homeScreen3Text',
      title: 'Home Screen 3 Text',
      type: 'string',
    }),
    defineField({
      name: 'homeScreen3Image',
      title: 'Home Screen 3 Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'homeScreen4Text',
      title: 'Home Screen 4 Text',
      type: 'string',
    }),
    defineField({
      name: 'homeScreen4Image',
      title: 'Home Screen 4 Image',
      type: 'image',
      options: {hotspot: true},
    }),
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
