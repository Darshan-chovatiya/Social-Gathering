import { useState } from 'react'
import { Mic2, Music, CheckCircle2, Loader2 } from 'lucide-react'
import api from '../../utils/api'
import logoIcon from '../../assets/Logo Icon.png'

const COUNTRY_OPTIONS = [
  { code: 'IN', dial: '+91', label: 'IN (+91)' },
  { code: 'US', dial: '+1', label: 'US (+1)' },
  { code: 'GB', dial: '+44', label: 'GB (+44)' },
  { code: 'AE', dial: '+971', label: 'AE (+971)' },
  { code: 'AU', dial: '+61', label: 'AU (+61)' },
]

const initialForm = {
  fullName: '',
  email: '',
  organizationName: '',
  city: '',
  phone: '',
}

function ArtistInquiryIllustration() {
  return (
    <div
      className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 via-white to-primary-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 lg:min-h-[600px]"
      aria-hidden
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.35] dark:opacity-20" viewBox="0 0 400 320" fill="none">
        <path
          d="M0 180 Q100 140 200 180 T400 180"
          stroke="currentColor"
          className="text-primary-400"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0 200 Q120 240 240 200 T400 210"
          stroke="currentColor"
          className="text-primary-300"
          strokeWidth="1"
          fill="none"
        />
        <g className="text-primary-500">
          <circle cx="72" cy="96" r="6" fill="currentColor" opacity="0.5" />
          <circle cx="300" cy="64" r="5" fill="currentColor" opacity="0.4" />
          <circle cx="320" cy="120" r="4" fill="currentColor" opacity="0.35" />
        </g>
      </svg>

      <div className="relative z-10 flex flex-col items-center px-6 py-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/30">
          <Mic2 className="h-8 w-8 text-gray-900" />
        </div>
        <div className="relative">
          <div className="mx-auto flex h-44 w-36 items-end justify-center rounded-t-[3rem] bg-gradient-to-b from-primary-200/80 to-primary-400/90 dark:from-primary-900/40 dark:to-primary-700/50">
            <div className="mb-0 flex flex-col items-center">
              <div className="h-14 w-14 rounded-full bg-gray-800/90 dark:bg-gray-700" />
              <div className="-mt-2 h-24 w-28 rounded-t-2xl bg-indigo-600/90 dark:bg-indigo-700" />
            </div>
          </div>
          <Music className="absolute -right-4 top-8 h-10 w-10 text-primary-600 dark:text-primary-400 opacity-80" />
          <Music className="absolute -left-6 top-20 h-8 w-8 text-primary-500 dark:text-primary-500 opacity-60" />
        </div>
        <p className="mt-6 max-w-xs text-sm font-semibold text-gray-700 dark:text-gray-300">
          Performers & creators — we&apos;d love to hear from you.
        </p>
      </div>
    </div>
  )
}

