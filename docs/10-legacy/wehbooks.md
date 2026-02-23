# WAHA - WhatsApp HTTP API - Documentación Completa de Endpoints

**Versión:** 2025.11.1  
**OpenAPI Specification:** 3.1  
**URL Base:** `https://waha.lobocrea.pro/`

***

## 📋 Tabla de Contenidos
1. [🖥️ Sessions](#🖥️-sessions)
2. [🧩 Apps](#🧩-apps)
3. [🔑 Auth](#🔑-auth)
4. [🆔 Profile](#🆔-profile)
5. [🖼️ Screenshot](#🖼️-screenshot)
6. [📤 Chatting](#📤-chatting)
7. [📢 Channels](#📢-channels)
8. [🟢 Status](#🟢-status)
9. [💬 Chats](#💬-chats)
10. [👤 Contacts](#👤-contacts)
11. [👥 Groups](#👥-groups)
12. [✅ Presence](#✅-presence)
13. [📅 Events](#📅-events)
14. [🏷️ Labels](#🏷️-labels)
15. [🖼️ Media](#🖼️-media)
16. [🔍 Observability](#🔍-observability)
17. [🔗 Webhooks](#🔗-webhooks)

***

## 🖥️ Sessions

**Descripción:** Control de sesiones de WhatsApp (cuentas)

| Método | Endpoint | Descripción | URL |
|--------|----------|-------------|-----|
| GET | `/api/sessions` | List all sessions | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_list) |
| POST | `/api/sessions` | Create a session | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_create) |
| GET | `/api/sessions/{session}` | Get session information | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_get) |
| PUT | `/api/sessions/{session}` | Update a session | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_update) |
| DELETE | `/api/sessions/{session}` | Delete the session | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_delete) |
| GET | `/api/sessions/{session}/me` | Get information about the authenticated account | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_getMe) |
| POST | `/api/sessions/{session}/start` | Start the session | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_start) |
| POST | `/api/sessions/{session}/stop` | Stop the session | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_stop) |
| POST | `/api/sessions/{session}/logout` | Logout from the session | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_logout) |
| POST | `/api/sessions/{session}/restart` | Restart the session | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_restart) |
| POST | `/api/sessions/start` | Upsert and Start session (DEPRECATED) | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_DEPRACATED_start) |
| POST | `/api/sessions/stop` | Stop (and Logout if asked) session (DEPRECATED) | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_DEPRECATED_stop) |
| POST | `/api/sessions/logout` | Logout and Delete session (DEPRECATED) | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%A5%EF%B8%8F%20Sessions/SessionsController_DEPRECATED_logout) |

---

## 🧩 Apps

**Descripción:** Applications (built-in integrations)

| Método | Endpoint | Descripción | URL |
|--------|----------|-------------|-----|
| GET | `/api/apps` | List all apps for a session | [Ver](https://waha.lobocrea.pro/#/%F0%9F%A7%A9%20Apps/AppsController_list) |
| POST | `/api/apps` | Create a new app | [Ver](https://waha.lobocrea.pro/#/%F0%9F%A7%A9%20Apps/AppsController_create) |
| GET | `/api/apps/{id}` | Get app by ID | [Ver](https://waha.lobocrea.pro/#/%F0%9F%A7%A9%20Apps/AppsController_get) |
| PUT | `/api/apps/{id}` | Update an existing app | [Ver](https://waha.lobocrea.pro/#/%F0%9F%A7%A9%20Apps/AppsController_update) |
| DELETE | `/api/apps/{id}` | Delete an app | [Ver](https://waha.lobocrea.pro/#/%F0%9F%A7%A9%20Apps/AppsController_delete) |
| GET | `/api/apps/chatwoot/locales` | Get available languages for Chatwoot app | [Ver](https://waha.lobocrea.pro/#/%F0%9F%A7%A9%20Apps/ChatwootLocalesController_getLanguages) |

***

## 🔑 Auth

**Descripción:** Authentication

| Método | Endpoint | Descripción | URL |
|--------|----------|-------------|-----|
| GET | `/api/{session}/auth/qr` | Get QR code for pairing WhatsApp API | [Ver](https://waha.lobocrea.pro/#/%F0%9F%94%91%20Auth/AuthController_getQR) |
| POST | `/api/{session}/auth/request-code` | Request authentication code | [Ver](https://waha.lobocrea.pro/#/%F0%9F%94%91%20Auth/AuthController_requestCode) |

***

## 🆔 Profile

**Descripción:** Your profile information

| Método | Endpoint | Descripción | URL |
|--------|----------|-------------|-----|
| GET | `/api/{session}/profile` | Get my profile | [Ver](https://waha.lobocrea.pro/#/%F0%9F%86%94%20Profile/ProfileController_getMyProfile) |
| PUT | `/api/{session}/profile/name` | Set my profile name | [Ver](https://waha.lobocrea.pro/#/%F0%9F%86%94%20Profile/ProfileController_setProfileName) |
| PUT | `/api/{session}/profile/status` | Set profile status (About) | [Ver](https://waha.lobocrea.pro/#/%F0%9F%86%94%20Profile/ProfileController_setProfileStatus) |
| PUT | `/api/{session}/profile/picture` | Set profile picture | [Ver](https://waha.lobocrea.pro/#/%F0%9F%86%94%20Profile/ProfileController_setProfilePicture) |
| DELETE | `/api/{session}/profile/picture` | Delete profile picture | [Ver](https://waha.lobocrea.pro/#/%F0%9F%86%94%20Profile/ProfileController_deleteProfilePicture) |

***

## 🖼️ Screenshot

**Descripción:** Get screenshot of WhatsApp and show QR code

| Método | Endpoint | Descripción | URL |
|--------|----------|-------------|-----|
| GET | `/api/screenshot` | Get screenshot | [Ver](https://waha.lobocrea.pro/#/%F0%9F%96%BC%EF%B8%8F%20Screenshot/ScreenshotController_screenshot) |

***

## 📤 Chatting

**Descripción:** Chatting methods

| Método | Endpoint | Descripción | URL |
|--------|----------|-------------|-----|
| POST | `/api/sendText` | Send a text message | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendText) |
| GET | `/api/sendText` | Send a text message (GET) | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendTextGet) |
| POST | `/api/sendImage` | Send an image | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendImage) |
| POST | `/api/sendFile` | Send a file | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendFile) |
| POST | `/api/sendVoice` | Send a voice message | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendVoice) |
| POST | `/api/sendVideo` | Send a video | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendVideo) |
| POST | `/api/send/link-custom-preview` | Send a text message with a CUSTOM link preview | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendLinkCustomPreview) |
| POST | `/api/sendButtons` | Send buttons message (interactive) | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendButtons) |
| POST | `/api/sendList` | Send a list message (interactive) | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendList) |
| POST | `/api/forwardMessage` | Forward a message | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_forwardMessage) |
| POST | `/api/sendSeen` | Mark message as seen | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendSeen) |
| POST | `/api/startTyping` | Start typing indicator | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_startTyping) |
| POST | `/api/stopTyping` | Stop typing indicator | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_stopTyping) |
| PUT | `/api/reaction` | React to a message with an emoji | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_setReaction) |
| PUT | `/api/star` | Star or unstar a message | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_setStar) |
| POST | `/api/sendPoll` | Send a poll with options | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendPoll) |
| POST | `/api/sendPollVote` | Vote on a poll | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendPollVote) |
| POST | `/api/sendLocation` | Send a location | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendLocation) |
| POST | `/api/sendContactVcard` | Send a contact (vCard) | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendContactVcard) |
| POST | `/api/send/buttons/reply` | Reply on a button message | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendButtonsReply) |
| GET | `/api/messages` | Get messages in a chat | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_getMessages) |
| GET | `/api/checkNumberStatus` | Check number status | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_DEPRECATED_checkNumberStatus) |
| POST | `/api/reply` | DEPRECATED - you can set "reply_to" field when sending text, image, etc | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_reply) |
| POST | `/api/sendLinkPreview` | DEPRECATED - Send link preview | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A4%20Chatting/ChattingController_sendLinkPreview_DEPRECATED) |

***

## 📢 Channels

**Descripción:** Channels (newsletters) methods

| Método | Endpoint | Descripción | URL |
|--------|----------|-------------|-----|
| GET | `/api/{session}/channels` | Get list of know channels | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A2%20Channels/ChannelsController_list) |
| POST | `/api/{session}/channels` | Create a new channel | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A2%20Channels/ChannelsController_create) |
| DELETE | `/api/{session}/channels/{id}` | Delete the channel | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A2%20Channels/ChannelsController_delete) |
| GET | `/api/{session}/channels/{id}` | Get the channel info | [Ver](https://waha.lobocrea.pro/#/%F0%9F%93%A2