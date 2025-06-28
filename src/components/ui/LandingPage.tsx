import React, { useState, useEffect, useRef } from 'react';
import { FileText, Zap, Target, MessageSquare, ArrowRight, Upload, Download, Edit3, Brain, Sparkles, Database, Cpu, Eye, TrendingUp, Shield, Rocket } from 'lucide-react';

interface LandingPageProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export default function LandingPage({ onSignIn, onGetStarted }: LandingPageProps = {}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [typingText, setTypingText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  type FloatingElement = { id: number; x: number; y: number; delay: number; duration: number };
  const [floatingElements, setFloatingElements] = useState<FloatingElement[]>([]);

  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  const typingTexts = [
    'Tailored Resumes',
    'Cover Letters',
    'Interview Questions',
    'Career Success'
  ];

  // Mouse tracking for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Typing animation
  useEffect(() => {
    const currentText = typingTexts[currentTextIndex];
    let i = 0;
    const timer = setInterval(() => {
      if (i <= currentText.length) {
        setTypingText(currentText.slice(0, i));
        i++;
      } else {
        setTimeout(() => {
          setCurrentTextIndex((prev) => (prev + 1) % typingTexts.length);
          setTypingText('');
        }, 2000);
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [currentTextIndex]);

  // Enhanced intersection observer for multiple sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '-50px 0px'
      }
    );

    // Observe all sections
    Object.values(sectionsRef.current).forEach(section => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Generate floating elements
  useEffect(() => {
    const elements = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 15 + Math.random() * 10
    }));
    setFloatingElements(elements);
  }, []);

  const techSpecs = [
    { icon: Brain, label: 'Neural Networks', value: '99.7%', desc: 'Accuracy Rate' },
    { icon: Database, label: 'Training Data', value: '50M+', desc: 'Job Postings' },
    { icon: Cpu, label: 'Processing Speed', value: '0.3s', desc: 'Average Time' },
    { icon: Shield, label: 'Success Rate', value: '94%', desc: 'Interview Rate' }
  ];

  const aiInsights = [
    { title: 'Natural Language Processing', desc: 'Advanced NLP algorithms analyze job descriptions and optimize your resume keywords for ATS systems', progress: 95 },
    { title: 'Semantic Matching', desc: 'Our AI understands context and meaning, not just keywords, ensuring perfect job-resume alignment', progress: 88 },
    { title: 'Industry Intelligence', desc: 'Trained on millions of successful applications across 500+ industries and job roles', progress: 92 },
    { title: 'Continuous Learning', desc: 'Self-improving algorithms that adapt to hiring trends and market changes in real-time', progress: 97 }
  ];

  const features = [
    { icon: Edit3, title: 'Neural Resume Enhancement', desc: 'AI analyzes 47 data points to optimize your resume', color: 'blue' },
    { icon: FileText, title: 'Dynamic Cover Letters', desc: 'Personalized using GPT-4 and job-specific training', color: 'purple' },
    { icon: Target, title: 'ATS Optimization', desc: '99.7% pass rate with applicant tracking systems', color: 'cyan' },
    { icon: MessageSquare, title: 'Interview Intelligence', desc: 'AI-generated questions from 10,000+ interviews', color: 'green' }
  ];

  const processSteps = [
    { icon: Upload, title: '1. Document Ingestion', desc: 'Advanced OCR and NLP extract every detail from your resume', color: 'from-blue-500 to-purple-500' },
    { icon: Brain, title: '2. AI Analysis', desc: 'Neural networks process 47 optimization vectors simultaneously', color: 'from-purple-500 to-pink-500' },
    { icon: Download, title: '3. Intelligent Output', desc: 'Generate ATS-optimized documents with 94% interview success rate', color: 'from-pink-500 to-cyan-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Interactive background with mouse tracking */}
      <div className="absolute inset-0">
        <div 
          className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: `${mousePosition.x / 10}px`,
            top: `${mousePosition.y / 10}px`,
            transform: 'translate(-50%, -50%)'
          }}
        ></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Floating particles */}
        {floatingElements.map((element) => (
          <div
            key={element.id}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              animationDelay: `${element.delay}s`,
              animationDuration: `${element.duration}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with glassmorphism */}
        <header className="p-6 backdrop-blur-md bg-white/5 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center relative">
                <FileText className="w-5 h-5 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-xl font-bold text-white">AscendlyAI</span>
              <div className="hidden md:flex ml-4 px-3 py-1 bg-green-500/20 rounded-full text-green-400 text-xs font-semibold">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                LIVE
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onSignIn}
                className="cursor-pointer px-2 py-1 text-[14px] md:text-lg md:px-4 md:py-2 text-white/80 hover:text-white transition-all duration-300 hover:scale-105"
              >
                Sign In
              </button>
              <button 
                onClick={onGetStarted}
                className="cursor-pointer px-2 py-1 text-[14px] md:text-lg md:px-4 md:py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-6xl mx-auto text-center">
            {/* Main hero card with advanced animations */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-12 mb-12 shadow-2xl relative overflow-hidden group">
              {/* Animated border gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-1000"></div>
              
              <div className="relative z-10">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-6 shadow-lg relative group-hover:scale-110 transition-transform duration-500">
                    <div className="w-16 h-16 border-4 border-white/30 rounded-xl flex items-center justify-center">
                      <Zap className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    {/* Rotating ring */}
                    <div className="absolute inset-0 border-2 border-transparent border-t-blue-400 border-r-purple-400 rounded-2xl animate-spin"></div>
                  </div>
                  
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                    AI-Powered
                    <br />
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                      {typingText}
                      <span className="animate-blink">|</span>
                    </span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-8">
                    Powered by cutting-edge machine learning algorithms that have analyzed over 
                    <span className="text-cyan-400 font-semibold"> 50 million job applications</span> to craft 
                    documents that get you hired.
                  </p>
                  
                  {/* Live stats ticker */}
                  <div className="flex justify-center space-x-8 mb-8">
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-green-400">2,847</div>
                      <div className="text-xs text-white/60">Jobs landed today</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-blue-400">98.7%</div>
                      <div className="text-xs text-white/60">ATS pass rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-purple-400">0.3s</div>
                      <div className="text-xs text-white/60">Processing time</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={onGetStarted}
                    className="cursor-pointer px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center space-x-2 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <Rocket className="w-3 h-3 md:w-5 md:h-5" />
                    <span>Launch Your Career</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tech Specs Section with scroll animation */}
            <div 
              id="tech-specs"
              ref={el => { sectionsRef.current['tech-specs'] = el; }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
            >
              {techSpecs.map((spec, index) => (
                <div 
                  key={index} 
                  className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 group relative overflow-hidden transform ${
                    visibleSections.has('tech-specs') 
                      ? 'translate-y-0 opacity-100' 
                      : 'translate-y-10 opacity-0'
                  }`}
                  style={{ 
                    transitionDelay: visibleSections.has('tech-specs') ? `${index * 150}ms` : '0ms',
                    transitionDuration: '800ms'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <spec.icon className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-125 transition-transform duration-300" />
                    <div className="text-2xl font-bold text-white mb-1">{spec.value}</div>
                    <div className="text-xs text-white/60 mb-1">{spec.desc}</div>
                    <div className="text-xs text-white/40">{spec.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Insights Section with enhanced scroll animation */}
            <div 
              id="ai-insights"
              ref={el => { sectionsRef.current['ai-insights'] = el; }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-12 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"></div>
              
              <div className={`flex items-center justify-center mb-8 transform transition-all duration-800 ${
                visibleSections.has('ai-insights') 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-5 opacity-0'
              }`}>
                <Brain className="w-8 h-8 text-purple-400 mr-3" />
                <h2 className="text-lg md:text-3xl font-bold text-white">AI Technology Deep Dive</h2>
                <Sparkles className="w-6 h-6 text-yellow-400 ml-3 animate-pulse" />
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {aiInsights.map((insight, index) => (
                  <div 
                    key={index} 
                    className={`transform transition-all duration-1000 ${
                      visibleSections.has('ai-insights') 
                        ? 'translate-y-0 opacity-100 scale-100' 
                        : 'translate-y-10 opacity-0 scale-95'
                    }`}
                    style={{ 
                      transitionDelay: visibleSections.has('ai-insights') ? `${200 + index * 200}ms` : '0ms'
                    }}
                  >
                    <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 border border-white/10 group hover:scale-105 hover:shadow-2xl">
                      <h3 className="text-sm md:text-lg font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">
                        {insight.title}
                      </h3>
                      <p className="text-white/70 text-[14px] md:text-sm mb-4 leading-relaxed">{insight.desc}</p>
                      
                      {/* Animated progress bar */}
                      <div className="relative">
                        <div className="flex justify-between text-xs text-white/60 mb-2">
                          <span>Capability</span>
                          <span>{insight.progress}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-2000 ease-out"
                            style={{ 
                              width: visibleSections.has('ai-insights') ? `${insight.progress}%` : '0%',
                              transitionDelay: `${500 + index * 200}ms`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Features Grid with staggered animation */}
            <div 
              id="features-grid"
              ref={(el) => { sectionsRef.current['features-grid'] = el; }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            >
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 group relative overflow-hidden transform ${
                    visibleSections.has('features-grid') 
                      ? 'translate-y-0 opacity-100 rotate-0' 
                      : 'translate-y-12 opacity-0 rotate-1'
                  }`}
                  style={{ 
                    transitionDelay: visibleSections.has('features-grid') ? `${index * 100}ms` : '0ms',
                    transitionDuration: '700ms'
                  }}
                >
                  {/* Hover effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  <div className="relative z-10">
                    <div className={`w-8 h-8 md:w-12 md:h-12 bg-${feature.color}-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 relative`}>
                      <feature.icon className={`w-5 h-5 md:w-6 md:h-6 text-${feature.color}-400`} />
                      <div className={`absolute inset-0 border-2 border-${feature.color}-500/30 rounded-xl animate-ping group-hover:animate-none`}></div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
                    
                    {/* Performance indicator */}
                    <div className="mt-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400 font-semibold">High Performance</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced How it works with complex animations */}
            <div 
              id="process-section"
              ref={el => { sectionsRef.current['process-section'] = el; }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5"></div>
              
              <div className="relative z-10">
                <h2 className={`text-lg md:text-3xl font-bold text-white mb-8 flex items-center justify-center transform transition-all duration-800 ${
                  visibleSections.has('process-section') 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-5 opacity-0'
                }`}>
                  <Cpu className="w-8 h-8 mr-3 text-blue-400" />
                  Neural Processing Pipeline
                </h2>
                
                <div className="grid md:grid-cols-3 gap-8 relative">
                  {processSteps.map((step, index) => (
                    <div 
                      key={index} 
                      className={`text-center group transform transition-all duration-1000 ${
                        visibleSections.has('process-section') 
                          ? 'translate-y-0 opacity-100 scale-100' 
                          : 'translate-y-16 opacity-0 scale-90'
                      }`}
                      style={{ 
                        transitionDelay: visibleSections.has('process-section') ? `${300 + index * 200}ms` : '0ms'
                      }}
                    >
                      <div className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 relative group-hover:scale-110 transition-transform duration-500 shadow-lg group-hover:shadow-2xl`}>
                        <step.icon className="w-10 h-10 text-white" />
                        {/* Rotating border */}
                        <div className="absolute inset-0 border-2 border-white/30 rounded-2xl animate-spin group-hover:animate-none transition-all duration-500"></div>
                        {/* Pulse effect */}
                        <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                      </div>
                      
                      <h3 className="text-lg md:text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">{step.desc}</p>
                      
                      {/* Connection line (except for last item) */}
                      {index < processSteps.length - 1 && (
                        <div className={`hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-white/30 to-transparent transform translate-y-10 transition-all duration-1000 ${
                          visibleSections.has('process-section') ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                        }`}
                        style={{ transitionDelay: `${800 + index * 200}ms` }}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Enhanced Footer */}
        <footer 
          id="footer-section"
          ref={el => { sectionsRef.current['footer-section'] = el; }}
          className="p-6 text-center bg-white/5 backdrop-blur-md border-t border-white/10"
        >
          <div className={`max-w-4xl mx-auto transform transition-all duration-800 ${
            visibleSections.has('footer-section') 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-5 opacity-0'
          }`}>
            <div className="flex items-center justify-center mb-4">
              <span className="text-white/80 text-[16px]">Join numerous professionals who've accelerated their careers</span>
            </div>
            
            <p className="text-white/60 text-lg mb-4">
              Ready to experience the future of job applications?
            </p>
            
            <button
              onClick={onGetStarted}
              className="cursor-pointer inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Sparkles className="w-5 h-5" />
              <span>Start Your Transformation</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </div>

      {/* Enhanced Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        @keyframes slideInRotate {
          from {
            opacity: 0;
            transform: translateY(20px) rotate(5deg) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-blink {
          animation: blink 1s infinite;
        }
        
        .animate-slide-in-rotate {
          animation: slideInRotate 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}