'use client'

import { useEffect, useRef } from 'react'

export default function SignatureMark() {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const main = svg.querySelector('.signature-main') as SVGPathElement | null
    const accent = svg.querySelector('.signature-accent') as SVGPathElement | null

    if (!main || !accent) return

    const prepare = (path: SVGPathElement) => {
      const length = path.getTotalLength()
      path.style.strokeDasharray = `${length}`
      path.style.strokeDashoffset = `${length}`
      path.style.opacity = '1'
    }

    prepare(main)
    prepare(accent)

    main.style.transition =
      'stroke-dashoffset 1.85s cubic-bezier(0.22, 1, 0.36, 1)'
    accent.style.transition =
      'stroke-dashoffset 0.45s cubic-bezier(0.22, 1, 0.36, 1) 1.65s'

    const timer = window.setTimeout(() => {
      main.style.strokeDashoffset = '0'
      accent.style.strokeDashoffset = '0'
    }, 80)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="w-[340px] text-[var(--site-faint)] opacity-100 md:w-[460px]">
      <svg
        ref={svgRef}
        viewBox="-7 906 900 300"
        xmlns="http://www.w3.org/2000/svg"
        className="block h-auto w-full overflow-visible"
        aria-hidden="true"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            className="signature-accent"
            d="m435.73 970.76c0 0 8.57 8.25-19.73 32.67"
          />
          <path
            className="signature-main"
            d="m305.84 1045.69c0 0-15.18 21.19 41.59 8.48 56.77-12.72 57.26-12.39 57.26-12.39 0 0 35.07-4.91 9.95 12.39-25.12 17.3-31.48 11.42 1.47-4.72 32.95-16.15 47.95-20.56 28.22-18.93-19.74 1.63-5.55 8.49-12.73 17.13-7.17 8.65-7.34 15.32 4.9 6.52 12.23-8.8 14-13.2 15.06-4.6 1.06 8.61 0.6 5.59 0.6 5.59 0 0 2.87-12.68 12.09-21.9 9.21-9.21 5.89 2.87 3.17 7.1-2.72 4.23 8.3-10.42 8.3-10.42 0 0 12.09-13.75 6.8-0.6-5.29 13.14-18.43 22.35-18.43 22.35 0 0 5.74-6.65 12.69-5.74 6.95 0.91 0.91 5.74 0.91 5.74 0 0 6.19-16.46 20.99-29.45 14.8-12.99 41.84-23.11-7.4 19.63-49.24 42.75 34.59-20.09 64.19-16.76 29.61 3.32 4.84 11.93-20.09 18.88-24.92 6.94-25.52 6.79-25.52 6.79l-7.55 1.36-3.93 0.76c0 0-10.42 2.41-3.02-2.57 7.4-4.98 6.19-0.6 6.19-0.6 0 0 1.78 139.42-20.06 74.07"
          />
        </g>
      </svg>
    </div>
  )
}