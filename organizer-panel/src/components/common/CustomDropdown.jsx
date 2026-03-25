import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  truncateLength = 20,
  maxHeight = '250px',
  disabled = false,
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen, searchable])

  const selectedOption = options.find((opt) => opt.value === value)
  const displayText = selectedOption
    ? selectedOption.label && selectedOption.label.length > truncateLength
      ? `${selectedOption.label.substring(0, truncateLength)}...`
      : selectedOption.label
    : placeholder

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white transition-colors flex items-center justify-between gap-2 ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-50 cursor-pointer'
        }`}
        style={{ height: '42px', lineHeight: '1.5' }}
      >
        <span className="text-sm text-gray-700 truncate" title={selectedOption?.label || placeholder}>
          {displayText}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col"
          style={{ maxHeight }}
        >
          {searchable && (
            <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="py-1 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    value === option.value
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  title={option.label}
                >
                  {option.label && option.label.length > truncateLength
                    ? `${option.label.substring(0, truncateLength)}...`
                    : option.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-gray-400 text-center italic">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomDropdown

