export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { allNotesQuery } from '@/lib/queries'

type NoteItem = {
  _id?: string
  name?: string
  kind?: string
  line?: string
}

export default async function NotesPage() {
  const notes = await sanityClient.fetch<NoteItem[]>(allNotesQuery)

  const groups = (notes ?? []).reduce<
    Array<{ kind: string; items: NoteItem[] }>
  >((acc, note) => {
    const kind = note.kind?.trim() || '未分类'
    const existing = acc.find((group) => group.kind === kind)

    if (existing) {
      existing.items.push(note)
    } else {
      acc.push({ kind, items: [note] })
    }

    return acc
  }, [])

  return (
    <div className="min-h-[100svh] bg-[#0D0D0D] text-[#F2F1EE]">
      <div className="mx-auto max-w-[1240px] px-6 pb-24 pt-28 md:px-10 md:pb-36 md:pt-36">
        <header className="max-w-[760px]">
          <p className="text-[11px] tracking-[0.22em] text-[#7F7D79]">ECHO ROOM</p>

          <h1 className="mt-6 text-[34px] font-light leading-[1.35] md:text-[54px] md:leading-[1.28]">
            与
          </h1>

          <p className="mt-6 max-w-[560px] text-[14px] leading-[1.95] text-[#8E8C88] md:text-[15px]">
            并非注解，只是回响。
          </p>
        </header>

        <div className="mt-18 space-y-16 md:mt-24 md:space-y-24">
          {groups.map((group, groupIndex) => (
            <section
              key={`${group.kind}-${groupIndex}`}
              className="border-t border-white/8 pt-8 md:pt-10"
            >
              <div className="grid grid-cols-1 gap-8 md:grid-cols-[120px_minmax(0,1fr)] md:gap-10">
                <div>
                  <p className="text-[11px] tracking-[0.18em] text-[#6F6D69]">
                    {String(groupIndex + 1).padStart(2, '0')}
                  </p>

                  <p className="mt-4 text-[11px] tracking-[0.22em] text-[#8E8C88] md:mt-5">
                    {group.kind}
                  </p>
                </div>

                <div className="space-y-8 md:space-y-10">
                  {group.items.map((note, noteIndex) => (
                    <article
                      key={note._id ?? `${group.kind}-${noteIndex}`}
                      className="group max-w-[760px]"
                    >
                      <div className="flex items-start gap-4 md:gap-5">
                        <div className="mt-[8px] h-[1px] w-6 shrink-0 bg-white/10 transition-all duration-500 group-hover:w-10 group-hover:bg-white/20" />

                        <div>
                          <h2 className="text-[18px] font-light leading-[1.6] text-[#E8E5DE] md:text-[22px]">
                            {note.name || '未命名'}
                          </h2>

                          <p className="mt-3 text-[14px] leading-[2.02] text-[#A6A39D] md:text-[15px] md:leading-[2.08]">
                            {note.line || ' '}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}