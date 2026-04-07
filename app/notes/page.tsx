export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { allNotesQuery } from '@/lib/queries'
import EchoNoteItem from '@/components/notes/EchoNoteItem'

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
    <div className="haoye-notes-page min-h-[100svh] bg-[var(--site-bg)] text-[var(--site-text-solid)] overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-6 pb-24 pt-28 md:px-10 md:pb-36 md:pt-36">
        <header className="haoye-notes-header max-w-[760px]">
          <p className="haoye-notes-kicker text-[11px] tracking-[0.22em] text-[var(--site-faint)]">
            ECHO ROOM
          </p>
          <h1 className="haoye-notes-title mt-6 text-[34px] font-light leading-[1.35] text-[var(--site-text-solid)] md:text-[54px] md:leading-[1.28]">
            与
          </h1>
          <p className="haoye-notes-intro mt-6 max-w-[560px] text-[14px] leading-[1.95] text-[var(--site-dim)] md:text-[15px]">
            并非注解，只是回响。
          </p>
        </header>

        <div className="haoye-notes-groups mt-18 space-y-16 md:mt-24 md:space-y-32">
          {groups.map((group, groupIndex) => (
            <section
              key={`${group.kind}-${groupIndex}`}
              className="haoye-notes-group pt-8 md:pt-10 relative"
            >
              <div className="grid grid-cols-1 gap-8 md:grid-cols-[120px_minmax(0,1fr)] md:gap-10">
                <div className="haoye-notes-rail">
                  <p className="haoye-notes-index text-[11px] tracking-[0.18em] text-[var(--site-faint)]">
                    {String(groupIndex + 1).padStart(2, '0')}
                  </p>
                  <p className="haoye-notes-kind mt-4 text-[11px] tracking-[0.22em] text-[var(--site-dim)] md:mt-5">
                    {group.kind}
                  </p>
                </div>

                {/* 修改了 flex 布局，允许内容根据散落逻辑自由交叠 */}
                <div className="haoye-notes-stack flex flex-col items-start gap-12 md:gap-16">
                  {group.items.map((note, noteIndex) => (
                    <EchoNoteItem 
                      key={note._id ?? `${group.kind}-${noteIndex}`} 
                      note={note} 
                      noteIndex={noteIndex}
                      groupIndex={groupIndex}
                    />
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