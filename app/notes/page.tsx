export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { allNotesQuery } from '@/lib/queries'

export default async function NotesPage() {
  const notes = await sanityClient.fetch(allNotesQuery)

  return (
    <div className="mx-auto max-w-[760px] px-6 py-32">
      <h1 className="text-[44px] font-light">与</h1>
      <p className="mt-4 text-[15px] text-[#C9C7C2]">并非注解，只是回响。</p>

      <div className="mt-20 space-y-14">
        {notes.map((note: any) => (
          <div key={note._id} className="group">
            <h2 className="text-[22px] font-light text-[#F2F1EE] transition-colors duration-300 group-hover:text-white">
              {note.name}
            </h2>
            <p className="mt-3 max-w-[640px] text-[16px] leading-[1.9] text-[#C9C7C2] transition-colors duration-300 group-hover:text-[#E7E4DF]">
              {note.line}
            </p>
            <p className="mt-2 text-[12px] tracking-[0.18em] text-[#8E8C88]">
              · {note.kind}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
