import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

type SanityWebhookBody = {
  _type?: string
  slug?: {
    current?: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-revalidate-secret')
    const expectedSecret = process.env.REVALIDATE_SECRET

    if (!expectedSecret) {
      return NextResponse.json(
        { message: 'Missing REVALIDATE_SECRET on server' },
        { status: 500 }
      )
    }

    if (secret !== expectedSecret) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
    }

    const body = (await req.json()) as SanityWebhookBody
    const type = body?._type
    const slug = body?.slug?.current

    // 首页 / 站点设置
    if (type === 'siteSettings') {
      revalidatePath('/')
      return NextResponse.json({ revalidated: ['/' ] })
    }

    // 诗
    if (type === 'poem') {
      revalidatePath('/poems')
      if (slug) {
        revalidatePath(`/poems/${slug}`)
      }
      return NextResponse.json({
        revalidated: slug ? ['/poems', `/poems/${slug}`] : ['/poems'],
      })
    }

    // 影像组
    if (type === 'imageSeries') {
      revalidatePath('/images')
      if (slug) {
        revalidatePath(`/images/${slug}`)
      }
      return NextResponse.json({
        revalidated: slug ? ['/images', `/images/${slug}`] : ['/images'],
      })
    }

    // 与
    if (type === 'note') {
      revalidatePath('/notes')
      return NextResponse.json({ revalidated: ['/notes'] })
    }

    // 我
    if (type === 'aboutPage') {
      revalidatePath('/about')
      return NextResponse.json({ revalidated: ['/about'] })
    }

    // 兜底：如果类型没匹配，也至少刷新首页
    revalidatePath('/')

    return NextResponse.json({
      message: 'Type not matched exactly, fallback revalidated home',
      revalidated: ['/'],
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { message: 'Revalidation failed' },
      { status: 500 }
    )
  }
}
