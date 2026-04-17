'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function PageShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  // 👑 强制洗牌触发器
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    // 只要路由变了，直接 +1，强迫 framer-motion 重新从 initial 开始爆
    setTrigger(prev => prev + 1)
  }, [pathname])

  if (pathname === '/') {
    return <>{children}</>
  }

  return (
    <motion.div
      key={trigger} // 👑 绑定触发器，不用 pathname 了
      initial={{ scale: 0.2, opacity: 0, filter: 'blur(50px)', y: '10vh' }}
      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)', y: '0vh' }}
      transition={{
        type: 'spring',
        stiffness: 200,  // 爆发力再次加强
        damping: 14,     // 阻尼回弹
        mass: 0.8,
      }}
      className="will-change-transform origin-center"
    >
      {children}
    </motion.div>
  )
}