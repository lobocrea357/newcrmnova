import { ArrowRight } from "lucide-react";

export default function ComparisonBadge({ isFragmented, chatsCount }) {
  if (!isFragmented) {
    return (
      <div className="bg-green-50 px-3 py-2 rounded border border-green-200">
        <p className="text-xs text-green-700 font-medium">✓ Sin fragmentación</p>
        <p className="text-[10px] text-green-600">1 conversación continua</p>
      </div>
    );
  }

  return (
    <div className="text-right">
      <div className="mb-2">
        <p className="text-xs text-gray-500 mb-1">Vista Actual</p>
        <div className="bg-red-50 px-3 py-1 rounded border border-red-200">
          <p className="text-sm font-bold text-red-600">{chatsCount} chats separados</p>
        </div>
      </div>
      
      <ArrowRight className="h-4 w-4 text-gray-400 mx-auto my-1" />
      
      <div>
        <p className="text-xs text-gray-500 mb-1">Vista Thread</p>
        <div className="bg-green-50 px-3 py-1 rounded border border-green-200">
          <p className="text-sm font-bold text-green-600">1 conversación unificada</p>
        </div>
      </div>
    </div>
  );
}
