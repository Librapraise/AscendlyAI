import React from 'react'

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType; // Use ElementType for component props
  lightColor: string;
  textColor: string;
  onClick: () => void;
}

export default function ActionCard({ title, description, icon: Icon, lightColor, textColor, onClick }: ActionCardProps) {
  return (
    <div
      className="bg-gray-800 rounded-2xl p-6 cursor-pointer group border border-gray-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-16 h-16 ${lightColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon size={32} className={textColor} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}