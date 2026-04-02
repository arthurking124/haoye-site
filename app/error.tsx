'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[100svh] items-center justify-center px-6">
      <div className="max-w-[560px] text-center">
        <p className="text-[12px] tracking-[0.18em] text-[#8E8C88]">ERROR</p>

        <h1 className="mt-6 text-[30px] font-light leading-[1.5] text-[#F2F1EE] md:text-[40px]">
          光没有按预期落下
        </h1>

        <p className="mt-6 text-[14px] leading-[1.95] text-[#8E8C88] md:text-[15px]">
          页面遇到了一点问题。你可以重试一次，或者先回到首页。
        </p>

        <div className="mt-10 flex items-center justify-center gap-6">
          <button
            onClick={() => reset()}
            className="text-[12px] text-[#C9C7C2] transition-colors duration-300 hover:text-[#F2F1EE]"
          >
            重新加载
          </button>
          <a
            href="/"
            className="text-[12px] text-[#C9C7C2] transition-colors duration-300 hover:text-[#F2F1EE]"
          >
            回到首页
          </a>
        </div>
      </div>
    </div>
  )
}