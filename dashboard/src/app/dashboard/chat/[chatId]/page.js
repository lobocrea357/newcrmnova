'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import ChatView from '@/components/ChatView'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = params.chatId

  const handleClose = () => {
    const botId = searchParams.get('botId')
    if (botId) {
      router.push(`/dashboard?botId=${botId}&chatId=${chatId}`)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 2rem)' }}>
          <ChatView chatId={chatId} onClose={handleClose} />
        </div>
      </div>
    </div>
  )
}
