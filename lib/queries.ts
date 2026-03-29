export const siteSettingsQuery = `
  *[_type == "siteSettings"][0]{
    siteTitle,
    homeScreen1Text,
    homeScreen1Image,
    homeScreen2Text,
    homeScreen2Image,
    homeScreen3Text,
    homeScreen3Image,
    homeScreen4Text,
    homeScreen4Image,
    signature,
    domainText
  }
`

export const allPoemsQuery = `
  *[_type == "poem"] | order(publishedAt desc){
    _id,
    title,
    slug,
    publishedAt,
    intro,
    coverImage
  }
`

export const poemBySlugQuery = `
  *[_type == "poem" && slug.current == $slug][0]{
    title,
    publishedAt,
    intro,
    coverImage,
    body
  }
`

export const allImageSeriesQuery = `
  *[_type == "imageSeries"]{
    _id,
    title,
    slug,
    subtitle,
    images
  }
`

export const imageSeriesBySlugQuery = `
  *[_type == "imageSeries" && slug.current == $slug][0]{
    title,
    subtitle,
    images,
    text
  }
`

export const allNotesQuery = `
  *[_type == "note"] | order(sortOrder asc){
    _id,
    name,
    kind,
    line
  }
`

export const aboutPageQuery = `
  *[_type == "aboutPage"][0]{
    title,
    subtitle,
    body
  }
`
