import { ExternalLink } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile View - Only Powered By + Policy Links (no copyright) */}
        <div className="md:hidden flex flex-col items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {/* Powered By */}
          <div className="flex items-center gap-1">
            <span>Powered By</span>
            <a
              href="https://itfuturz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
            >
              <span>ITFuturz</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Policy Links */}
          <div className="flex flex-wrap justify-center gap-4 text-center">
            <a
              href="https://easytickets.in/privacy-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://easytickets.in/terms-of-service.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="https://easytickets.in/refund_policy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Refund Policy
            </a>
          </div>
        </div>

        {/* Desktop View - Full layout with copyright on right */}
        <div className="hidden md:flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          {/* Left: Powered By + Policy Links */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <span>Powered By</span>
              <a
                href="https://itfuturz.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
              >
                <span>ITFuturz</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="https://easytickets.in/privacy-policy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="https://easytickets.in/terms-of-service.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="https://easytickets.in/refund_policy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Refund Policy
              </a>
            </div>
          </div>

          {/* Right: Copyright – only visible on desktop and up */}
          <div className="text-gray-500 dark:text-gray-500">
            © {currentYear} Easy Tickets. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer