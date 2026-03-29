'use client'

/**
 * 这个文件是 Sanity Studio 的入口
 * 它会将整个后台管理界面渲染在你的 /studio 路径下
 */

import { NextStudio } from 'next-sanity/studio'
import config from '../../../studio/sanity.config' // 指向你根目录下的 studio/sanity.config.ts

export default function StudioPage() {
  return <NextStudio config={config} />
}