import { Loader2 } from 'lucide-react'

const Loading = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="relative">
        <Loader2 className={`${sizes[size]} animate-spin text-primary-600`} />
        <div className={`absolute inset-0 ${sizes[size]} rounded-full border-2 border-primary-100`}></div>
      </div>
      {text && <p className="text-sm text-gray-600 font-medium animate-pulse-soft">{text}</p>}
    </div>
  )
}

export default Loading

