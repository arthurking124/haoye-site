'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export default function PageShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // 首页不需要大爆炸，它有自己的太极流体和 Loading
  if (pathname === '/') {
    return <>{children}</>
  }

  // 👑 蓝图核心：大爆炸重构 (The Big Bang Reconstruction)
  // 当路由变化时，framer-motion 的 key 属性会强制重新执行进场动画
  return (
    <motion.div
      key={pathname}
      // 1. 奇点状态 (Singularity State)
      initial={{ 
        scale: 0.3,         // 从一个极小的点开始
        opacity: 0, 
        filter: 'blur(40px)', // 极度模糊，呼应上一幕的黑洞
        y: '10vh'           // 略微靠下，模拟引力拉扯
      }}
      // 2. 宇宙膨胀 (Expansion)
      animate={{ 
        scale: 1, 
        opacity: 1, 
        filter: 'blur(0px)', 
        y: '0vh' 
      }}
      // 3. 物理引擎 (Physics Physics)
      transition={{
        type: 'spring',     // 使用弹簧物理引擎
        stiffness: 85,      // 爆发力度
        damping: 18,        // 阻尼摩擦力，防止过度弹跳
        mass: 0.8,          // 质量感
        restDelta: 0.001    // 0.8秒内精确落位
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  )
}