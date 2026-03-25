import { useState } from 'react'
import { Mic2, Music, CheckCircle2, Loader2 } from 'lucide-react'
import api from '../../utils/api'
import logoIcon from '../../assets/Logo Icon.png'

const COUNTRY_OPTIONS = [
  { code: 'AF', dial: '+93', label: 'AF (+93)' },
  { code: 'AL', dial: '+355', label: 'AL (+355)' },
  { code: 'DZ', dial: '+213', label: 'DZ (+213)' },
  { code: 'AD', dial: '+376', label: 'AD (+376)' },
  { code: 'AO', dial: '+244', label: 'AO (+244)' },
  { code: 'AR', dial: '+54', label: 'AR (+54)' },
  { code: 'AM', dial: '+374', label: 'AM (+374)' },
  { code: 'AU', dial: '+61', label: 'AU (+61)' },
  { code: 'AT', dial: '+43', label: 'AT (+43)' },
  { code: 'AZ', dial: '+994', label: 'AZ (+994)' },
  { code: 'BH', dial: '+973', label: 'BH (+973)' },
  { code: 'BD', dial: '+880', label: 'BD (+880)' },
  { code: 'BY', dial: '+375', label: 'BY (+375)' },
  { code: 'BE', dial: '+32', label: 'BE (+32)' },
  { code: 'BZ', dial: '+501', label: 'BZ (+501)' },
  { code: 'BJ', dial: '+229', label: 'BJ (+229)' },
  { code: 'BT', dial: '+975', label: 'BT (+975)' },
  { code: 'BO', dial: '+591', label: 'BO (+591)' },
  { code: 'BA', dial: '+387', label: 'BA (+387)' },
  { code: 'BW', dial: '+267', label: 'BW (+267)' },
  { code: 'BR', dial: '+55', label: 'BR (+55)' },
  { code: 'BN', dial: '+673', label: 'BN (+673)' },
  { code: 'BG', dial: '+359', label: 'BG (+359)' },
  { code: 'BF', dial: '+226', label: 'BF (+226)' },
  { code: 'BI', dial: '+257', label: 'BI (+257)' },
  { code: 'KH', dial: '+855', label: 'KH (+855)' },
  { code: 'CM', dial: '+237', label: 'CM (+237)' },
  { code: 'CA', dial: '+1', label: 'CA (+1)' },
  { code: 'CV', dial: '+238', label: 'CV (+238)' },
  { code: 'CF', dial: '+236', label: 'CF (+236)' },
  { code: 'TD', dial: '+235', label: 'TD (+235)' },
  { code: 'CL', dial: '+56', label: 'CL (+56)' },
  { code: 'CN', dial: '+86', label: 'CN (+86)' },
  { code: 'CO', dial: '+57', label: 'CO (+57)' },
  { code: 'KM', dial: '+269', label: 'KM (+269)' },
  { code: 'CG', dial: '+242', label: 'CG (+242)' },
  { code: 'CR', dial: '+506', label: 'CR (+506)' },
  { code: 'HR', dial: '+385', label: 'HR (+385)' },
  { code: 'CU', dial: '+53', label: 'CU (+53)' },
  { code: 'CY', dial: '+357', label: 'CY (+357)' },
  { code: 'CZ', dial: '+420', label: 'CZ (+420)' },
  { code: 'DK', dial: '+45', label: 'DK (+45)' },
  { code: 'DJ', dial: '+253', label: 'DJ (+253)' },
  { code: 'DO', dial: '+1', label: 'DO (+1)' },
  { code: 'EC', dial: '+593', label: 'EC (+593)' },
  { code: 'EG', dial: '+20', label: 'EG (+20)' },
  { code: 'SV', dial: '+503', label: 'SV (+503)' },
  { code: 'GQ', dial: '+240', label: 'GQ (+240)' },
  { code: 'ER', dial: '+291', label: 'ER (+291)' },
  { code: 'EE', dial: '+372', label: 'EE (+372)' },
  { code: 'SZ', dial: '+268', label: 'SZ (+268)' },
  { code: 'ET', dial: '+251', label: 'ET (+251)' },
  { code: 'FJ', dial: '+679', label: 'FJ (+679)' },
  { code: 'FI', dial: '+358', label: 'FI (+358)' },
  { code: 'FR', dial: '+33', label: 'FR (+33)' },
  { code: 'GA', dial: '+241', label: 'GA (+241)' },
  { code: 'GM', dial: '+220', label: 'GM (+220)' },
  { code: 'GE', dial: '+995', label: 'GE (+995)' },
  { code: 'DE', dial: '+49', label: 'DE (+49)' },
  { code: 'GH', dial: '+233', label: 'GH (+233)' },
  { code: 'GR', dial: '+30', label: 'GR (+30)' },
  { code: 'GT', dial: '+502', label: 'GT (+502)' },
  { code: 'GN', dial: '+224', label: 'GN (+224)' },
  { code: 'GW', dial: '+245', label: 'GW (+245)' },
  { code: 'GY', dial: '+592', label: 'GY (+592)' },
  { code: 'HT', dial: '+509', label: 'HT (+509)' },
  { code: 'HN', dial: '+504', label: 'HN (+504)' },
  { code: 'HK', dial: '+852', label: 'HK (+852)' },
  { code: 'HU', dial: '+36', label: 'HU (+36)' },
  { code: 'IS', dial: '+354', label: 'IS (+354)' },
  { code: 'IN', dial: '+91', label: 'IN (+91)' },
  { code: 'ID', dial: '+62', label: 'ID (+62)' },
  { code: 'IR', dial: '+98', label: 'IR (+98)' },
  { code: 'IQ', dial: '+964', label: 'IQ (+964)' },
  { code: 'IE', dial: '+353', label: 'IE (+353)' },
  { code: 'IL', dial: '+972', label: 'IL (+972)' },
  { code: 'IT', dial: '+39', label: 'IT (+39)' },
  { code: 'JM', dial: '+1', label: 'JM (+1)' },
  { code: 'JP', dial: '+81', label: 'JP (+81)' },
  { code: 'JO', dial: '+962', label: 'JO (+962)' },
  { code: 'KZ', dial: '+7', label: 'KZ (+7)' },
  { code: 'KE', dial: '+254', label: 'KE (+254)' },
  { code: 'KI', dial: '+686', label: 'KI (+686)' },
  { code: 'KW', dial: '+965', label: 'KW (+965)' },
  { code: 'KG', dial: '+996', label: 'KG (+996)' },
  { code: 'LA', dial: '+856', label: 'LA (+856)' },
  { code: 'LV', dial: '+371', label: 'LV (+371)' },
  { code: 'LB', dial: '+961', label: 'LB (+961)' },
  { code: 'LS', dial: '+266', label: 'LS (+266)' },
  { code: 'LR', dial: '+231', label: 'LR (+231)' },
  { code: 'LY', dial: '+218', label: 'LY (+218)' },
  { code: 'LI', dial: '+423', label: 'LI (+423)' },
  { code: 'LT', dial: '+370', label: 'LT (+370)' },
  { code: 'LU', dial: '+352', label: 'LU (+352)' },
  { code: 'MO', dial: '+853', label: 'MO (+853)' },
  { code: 'MG', dial: '+261', label: 'MG (+261)' },
  { code: 'MW', dial: '+265', label: 'MW (+265)' },
  { code: 'MY', dial: '+60', label: 'MY (+60)' },
  { code: 'MV', dial: '+960', label: 'MV (+960)' },
  { code: 'ML', dial: '+223', label: 'ML (+223)' },
  { code: 'MT', dial: '+356', label: 'MT (+356)' },
  { code: 'MH', dial: '+692', label: 'MH (+692)' },
  { code: 'MR', dial: '+222', label: 'MR (+222)' },
  { code: 'MU', dial: '+230', label: 'MU (+230)' },
  { code: 'MX', dial: '+52', label: 'MX (+52)' },
  { code: 'FM', dial: '+691', label: 'FM (+691)' },
  { code: 'MD', dial: '+373', label: 'MD (+373)' },
  { code: 'MC', dial: '+377', label: 'MC (+377)' },
  { code: 'MN', dial: '+976', label: 'MN (+976)' },
  { code: 'ME', dial: '+382', label: 'ME (+382)' },
  { code: 'MA', dial: '+212', label: 'MA (+212)' },
  { code: 'MZ', dial: '+258', label: 'MZ (+258)' },
  { code: 'MM', dial: '+95', label: 'MM (+95)' },
  { code: 'NA', dial: '+264', label: 'NA (+264)' },
  { code: 'NR', dial: '+674', label: 'NR (+674)' },
  { code: 'NP', dial: '+977', label: 'NP (+977)' },
  { code: 'NL', dial: '+31', label: 'NL (+31)' },
  { code: 'NZ', dial: '+64', label: 'NZ (+64)' },
  { code: 'NI', dial: '+505', label: 'NI (+505)' },
  { code: 'NE', dial: '+227', label: 'NE (+227)' },
  { code: 'NG', dial: '+234', label: 'NG (+234)' },
  { code: 'KP', dial: '+850', label: 'KP (+850)' },
  { code: 'MK', dial: '+389', label: 'MK (+389)' },
  { code: 'NO', dial: '+47', label: 'NO (+47)' },
  { code: 'OM', dial: '+968', label: 'OM (+968)' },
  { code: 'PK', dial: '+92', label: 'PK (+92)' },
  { code: 'PW', dial: '+680', label: 'PW (+680)' },
  { code: 'PA', dial: '+507', label: 'PA (+507)' },
  { code: 'PG', dial: '+675', label: 'PG (+675)' },
  { code: 'PY', dial: '+595', label: 'PY (+595)' },
  { code: 'PE', dial: '+51', label: 'PE (+51)' },
  { code: 'PH', dial: '+63', label: 'PH (+63)' },
  { code: 'PL', dial: '+48', label: 'PL (+48)' },
  { code: 'PT', dial: '+351', label: 'PT (+351)' },
  { code: 'QA', dial: '+974', label: 'QA (+974)' },
  { code: 'RO', dial: '+40', label: 'RO (+40)' },
  { code: 'RU', dial: '+7', label: 'RU (+7)' },
  { code: 'RW', dial: '+250', label: 'RW (+250)' },
  { code: 'KN', dial: '+1', label: 'KN (+1)' },
  { code: 'LC', dial: '+1', label: 'LC (+1)' },
  { code: 'VC', dial: '+1', label: 'VC (+1)' },
  { code: 'WS', dial: '+685', label: 'WS (+685)' },
  { code: 'SM', dial: '+378', label: 'SM (+378)' },
  { code: 'ST', dial: '+239', label: 'ST (+239)' },
  { code: 'SA', dial: '+966', label: 'SA (+966)' },
  { code: 'SN', dial: '+221', label: 'SN (+221)' },
  { code: 'RS', dial: '+381', label: 'RS (+381)' },
  { code: 'SC', dial: '+248', label: 'SC (+248)' },
  { code: 'SL', dial: '+232', label: 'SL (+232)' },
  { code: 'SG', dial: '+65', label: 'SG (+65)' },
  { code: 'SK', dial: '+421', label: 'SK (+421)' },
  { code: 'SI', dial: '+386', label: 'SI (+386)' },
  { code: 'SB', dial: '+677', label: 'SB (+677)' },
  { code: 'SO', dial: '+252', label: 'SO (+252)' },
  { code: 'ZA', dial: '+27', label: 'ZA (+27)' },
  { code: 'KR', dial: '+82', label: 'KR (+82)' },
  { code: 'SS', dial: '+211', label: 'SS (+211)' },
  { code: 'ES', dial: '+34', label: 'ES (+34)' },
  { code: 'LK', dial: '+94', label: 'LK (+94)' },
  { code: 'SD', dial: '+249', label: 'SD (+249)' },
  { code: 'SR', dial: '+597', label: 'SR (+597)' },
  { code: 'SE', dial: '+46', label: 'SE (+46)' },
  { code: 'CH', dial: '+41', label: 'CH (+41)' },
  { code: 'SY', dial: '+963', label: 'SY (+963)' },
  { code: 'TW', dial: '+886', label: 'TW (+886)' },
  { code: 'TJ', dial: '+992', label: 'TJ (+992)' },
  { code: 'TZ', dial: '+255', label: 'TZ (+255)' },
  { code: 'TH', dial: '+66', label: 'TH (+66)' },
  { code: 'TL', dial: '+670', label: 'TL (+670)' },
  { code: 'TG', dial: '+228', label: 'TG (+228)' },
  { code: 'TO', dial: '+676', label: 'TO (+676)' },
  { code: 'TT', dial: '+1', label: 'TT (+1)' },
  { code: 'TN', dial: '+216', label: 'TN (+216)' },
  { code: 'TR', dial: '+90', label: 'TR (+90)' },
  { code: 'TM', dial: '+993', label: 'TM (+993)' },
  { code: 'TV', dial: '+688', label: 'TV (+688)' },
  { code: 'UG', dial: '+256', label: 'UG (+256)' },
  { code: 'UA', dial: '+380', label: 'UA (+380)' },
  { code: 'AE', dial: '+971', label: 'AE (+971)' },
  { code: 'GB', dial: '+44', label: 'GB (+44)' },
  { code: 'US', dial: '+1', label: 'US (+1)' },
  { code: 'UY', dial: '+598', label: 'UY (+598)' },
  { code: 'UZ', dial: '+998', label: 'UZ (+998)' },
  { code: 'VU', dial: '+678', label: 'VU (+678)' },
  { code: 'VA', dial: '+379', label: 'VA (+379)' },
  { code: 'VE', dial: '+58', label: 'VE (+58)' },
  { code: 'VN', dial: '+84', label: 'VN (+84)' },
  { code: 'YE', dial: '+967', label: 'YE (+967)' },
  { code: 'ZM', dial: '+260', label: 'ZM (+260)' },
  { code: 'ZW', dial: '+263', label: 'ZW (+263)' },
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
