import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-6">
      <div className="max-w-[520px] text-center">
        <p className="text-[12px] tracking-[0.18em] text-[#8E8C88]">404</p>

        <h1 className="mt-6 text-[30px] font-light leading-[1.5] text-[#F2F1EE] md:text-[40px]">
          这里没有被照亮的内容
        </h1>

        <p className="mt-6 text-[14px] leading-[1.95] text-[#8E8C88] md:text-[15px]">
          你抵达了一处空白。也许它已经被移走，也许它从未存在。
        </p>

        <div className="mt-10 flex items-center justify-center gap-6 text-[12px] text-[#C9C7C2]">
          <Link href="/" className="transition-colors duration-300 hover:text-[#F2F1EE]">
            回到首页
          </Link>
          <Link href="/images" className="transition-colors duration-300 hover:text-[#F2F1EE]">
            去看影
          </Link>
          <Link href="/poems" className="transition-colors duration-300 hover:text-[#F2F1EE]">
            去看诗
          </Link>
        </div>
      </div>
    </div>
  )
}