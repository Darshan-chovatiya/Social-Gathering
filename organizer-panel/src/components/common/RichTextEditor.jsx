import { useState, useRef, useEffect } from 'react'
import { Bold, Italic, Underline, Strikethrough, Code, ListOrdered, List, Link as LinkIcon } from 'lucide-react'

const RichTextEditor = ({ name, value, onChange, placeholder = 'Enter text...', className = '', rows = 4 }) => {
  const editorRef = useRef(null)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')

  useEffect(() => {
    if (editorRef.current) {
      const currentContent = editorRef.current.innerHTML
      const newContent = value || ''
      
      // Only update if content has actually changed to avoid cursor issues
      // Compare normalized HTML (remove extra whitespace)
      const normalizeHTML = (html) => {
        if (!html) return ''
        // Create a temporary div to normalize HTML
        const temp = document.createElement('div')
        temp.innerHTML = html
        return temp.innerHTML
      }
      
      if (normalizeHTML(currentContent) !== normalizeHTML(newContent)) {
        // Save cursor position before updating
        const selection = window.getSelection()
        let savedRange = null
        if (selection.rangeCount > 0) {
          savedRange = selection.getRangeAt(0).cloneRange()
        }
        
        // Update content - this will store HTML with all formatting
        editorRef.current.innerHTML = newContent
        
        // Try to restore cursor position
        if (savedRange) {
          try {
            selection.removeAllRanges()
            selection.addRange(savedRange)
          } catch (e) {
            // If restoration fails, just focus the editor
            editorRef.current.focus()
          }
        }
      }
    }
  }, [value])

  const getSelection = () => {
    const selection = window.getSelection()
    if (selection.rangeCount === 0) return null
    return selection.getRangeAt(0)
  }

  const restoreSelection = (range) => {
    if (!range) return
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const saveSelection = () => {
    return getSelection()
  }

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateValue()
  }

  const updateValue = () => {
    if (editorRef.current) {
      // Get the HTML content - this preserves all formatting (bold, italic, etc.)
      const html = editorRef.current.innerHTML
      // Send the HTML to the parent component, which will store it in the database
      onChange({ target: { name, value: html } })
    }
  }

  const handleBold = () => execCommand('bold')
  const handleItalic = () => execCommand('italic')
  const handleUnderline = () => execCommand('underline')
  const handleStrikethrough = () => execCommand('strikeThrough')
  const handleCode = () => {
    const range = saveSelection()
    if (range && !range.collapsed) {
      const selectedText = range.toString()
      const codeElement = document.createElement('code')
      codeElement.textContent = selectedText
      codeElement.style.backgroundColor = '#f3f4f6'
      codeElement.style.padding = '2px 4px'
      codeElement.style.borderRadius = '4px'
      codeElement.style.fontFamily = 'monospace'
      range.deleteContents()
      range.insertNode(codeElement)
      updateValue()
      editorRef.current?.focus()
    }
  }
  
  const handleOrderedList = () => execCommand('insertOrderedList')
  const handleUnorderedList = () => execCommand('insertUnorderedList')

  const handleLink = () => {
    const range = saveSelection()
    if (range && !range.collapsed) {
      setLinkText(range.toString())
    } else {
      setLinkText('')
    }
    setLinkUrl('')
    setIsLinkModalOpen(true)
  }

  const insertLink = () => {
    if (!linkUrl.trim()) {
      alert('Please enter a URL')
      return
    }

    const range = saveSelection()
    if (!range) return

    const linkElement = document.createElement('a')
    linkElement.href = linkUrl
    linkElement.textContent = linkText || linkUrl
    linkElement.target = '_blank'
    linkElement.rel = 'noopener noreferrer'
    linkElement.style.color = '#3b82f6'
    linkElement.style.textDecoration = 'underline'

    if (range.collapsed) {
      range.insertNode(linkElement)
    } else {
      range.deleteContents()
      range.insertNode(linkElement)
    }

    updateValue()
    setIsLinkModalOpen(false)
    setLinkUrl('')
    setLinkText('')
    editorRef.current?.focus()
  }

  return (
    <div className={`border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <button
          type="button"
          onClick={handleBold}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4 text-gray-700" />
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button
          type="button"
          onClick={handleItalic}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4 text-gray-700" />
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button
          type="button"
          onClick={handleUnderline}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Underline"
        >
          <Underline className="w-4 h-4 text-gray-700" />
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button
          type="button"
          onClick={handleStrikethrough}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4 text-gray-700" />
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button
          type="button"
          onClick={handleCode}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Code"
        >
          <Code className="w-4 h-4 text-gray-700" />
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button
          type="button"
          onClick={handleOrderedList}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4 text-gray-700" />
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button
          type="button"
          onClick={handleUnorderedList}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Bulleted List"
        >
          <List className="w-4 h-4 text-gray-700" />
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button
          type="button"
          onClick={handleLink}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {/* Text Input Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={updateValue}
        onBlur={updateValue}
        data-placeholder={placeholder}
        className="w-full px-4 py-3 border-0 rounded-b-lg focus:outline-none focus:ring-0 resize-none text-sm text-gray-900 min-h-[120px] overflow-y-auto"
        style={{ 
          minHeight: `${rows * 1.5}rem`,
        }}
        suppressContentEditableWarning={true}
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] code {
          background-color: #f3f4f6;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
        }
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin-left: 1.5rem;
          padding-left: 0.5rem;
        }
        [contenteditable] ul {
          list-style-type: disc;
        }
        [contenteditable] ol {
          list-style-type: decimal;
        }
      `}</style>

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsLinkModalOpen(false)
                  setLinkUrl('')
                  setLinkText('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-primary-500 rounded-lg hover:bg-primary-600"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RichTextEditor

