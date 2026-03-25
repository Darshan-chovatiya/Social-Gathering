import { Inbox } from 'lucide-react'

const EmptyState = ({ 
  icon: Icon = Inbox, 
  title = 'No data found', 
  message = 'There are no items to display at the moment.',
  action 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-inner">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-6 leading-relaxed">{message}</p>
      {action && <div className="animate-fade-in">{action}</div>}
    </div>
  )
}

export default EmptyState

