export const revalidate = 60
import { sanityClient } from '@/lib/sanity.client'
import { siteSettingsQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'
import HomeSequence from '@/components/home/HomeSequence'
// 导入咱们的刀割愈合组件
import Rupture from '@/components/home/Rupture' 

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

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* 1. 你的原始 3D 序列帧组件 
      */}
      <HomeSequence settings={enhancedSettings} />

      {/* 2. 刀割愈合层
          它浮在 HomeSequence 之上，但 pointer-events-none 确保它不拦截点击
      */}
      <Rupture />
    </main>
  )
}