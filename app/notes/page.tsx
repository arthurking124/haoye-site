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
        <header className="haoye-notes-header max-w-[760px] relative z-10">
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
              className="haoye-notes-group pt-8 md:pt-10"
            >
              {/* 🌑 黑色主题的标签部分，保持不变 */}
              <div className="haoye-dark-only">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-[120px_minmax(0,1fr)] md:gap-10">
                  <div className="haoye-notes-rail">
                    <p className="haoye-notes-index text-[11px] tracking-[0.18em] text-[var(--site-faint)]">
                      {String(groupIndex + 1).padStart(2, '0')}
                    </p>
                    <p className="haoye-notes-kind mt-4 text-[11px] tracking-[0.22em] text-[var(--site-dim)] md:mt-5">
                      {group.kind}
                    </p>
                  </div>
                  <div className="haoye-notes-stack flex flex-col items-start gap-12 md:gap-16">
                    {group.items.map((note, noteIndex) => (
                      <EchoNoteItem 
                        key={note._id ?? `${group.kind}-${noteIndex}`} 
                        note={note} 
                        noteIndex={noteIndex}
                        groupIndex={groupIndex}
                        isDarkOnly
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* ☁️ 白色主题的画布，采用绝对定位散落逻辑 */}
              <div className="haoye-light-only relative min-h-[60vh] md:min-h-[70vh]">
                {group.items.map((note, noteIndex) => {
                  // 👉 核心重构：在服务端预计算初始散落坐标，并确保彼此“压到一点”
                  
                  // 1. 基于索引的伪随机基础旋转 (-6 到 6 度)
                  const baseRotate = (noteIndex * 7 + groupIndex * 13) % 12 - 6
                  
                  // 2. 核心：绝对散落坐标 (基于画布百分比)，并制造彼此轻微压到的重叠感
                  const initialX = (noteIndex % 3) * 18 + ((noteIndex * 11 + groupIndex * 19) % 12 - 6) // X轴散落 0, 35, 70 百分比，加上微调
                  const initialY = Math.floor(noteIndex / 3) * 65 + ((noteIndex * 8 + groupIndex * 17) % 16 - 8) // Y轴每行增加 30%，制造重叠
                  
                  // 3. 随机质量 (控制被风吹走的力度，mass越大越不容易吹走)
                  const mass = 0.6 + ((noteIndex * 23 + groupIndex * 17) % 50) / 100

                  return (
                    <EchoNoteItem 
                      key={note._id ?? `${group.kind}-${noteIndex}-light`} 
                      note={note} 
                      noteIndex={noteIndex}
                      groupIndex={groupIndex}
                      basePosition={{
                        x: `${initialX}%`, 
                        y: `${initialY}px`, 
                        rotate: baseRotate,
                        mass: mass
                      }}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}