const ArtistInquirySection = () => {
  const [form, setForm] = useState(initialForm)
  const [country, setCountry] = useState(COUNTRY_OPTIONS[0])
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((e) => ({ ...e, [key]: '' }))
    setSubmitError('')
  }

  const validateClient = () => {
    const err = {}
    if (!form.fullName.trim()) err.fullName = 'Full name is required'
    if (!form.email.trim()) err.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) err.email = 'Please enter a valid email'
    if (!form.phone.trim()) err.phone = 'Phone number is required'
    else if (!/^[0-9]{7,15}$/.test(form.phone.replace(/\s/g, ''))) err.phone = 'Enter 7–15 digits'
    if (!form.organizationName.trim()) err.organizationName = 'Organisation name is required'
    setFieldErrors(err)
    return Object.keys(err).length === 0
  }

  const parseApiErrors = (errors) => {
    const map = {}
    if (!Array.isArray(errors)) return map
    errors.forEach((line) => {
      const m = /^([^:]+):\s*(.+)$/.exec(line)
      if (m) {
        const key = m[1].trim()
        map[key] = m[2].trim()
      }
    })
    return map
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess(false)
    if (!validateClient()) return

    setLoading(true)
    setSubmitError('')
    try {
      const phoneDigits = form.phone.replace(/\D/g, '')
      await api.post('/artist-inquiries', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        countryCode: country.dial,
        phone: phoneDigits,
        organizationName: form.organizationName.trim(),
        city: form.city.trim(),
      })
      setSuccess(true)
      setForm(initialForm)
      setFieldErrors({})
    } catch (error) {
      const data = error.response?.data
      const apiErrs = data?.result?.errors
      if (Array.isArray(apiErrs) && apiErrs.length) {
        setFieldErrors(parseApiErrors(apiErrs))
        setSubmitError(data?.message || 'Please fix the errors below.')
      } else {
        setSubmitError(data?.message || error.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const labelClass = 'mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200'
  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500'

  return (
    <section className="relative z-30 mt-12 md:mt-16" aria-labelledby="artist-inquiry-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 text-center lg:text-left">
          <p className="text-primary-600 dark:text-primary-400 font-bold text-xs uppercase tracking-widest mb-2">
            For artists & performers
          </p>
          <h2
            id="artist-inquiry-title"
            className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight"
          >
            Artist inquiry
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto lg:mx-0">
            Share your details and our team will get back to you about opportunities on Social Gathering.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 lg:items-stretch">
          <div className="order-2 lg:order-1">
            <ArtistInquiryIllustration />
          </div>

          <div className="order-1 lg:order-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800/80 dark:shadow-none sm:p-8">
              {/* <div className="mb-8 flex flex-col items-center text-center">
                {logoError ? (
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600">
                    <Mic2 className="h-7 w-7 text-gray-900" />
                  </div>
                ) : (
                  <div className="mb-4 h-14 w-14 overflow-hidden rounded-xl ring-1 ring-gray-200 dark:ring-gray-600">
                    <img
                      src={logoIcon}
                      alt=""
                      className="h-full w-full object-contain bg-white p-1"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Artist inquiry form</h3>
              </div> */}

              {success && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    Thank you! Your inquiry has been submitted. We&apos;ll contact you soon.
                  </p>
                </div>
              )}

              {submitError && !success && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="artist-fullName" className={labelClass}>
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="artist-fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter full name"
                    className={inputClass}
                    value={form.fullName}
                    onChange={(e) => setField('fullName', e.target.value)}
                  />
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="artist-email" className={labelClass}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="artist-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <span className={labelClass}>
                    Phone number <span className="text-red-500">*</span>
                  </span>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      aria-label="Country code"
                      className={`${inputClass} sm:max-w-[140px] sm:flex-shrink-0`}
                      value={country.code}
                      onChange={(e) => {
                        const next = COUNTRY_OPTIONS.find((c) => c.code === e.target.value)
                        if (next) setCountry(next)
                      }}
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex min-w-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800">
                      <span className="flex shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-900/50 dark:text-gray-400">
                        {country.dial}
                      </span>
                      <input
                        id="artist-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="Enter phone number"
                        className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-gray-500"
                        value={form.phone}
                        onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 15))}
                      />
                    </div>
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="artist-org" className={labelClass}>
                    Organisation name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="artist-org"
                    type="text"
                    autoComplete="organization"
                    placeholder="Enter organisation name"
                    className={inputClass}
                    value={form.organizationName}
                    onChange={(e) => setField('organizationName', e.target.value)}
                  />
                  {fieldErrors.organizationName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.organizationName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="artist-city" className={labelClass}>
                    City
                  </label>
                  <input
                    id="artist-city"
                    type="text"
                    autoComplete="address-level2"
                    placeholder="Enter city"
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                  />
                  {fieldErrors.city && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.city}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-8 py-3.5 text-sm font-bold text-gray-900 shadow-md transition hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ArtistInquirySection
