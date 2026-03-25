import { useMemo, useState } from 'react'
import { ChevronDown, Smartphone, Sparkles, Zap } from 'lucide-react'
import logoIcon from '../../assets/Logo Icon.png'

const benefits = [
  {
    title: 'Earn rewards on app bookings',
    body: 'Get bonus perks when you complete ticket purchases through the Social Gathering mobile app.',
  },
  {
    title: 'Automatic credit after purchase',
    body: 'After each successful transaction in the app, rewards are applied to your account—no extra steps.',
  },
  {
    title: 'App-only offers',
    body: 'Unlock exclusive discounts and early access to select events available only in the app.',
  },
]

/**
 * Promotional strip for mobile app install. Place above the site footer on the home page.
 *
 * Optional env:
 * - VITE_APP_DOWNLOAD_URL — URL encoded in QR (default: site origin + /download)
 * - VITE_APP_QR_IMAGE — path to static QR in /public e.g. "/app-qr.png"
 */
const DownloadAppSection = () => {
  const [logoError, setLogoError] = useState(false)
  const [qrError, setQrError] = useState(false)

  const downloadUrl =
    import.meta.env.VITE_APP_DOWNLOAD_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/download` : 'https://socialgathering.app/download')

  const customQr = import.meta.env.VITE_APP_QR_IMAGE
  const iosUrl = import.meta.env.VITE_APP_IOS_URL
  const androidUrl = import.meta.env.VITE_APP_ANDROID_URL

  const qrSrc = useMemo(() => {
    if (customQr) return customQr
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(downloadUrl)}`
  }, [customQr, downloadUrl])

  return (
    <section
      className="relative z-30 mt-16 md:mt-20 mb-6 md:mb-10"
      aria-labelledby="download-app-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className="
            relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem]
            border border-primary-500/20 dark:border-primary-400/15
            bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950
            shadow-2xl shadow-primary-900/20
          "
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(254, 223, 107, 0.12), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 70%, rgba(59, 130, 246, 0.15), transparent 50%)',
            }}
          />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 gap-10 p-8 sm:p-10 lg:grid-cols-12 lg:gap-8 lg:p-12">
            {/* Brand + headline */}
            <div className="flex flex-col justify-center lg:col-span-4">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-xl border border-dashed border-white/35 bg-white/5 px-3 py-2 backdrop-blur-sm">
                {logoError ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600">
                    <Smartphone className="h-5 w-5 text-gray-900" />
                  </div>
                ) : (
                  <div className="h-10 w-10 overflow-hidden rounded-lg ring-1 ring-white/20">
                    <img
                      src={logoIcon}
                      alt=""
                      className="h-full w-full object-contain bg-white/95 p-0.5"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                )}
                <span className="text-sm font-black italic tracking-tight text-white sm:text-base">
                  Social Gathering
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-6 w-6 shrink-0 text-primary-400" aria-hidden />
                <div>
                  <h2
                    id="download-app-heading"
                    className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl md:text-4xl"
                  >
                    Get the app
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-blue-100/90 sm:text-base">
                    Book faster, stay updated, and enjoy member-only benefits—right from your phone.
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="flex flex-col justify-center border-y border-white/10 py-8 lg:col-span-5 lg:border-x lg:border-y-0 lg:px-8 lg:py-0">
              <div className="mb-4 hidden items-center gap-2 text-primary-300/90 lg:flex">
                <Zap className="h-5 w-5" aria-hidden />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Why download</span>
              </div>
              <ol className="space-y-5">
                {benefits.map((item, i) => (
                  <li key={item.title} className="flex gap-4">
                    <span
                      className="
                        flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                        bg-primary-500/90 text-sm font-black text-gray-900 shadow-md shadow-primary-500/30
                      "
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-blue-100/85">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* QR + CTA */}
            <div className="flex flex-col items-center justify-center text-center lg:col-span-3">
              <p className="text-base font-bold text-white underline decoration-primary-400/80 decoration-2 underline-offset-4">
                Download the app
              </p>
              <div className="mt-2 flex flex-col items-center gap-0.5 text-primary-200/90" aria-hidden>
                <ChevronDown className="h-4 w-4" />
                <ChevronDown className="-mt-2 h-4 w-4 opacity-80" />
                <ChevronDown className="-mt-2 h-4 w-4 opacity-60" />
              </div>

              <div className="mt-6 rounded-2xl border-2 border-white/90 bg-white p-3 shadow-lg shadow-black/25">
                {!qrError ? (
                  <img
                    src={qrSrc}
                    alt="Scan to open the Social Gathering app download page"
                    width={200}
                    height={200}
                    className="h-[180px] w-[180px] sm:h-[200px] sm:w-[200px] object-contain"
                    loading="lazy"
                    onError={() => setQrError(true)}
                  />
                ) : (
                  <div className="flex h-[180px] w-[180px] flex-col items-center justify-center gap-2 bg-gray-100 p-4 text-center sm:h-[200px] sm:w-[200px]">
                    <QrFallback className="h-10 w-10 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">
                      QR code could not be loaded. Please try again later.
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-4 max-w-[220px] text-xs leading-relaxed text-blue-100/75">
                Scan with your phone camera to open the install page.
              </p>

              {(iosUrl || androidUrl) && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {iosUrl && (
                    <a
                      href={iosUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/25 transition hover:bg-white/20"
                    >
                      App Store
                    </a>
                  )}
                  {androidUrl && (
                    <a
                      href={androidUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/25 transition hover:bg-white/20"
                    >
                      Google Play
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function QrFallback(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path strokeLinecap="round" d="M14 14h3v3h-3zM18 14h3M14 18h7M14 21h4" />
    </svg>
  )
}

export default DownloadAppSection
