import { client } from "@/sanity/lib/client"
import { allNotesQuery } from "@/lib/queries"
import NotesInteractive from "@/components/notes/NotesInteractive"

// 页面元数据：保持极简风格
export const metadata = {
  title: '与 | haoye.cyou',
  description: '皓野的碎碎念与思考碎片',
}

// 建议开启增量静态再生，保证内容更新的及时性
export const revalidate = 60

export default async function NotesPage() {
  // 使用你实际库中的 client 和 allNotesQuery 来获取数据
  const notes = await client.fetch(allNotesQuery)

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden">
      {/* 注入顶级交互容器 */}
      <NotesInteractive notes={notes || []} />
    </main>
  )
}