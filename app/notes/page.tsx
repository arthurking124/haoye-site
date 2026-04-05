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
    <div className="haoye-notes-page min-h-[100svh] bg-[var(--site-bg)] text-[var(--site-text-solid)]">
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

        <div className="haoye-notes-groups mt-18 space-y-16 md:mt-24 md:space-y-24">
          {groups.map((group, groupIndex) => (
            <section
              key={`${group.kind}-${groupIndex}`}
              data-index={groupIndex % 3}
              className="haoye-notes-group border-t border-[color:var(--site-border-soft)] pt-8 md:pt-10"
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

                <div className="haoye-notes-stack space-y-8 md:space-y-10">
                  {group.items.map((note, noteIndex) => (
                    <article
                      key={note._id ?? `${group.kind}-${noteIndex}`}
                      data-note-index={noteIndex % 3}
                      className="haoye-notes-item group max-w-[760px]"
                    >
                      <div className="haoye-notes-item-row flex items-start gap-4 md:gap-5">
                        <div className="haoye-notes-trace mt-[8px] h-[1px] w-6 shrink-0 bg-[color:var(--site-border-soft)] transition-all duration-500 group-hover:w-10 group-hover:bg-[color:var(--site-border)]" />

                        <div className="haoye-notes-copy">
                          <h2 className="haoye-notes-item-title text-[18px] font-light leading-[1.6] text-[var(--site-text-solid)] md:text-[22px]">
                            {note.name || '未命名'}
                          </h2>

                          <p className="haoye-notes-line mt-3 text-[14px] leading-[2.02] text-[var(--site-soft)] md:text-[15px] md:leading-[2.08]">
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