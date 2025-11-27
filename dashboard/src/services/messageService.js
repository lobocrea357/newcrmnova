const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

/**
 * Servicio para gestionar mensajes
 */
export class MessageService {
  /**
   * Envía un mensaje de texto
   * @param {string} session - Nombre de la sesión del bot
   * @param {string} chatId - ID del chat (formato WhatsApp: 521234567890@c.us)
   * @param {string} text - Contenido del mensaje
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async sendTextMessage(session, chatId, text) {
    try {
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session,
          chatId,
          text,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar mensaje')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error)
      throw error
    }
  }

  /**
   * Envía un mensaje con imagen
   * @param {string} session - Nombre de la sesión del bot
   * @param {string} chatId - ID del chat
   * @param {string} mediaUrl - URL de la imagen
   * @param {string} caption - Texto adicional (opcional)
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async sendImageMessage(session, chatId, mediaUrl, caption = '') {
    try {
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session,
          chatId,
          mediaUrl,
          text: caption,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar imagen')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ Error enviando imagen:', error)
      throw error
    }
  }
}

export default new MessageService()
