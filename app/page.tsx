import { sanityClient } from '@/lib/sanity.client'
import { siteSettingsQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'
import HomeSequence from '@/components/home/HomeSequence'

export default async function HomePage() {
  const settings = await sanityClient.fetch(siteSettingsQuery)

  const enhancedSettings = {
    ...settings,
    homeScreen1ImageUrl: settings?.homeScreen1Image
      ? urlFor(settings.homeScreen1Image).width(1800).url()
      : '',
    homeScreen2ImageUrl: settings?.homeScreen2Image
      ? urlFor(settings.homeScreen2Image).width(1800).url()
      : '',
    homeScreen3ImageUrl: settings?.homeScreen3Image
      ? urlFor(settings.homeScreen3Image).width(1800).url()
      : '',
    homeScreen4ImageUrl: settings?.homeScreen4Image
      ? urlFor(settings.homeScreen4Image).width(1800).url()
      : '',
  }

  return <HomeSequence settings={enhancedSettings} />
}
