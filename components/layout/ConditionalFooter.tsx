"use client";

import { usePathname } from 'next/navigation';
// 引入你原本那个漂亮的 Footer
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // 🚨 拦截名单：在这个名单里的路由，Footer 绝对不允许出现！
  // 使用 startsWith 意味着未来如果你有 /images/xxx 详情页，也能完美隐藏
  if (pathname && pathname.startsWith('/images')) {
    return null; // 彻底从 DOM 中抹杀
  }

  // 其他正常页面（如首页、关于页），原样输出你的 Footer
  return <Footer />;
}