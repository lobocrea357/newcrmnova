import wahaClient from '../config/waha.js';

/**
 * Servicio para obtener información de contactos desde la API de WAHA
 */
export class WahaContactService {
  /**
   * Obtiene información "about" de un contacto
   * Endpoint: GET /api/contacts/about
   */
  async getContactAbout(session, contactId) {
    try {
      const response = await wahaClient.get(`/api/contacts/about`, {
        params: {
          session,
          contactId
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo "about" del contacto ${contactId}:`, error.message);
      return null;
    }
  }

  /**
   * Obtiene la URL de la foto de perfil de un contacto
   * Endpoint: GET /api/contacts/profile-picture
   */
  async getContactProfilePicture(session, contactId) {
    try {
      const response = await wahaClient.get(`/api/contacts/profile-picture`, {
        params: {
          session,
          contactId
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo foto de perfil del contacto ${contactId}:`, error.message);
      return null;
    }
  }

  /**
   * Obtiene información básica de un contacto
   * Endpoint: GET /api/contacts
   */
  async getContactInfo(session, contactId) {
    try {
      const response = await wahaClient.get(`/api/contacts`, {
        params: {
          session,
          contactId
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo info del contacto ${contactId}:`, error.message);
      return null;
    }
  }

  /**
   * Obtiene información completa de un contacto combinando múltiples endpoints
   */
  async getFullContactData(session, contactId) {
    try {
      console.log(`\n🔍 ========== WAHA API: Consultando contacto ${contactId} ==========`);

      // Hacer llamadas en paralelo para optimizar
      const [basicInfo, about, profilePicture] = await Promise.all([
        this.getContactInfo(session, contactId),
        this.getContactAbout(session, contactId),
        this.getContactProfilePicture(session, contactId)
      ]);
      
      console.log(`🔍 WAHA API - basicInfo:`, JSON.stringify(basicInfo, null, 2));
      console.log(`🔍 WAHA API - about:`, JSON.stringify(about, null, 2));
      console.log(`🔍 WAHA API - profilePicture:`, JSON.stringify(profilePicture, null, 2));

      const fullData = {
        phone_number: contactId.split('@')[0],
        name: null,
        push_name: null,
        profile_picture_url: null,
        profile_picture_hash: null, // Nuevo campo
        is_business: false,
        is_enterprise: false
      };

      // Extraer nombre de basicInfo
      if (basicInfo) {
        fullData.name = basicInfo.name || basicInfo.pushname || basicInfo.verifiedName;
        fullData.push_name = basicInfo.pushname;
        fullData.is_business = basicInfo.isBusiness || false;
        fullData.is_enterprise = basicInfo.isEnterprise || false;
        
        console.log(`🔍 WAHA - Nombre extraído: ${fullData.name || 'NULL'}`);
        console.log(`🔍 WAHA - Push name extraído: ${fullData.push_name || 'NULL'}`);
      } else {
        console.log(`⚠️ WAHA - No se obtuvo basicInfo`);
      }

      // Extraer información adicional de about
      /* if (about && about.about) {
        // El "about" puede tener info útil pero generalmente no incluye nombre
        console.log(`ℹ️ About del contacto: ${about.about}`);
      } */

      // Extraer URL de foto de perfil y calcular hash
      if (profilePicture && profilePicture.profilePictureURL) {
        fullData.profile_picture_url = profilePicture.profilePictureURL;
        
        // Calcular hash de la imagen para detectar cambios
        fullData.profile_picture_hash = await this.calculateImageHash(profilePicture.profilePictureURL);
      }

      console.log(`\n✅ WAHA - Datos finales obtenidos:`, {
        name: fullData.name || 'NULL',
        push_name: fullData.push_name || 'NULL',
        profile_picture_url: fullData.profile_picture_url ? 'Disponible' : 'NULL',
        is_business: fullData.is_business,
        is_enterprise: fullData.is_enterprise
      });
      console.log(`==========================================\n`);

      return fullData;
    } catch (error) {
      console.error('Error obteniendo datos completos del contacto:', error);
      return {
        phone_number: contactId.split('@')[0],
        name: null,
        push_name: null,
        profile_picture_url: null,
        profile_picture_hash: null, // Nuevo campo
        is_business: false,
        is_enterprise: false
      };
    }
  }

  /**
   * Obtiene información de un chat específico
   * Endpoint: GET /api/{session}/chats/overview
   */
  async getChatInfo(session, chatId) {
    try {
      const response = await wahaClient.get(`/api/${session}/chats/overview`, {
        params: {
          limit: 100 // Obtener últimos 100 chats
        }
      });

      // Buscar el chat específico en la respuesta
      if (response.data && Array.isArray(response.data)) {
        const chat = response.data.find(c => c.id === chatId || c.id._serialized === chatId);
        return chat || null;
      }

      return null;
    } catch (error) {
      console.error(`Error obteniendo info del chat ${chatId}:`, error.message);
      return null;
    }
  }

  /**
   * Calcula hash SHA256 de una imagen desde su URL
   * Útil para detectar cambios reales en fotos de perfil
   */
  async calculateImageHash(imageUrl) {
    try {
      if (!imageUrl) return null;
      
      // Descargar imagen
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      
      const buffer = await response.arrayBuffer();
      const bufferArray = new Uint8Array(buffer);
      
      // Calcular hash SHA256 usando crypto de Node.js
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(bufferArray);
      return hash.digest('hex');
    } catch (error) {
      console.error('Error calculando hash de imagen:', error.message);
      return null;
    }
  }
}

export default new WahaContactService();
