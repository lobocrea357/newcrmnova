// dashboard/src/components/conversaciones/GlobalSearchBar.jsx
'use client'

import { Search, X, RefreshCw } from 'lucide-react'
import ContactAvatar from '@/components/ContactAvatar'
import HighlightText from '@/components/HighlightText'

export default function GlobalSearchBar({
  globalSearchQuery,
  onSearchChange,
  onClearSearch,
  loadingGlobalSearch,
  isGlobalSearchActive,
  globalSearchResults,
  lastChatId,
  onResultClick
}) {
  return (
    <>
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={globalSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, teléfono o palabra clave..."
            className="w-full pl-10 pr-10 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
          {globalSearchQuery && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {loadingGlobalSearch && (
          <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Buscando...</span>
          </div>
        )}
        {isGlobalSearchActive && !loadingGlobalSearch && (
          <div className="mt-2 text-sm text-gray-600">
            {globalSearchResults.length} resultado
            {globalSearchResults.length !== 1 ? "s" : ""} encontrado
            {globalSearchResults.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {isGlobalSearchActive && (
        <div className="flex-1">
          {loadingGlobalSearch ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500 gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Buscando conversaciones...
            </div>
          ) : globalSearchResults.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center px-6 py-12">
              <div>
                <Search className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className="mt-3 text-sm font-medium text-gray-900">
                  No se encontraron resultados
                </h3>
                <p className="mt-1 text-sm text-gray-500 max-w-md">
                  No hay conversaciones que coincidan con "
                  {globalSearchQuery}"
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[50vh] lg:max-h-[450px] overflow-y-auto divide-y divide-gray-200">
              {globalSearchResults.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onResultClick(chat)}
                  className={`px-6 py-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                    chat.id && lastChatId === String(chat.id)
                      ? "bg-indigo-50 hover:bg-indigo-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center min-w-0 flex-1 gap-4">
                    <ContactAvatar
                      profilePictureUrl={chat.contact_profile_picture_url}
                      contactName={chat.contact_name || "Sin nombre"}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        <HighlightText
                          text={chat.contact_name || "Sin nombre"}
                          searchQuery={globalSearchQuery}
                          className="text-gray-900"
                        />
                      </p>

                      {chat.match_message ? (
                        <div className="flex items-start gap-1 mt-0.5 text-xs text-gray-600">
                          <span className="truncate">
                            <HighlightText
                              text={chat.match_message}
                              searchQuery={globalSearchQuery}
                              className="text-gray-600"
                            />
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                          <span className="truncate max-w-[120px]">
                            <HighlightText
                              text={chat.contact_phone}
                              searchQuery={globalSearchQuery}
                              className="text-gray-500"
                            />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 text-xs text-gray-500">
                    {chat.last_message_time && (
                      <span>
                        {new Date(
                          chat.last_message_time,
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
