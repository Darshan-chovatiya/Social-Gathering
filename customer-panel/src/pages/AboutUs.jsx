import { 
  Ticket, 
  Users, 
  Sparkles, 
  Shield, 
  Zap, 
  Heart,
  Target,
  Award,
  TrendingUp,
  Globe,
  Quote,
  Headphones,
  Wrench,
  Megaphone,
  Settings
} from 'lucide-react'

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section with Image Background */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 via-primary-700/90 to-primary-800/90 dark:from-primary-900/90 dark:via-primary-950/90">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&q=80')] bg-cover bg-center opacity-20"></div>
        </div>
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Ticket className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              What should we do this weekend?
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-4">
              Let Easy Tickets handle it.....
            </p>
            <div className="flex items-center justify-center gap-2 text-white/80">
              <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse delay-75"></div>
              <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-200 dark:border-gray-700">
            {/* Quote Icon */}
            <div className="absolute -top-6 -left-6 w-16 h-16 text-primary-600 dark:text-primary-400 opacity-20">
              <Quote className="w-full h-full" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-16 h-16 text-primary-600 dark:text-primary-400 opacity-20 rotate-180">
              <Quote className="w-full h-full" />
            </div>
            
            <div className="relative z-10">
              <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                <span className="text-primary-600 dark:text-primary-400 font-bold">At Easy Tickets,</span> we're not just a ticketing platform - we're your gateway to extraordinary events and unforgettable moments. Whether you're an event organizer looking for advanced tools to drive ticket sales or a customer searching for exclusive perks, we bring the best of both worlds together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What is Included Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 mb-8 animate-fade-in">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center animate-pulse-soft">
              <span className="text-2xl text-primary-600 dark:text-primary-400 font-bold">?</span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What is Included in Easy Tickets?
              </h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                From live music concerts and sports events to workshops, festivals, and beyond, Easy Tickets is here to connect you with the experiences you love or ones you'll fall in love with.
              </p>
            </div>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <div className="relative h-64 rounded-xl overflow-hidden group animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <img 
                src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80" 
                alt="Concert"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <span className="text-white font-semibold text-base">Concerts & Music</span>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden group animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <img 
                src="https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80" 
                alt="Sports"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <span className="text-white font-semibold text-base">Sports Events</span>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden group animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <img 
                src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80" 
                alt="Workshops"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <span className="text-white font-semibold text-base">Workshops</span>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden group animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <img 
                src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80" 
                alt="Festivals"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <span className="text-white font-semibold text-base">Festivals</span>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden group animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <img 
                src="https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80" 
                alt="Theater"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <span className="text-white font-semibold text-base">Theater & Plays</span>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden group animate-scale-in" style={{ animationDelay: '0.6s' }}>
              <img 
                src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80" 
                alt="More Events"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <span className="text-white font-semibold text-base">And Much More</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Do We Do This Section */}
      <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 mb-8 animate-fade-in">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center animate-pulse-soft">
              <span className="text-2xl text-primary-600 dark:text-primary-400 font-bold">?</span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Why do We do This?
              </h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-4xl">
                We make event management seamless and attending events effortless. Our app-only perks, cutting-edge features, and premium marketing support ensure organizers and attendees get the best value every step of the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-3 animate-pulse-soft">
              <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              What Makes us Different?
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We make event management seamless and attending events effortless. Our app-only perks, cutting-edge features, and premium marketing support ensure organizers and attendees get the best value every step of the way.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 group hover:shadow-md transition-all transform hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                  <Headphones className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    Tailored Event Consultation Services
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Expert guidance to make your event a success from planning to execution.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 group hover:shadow-md transition-all transform hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    Expert Event Staffing
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Professional staff to ensure your event runs smoothly and efficiently.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 group hover:shadow-md transition-all transform hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <Megaphone className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    Premium Marketing Support
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Comprehensive marketing solutions to maximize your event's reach and ticket sales.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 group hover:shadow-md transition-all transform hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <Wrench className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    Technical Support & Setup
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Full technical assistance for seamless event operations and management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            So, whether you're looking to plan your event or just plan your weekend, Easy Tickets has your back.
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Let's create moments & memories. Let's Easy Tickets.
          </p>
        </div>
      </section>
    </div>
  )
}

export default AboutUs

