export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { siteSettingsQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'
import HomeSequence from '@/components/home/HomeSequence'

type SiteSettings = {
  homeScreen1Text?: string
  homeScreen1Image?: any
  homeScreen2Text?: string
  homeScreen2Image?: any
  homeScreen3Text?: string
  homeScreen3Image?: any
  homeScreen4Text?: string
  homeScreen4Image?: any
  signature?: string
  domainText?: string
}

export default async function HomePage() {
  const settings = await sanityClient.fetch<SiteSettings | null>(siteSettingsQuery)

  const enhancedSettings = {
    ...settings,
    homeScreen1ImageUrl: settings?.homeScreen1Image
      ? urlFor(settings.homeScreen1Image).width(2200).quality(92).url()
      : '',
    homeScreen2ImageUrl: settings?.homeScreen2Image
      ? urlFor(settings.homeScreen2Image).width(2200).quality(92).url()
      : '',
    homeScreen3ImageUrl: settings?.homeScreen3Image
      ? urlFor(settings.homeScreen3Image).width(2200).quality(92).url()
      : '',
    homeScreen4ImageUrl: settings?.homeScreen4Image
      ? urlFor(settings.homeScreen4Image).width(2200).quality(92).url()
      : '',
  }

  return <HomeSequence settings={enhancedSettings} />
}