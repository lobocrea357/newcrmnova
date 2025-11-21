'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getConversationWithMessages } from '@/lib/supabase'
import ChatView from '@/components/ChatView'
import ChatAnalysis from '@/components/ChatAnalysis'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = params.chatId
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const loadMessages = async () => {
      const conversation = await getConversationWithMessages(chatId)
      if (conversation && conversation.messages) {
        setMessages(conversation.messages)
      }
    }
    loadMessages()
  }, [chatId])

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
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-2rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-xl overflow-hidden h-full">
            <ChatView chatId={chatId} onClose={handleClose} />
          </div>

          {/* Analysis Area */}
          <div className="lg:col-span-1 h-full">
            <ChatAnalysis messages={messages} />
          </div>
        </div>
      </div>
    </div>
  )
}
