import Link from 'next/link'

type SoftLinkProps = {
  href: string
  title: string
  subtitle?: string
}

export default function SoftLink({ href, title, subtitle }: SoftLinkProps) {
  return (
    <Link href={href} className="group block">
      <h2 className="text-[22px] font-light text-[#F2F1EE] transition-colors duration-300 group-hover:text-white">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 text-[13px] text-[#8E8C88] transition-colors duration-300 group-hover:text-[#C9C7C2]">
          {subtitle}
        </p>
      ) : null}
    </Link>
  )
}
