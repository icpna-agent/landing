import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, MessageCircle, PlayCircle, Image as ImageIcon, Zap, Clock, Smartphone, Star, Menu, X } from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
const MONTHLY_PLAN_PRICE = 5;
const WHATSAPP_AGENT_NUMBER = '51936081148';
const WHATSAPP_AGENT_URL = `https://wa.me/${WHATSAPP_AGENT_NUMBER}`;
const normalizePhoneForEngine = (value = '') => value.replace(/[^\d]/g, '');
const AUTH_REDIRECT = '/#planes';
const buildAuthUrl = (mode = 'login') => `/auth?mode=${mode}&redirect=${encodeURIComponent(AUTH_REDIRECT)}`;

// ==========================================
// COMPONENTES REUTILIZABLES & ANIMACIONES
// ==========================================
const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const Navbar = ({ authUser, onPay }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          {/* Contenedor del logo más grande (h-12) y ancho automático */}
          <div className="h-7 flex items-center justify-center group-hover:scale-105 transition-transform">
            <img src="/logo_completo.avif" alt="Logo ICPNA" className="h-full w-auto object-contain drop-shadow-sm" />
          </div>
          
          {/* Solo el texto Assistant en azul */}
          <span className="font-bold text-2xl tracking-tight text-blue-600">Assistant</span>
        </Link>
        <div className="hidden md:flex gap-8 items-center font-medium text-sm text-slate-600">
          <a href="#beneficios" className="hover:text-slate-900 transition-colors">Beneficios</a>
          <a href="#demo" className="hover:text-slate-900 transition-colors">Demo</a>
          <a href="#planes" className="hover:text-slate-900 transition-colors">Planes</a>
          {authUser ? (
            <>
              <Link to="/dashboard" className="text-slate-900 hover:text-blue-600 transition-colors font-semibold">Mi cuenta</Link>
              <button onClick={onPay} className="bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5">
                Pagar S/. 5
              </button>
            </>
          ) : (
            <Link to={buildAuthUrl('login')} className="text-slate-900 hover:text-blue-600 transition-colors font-semibold">Iniciar Sesión</Link>
          )}
        </div>
        <button 
          className="md:hidden text-slate-900" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

// ==========================================
// PÁGINA 1: LANDING PAGE (Ruta: /)
// ==========================================
const LandingPage = () => {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [demoInput, setDemoInput] = useState('');
  const [demoChat, setDemoChat] = useState([
    { role: 'bot', text: '¡Hola! Escribe "audio 4.6", "corrige mi speaking" o "explícame present perfect".' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const getStoredToken = () => sessionStorage.getItem('authToken');

  const clearSession = () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('refreshToken');
    setAuthUser(null);
  };

  const loadSession = async () => {
    const token = getStoredToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || data.error || !data.body) {
        clearSession();
      } else {
        setAuthUser(data.body);
      }
    } catch (err) {
      clearSession();
    } finally {
      setCheckingSession(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [demoChat, isTyping]);

  const handlePay = async () => {
    const token = getStoredToken();

    if (!token || !authUser) {
      navigate(buildAuthUrl('login'));
      return;
    }

    setIsPaying(true);
    setPaymentMessage('');

    try {
      const paymentResponse = await fetch(`${BACKEND_URL}/payment/make-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'ICPNA Assistant - Suscripción mensual',
          price: MONTHLY_PLAN_PRICE,
          unit: 'PEN',
          img: `${window.location.origin}/logo_completo.avif`,
          user: authUser.user,
          phone: authUser.phone,
        }),
      });

      const paymentData = await paymentResponse.json();
      const checkoutUrl = paymentData?.body?.mpLink;

      if (paymentResponse.status === 401) {
        clearSession();
        navigate(buildAuthUrl('login'));
        return;
      }

      if (!paymentResponse.ok || paymentData.error || !checkoutUrl) {
        setPaymentMessage(paymentData?.message || 'No se pudo iniciar el pago. Intenta de nuevo.');
        return;
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      setPaymentMessage('Error de conexión al iniciar el pago.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    if (!demoInput.trim()) return;
    
    setDemoChat(prev => [...prev, { role: 'user', text: demoInput }]);
    setDemoInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setDemoChat(prev => [...prev, { 
        role: 'bot', 
        text: '🎧 Procesando tu solicitud... \n\n(Esto es un mock. En el producto real aquí recibirías el audio, corrección o explicación precisa de ICPNA).' 
      }]);
    }, 1500);
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans selection:bg-blue-200">
      <Navbar authUser={authUser} onPay={handlePay} />

      {/* SECCIÓN 1: HERO */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span></span>
            IA Educativa en WhatsApp
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
            Todo tu curso dentro de <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600">WhatsApp.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
            Escucha audios, revisa ejercicios y practica speaking sin abrir la laptop. El valor de tu material, ahora en tu bolsillo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => authUser ? handlePay() : navigate(buildAuthUrl('login'))} className="bg-blue-600 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 flex justify-center items-center gap-2 group">
              {authUser ? 'Pagar suscripción S/ 5' : 'Inicia sesión para activar'}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#demo" className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full text-base font-semibold hover:bg-slate-50 transition-all flex justify-center items-center">
              Ver cómo funciona
            </a>
          </div>
        </FadeIn>

        {/* Mockup WhatsApp Visual Obligatorio */}
        <FadeIn delay={0.2} className="flex justify-center lg:justify-end relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-emerald-100 rounded-full blur-3xl opacity-40 scale-150"></div>
          <div className="w-[320px] bg-slate-900 rounded-[3rem] p-2 shadow-2xl relative z-10 border-[6px] border-slate-800">
            <div className="bg-[#efeae2] w-full h-[600px] rounded-[2.5rem] overflow-hidden flex flex-col relative">
              <div className="bg-[#004739] text-white px-4 py-3 flex items-center gap-3 pt-8 shadow-sm z-10">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center"><MessageCircle size={20} className="text-[#008069]" /></div>
                <div><p className="font-semibold text-sm leading-tight">ICPNA Assistant</p><p className="text-[10px] opacity-80">en línea</p></div>
              </div>
              <div className="flex-1 p-4 space-y-4 bg-[url('https://i.pinimg.com/originals/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover opacity-90 flex flex-col">
                <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.5}} className="bg-[#d9fdd3] p-3 rounded-xl rounded-tr-none self-end max-w-[85%] text-sm shadow-sm text-slate-800">
                  Pásame el audio de la página 32
                </motion.div>
                <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay:1.5}} className="bg-white p-3 rounded-xl rounded-tl-none self-start max-w-[90%] text-sm shadow-sm text-slate-800 space-y-2">
                  <p>🎧 <b>Audio 4.6 enviado.</b></p>
                  <div className="bg-slate-100 p-2 rounded flex items-center gap-2"><PlayCircle size={16} className="text-slate-500"/><div className="h-1 bg-slate-300 w-full rounded-full"><div className="h-1 bg-blue-500 w-1/3 rounded-full"></div></div></div>
                  <p className="text-xs text-slate-500 border-l-2 border-blue-500 pl-2">📝 <b>Transcript:</b> "Hello, welcome to..."</p>
                </motion.div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* SECCIÓN 2 — PROBLEMA */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn><h2 className="text-3xl font-bold text-center mb-16 text-slate-900">La forma de estudiar cambió.</h2></FadeIn>
          <div className="grid md:grid-cols-2 gap-8">
            <FadeIn delay={0.1} className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-500 mb-6 flex items-center gap-2"><X size={20} className="text-red-500"/> Método tradicional</h3>
              <ul className="space-y-4 text-slate-600 text-sm">
                <li className="flex gap-3">❌ <span>Buscar audios navegando por carpetas web.</span></li>
                <li className="flex gap-3">❌ <span>Depender de abrir la laptop para estudiar.</span></li>
                <li className="flex gap-3">❌ <span>No tener feedback real al practicar speaking solo.</span></li>
              </ul>
            </FadeIn>
            <FadeIn delay={0.2} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 blur-[80px] opacity-30"></div>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><CheckCircle size={20} className="text-green-400"/> ICPNA Assistant</h3>              <ul className="space-y-4 text-slate-300 text-sm">
                <li className="flex gap-3"><span className="text-green-400">✅</span> <span>Todo directamente desde WhatsApp.</span></li>
                <li className="flex gap-3"><span className="text-green-400">✅</span> <span>Respuesta inmediata en menos de 3 segundos.</span></li>
                <li className="flex gap-3"><span className="text-green-400">✅</span> <span>Estudio 100% móvil y ergonómico.</span></li>
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3 — BENEFICIOS (Storytelling) */}
      <section id="beneficios" className="py-24 max-w-7xl mx-auto px-6">
        <FadeIn><h2 className="text-3xl font-bold mb-12 text-slate-900 tracking-tight">Diseñado para la vida real</h2></FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Smartphone/>, title: "Estudia en transporte", desc: "Aprovecha el bus. Pide audios y escúchalos sin gastar datos en webs pesadas." },
            { icon: <Clock/>, title: "Estudia fuera de horario", desc: "Son las 11 PM y tienes dudas. El bot no duerme, te responde al instante." },
            { icon: <MessageCircle/>, title: "Practica speaking", desc: "Envía una nota de voz y recibe feedback fonético al momento." },
            { icon: <ImageIcon/>, title: "Consulta ejercicios", desc: "Tómale foto a la página que no entiendes y recibe el solucionario guiado." }
          ].map((item, i) => (
            <FadeIn key={i} delay={i * 0.1} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow group cursor-pointer">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">{item.icon}</div>
              <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* SECCIÓN 5 — DEMO INTERACTIVA */}
      <section id="demo" className="py-24 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <h2 className="text-3xl font-bold mb-6">Pruébalo ahora</h2>
            <p className="text-slate-400 mb-8 font-light">Simula una conversación real. Escribe un mensaje o usa las sugerencias.</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['audio 4.6', 'corrige mi speaking', 'explícame present perfect'].map(tag => (
                <button key={tag} onClick={() => setDemoInput(tag)} className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium border border-white/5 transition-colors">
                  "{tag}"
                </button>
              ))}
            </div>
          </FadeIn>
          
          <FadeIn delay={0.2} className="bg-[#0b141a] rounded-[2rem] border border-slate-700 shadow-2xl h-[450px] flex flex-col overflow-hidden">
            <div className="bg-[#202c33] p-4 font-semibold text-sm flex items-center gap-3 border-b border-slate-700"><div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs">IA</div> Demo Interactiva</div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {demoChat.map((msg, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-[#005c4b] text-white self-end ml-auto rounded-tr-none' : 'bg-[#202c33] text-slate-200 self-start mr-auto rounded-tl-none whitespace-pre-wrap'}`}>
                  {msg.text}
                </div>
              ))}
              {isTyping && <div className="bg-[#202c33] p-3 rounded-lg w-16 text-slate-400 text-xs flex gap-1 rounded-tl-none"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></div></div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleDemoSubmit} className="bg-[#202c33] p-3 flex gap-2">
              <input type="text" value={demoInput} onChange={(e) => setDemoInput(e.target.value)} placeholder="Escribe tu mensaje..." aria-label="Mensaje para el bot" className="flex-1 bg-[#2a3942] text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <button type="submit" aria-label="Enviar mensaje" className="bg-blue-600 p-2 rounded-full text-white hover:bg-blue-500 transition-colors"><ArrowRight size={20}/></button>
            </form>
          </FadeIn>
        </div>
      </section>

      {/* SECCIÓN 6 — CAPACIDADES & 8 COMPARACIÓN */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
          <FadeIn>
            <h3 className="text-2xl font-bold mb-8">El motor detrás del bot</h3>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 flex items-center justify-between">
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-xl shadow-sm text-sm font-medium border border-slate-100">📝 Texto</div>
                <div className="bg-white p-3 rounded-xl shadow-sm text-sm font-medium border border-slate-100">🎙️ Audio</div>
                <div className="bg-white p-3 rounded-xl shadow-sm text-sm font-medium border border-slate-100">📷 Imagen</div>
              </div>
              <ArrowRight className="text-blue-500" size={32} />
              <div className="bg-slate-900 text-white p-6 rounded-2xl font-bold text-center shadow-lg"><Zap className="mx-auto mb-2 text-yellow-400"/> IA Engine</div>
              <ArrowRight className="text-blue-500" size={32} />
              <div className="space-y-4">
                <div className="bg-blue-50 text-blue-700 p-3 rounded-xl shadow-sm text-sm font-bold border border-blue-100">Respuestas</div>
                <div className="bg-blue-50 text-blue-700 p-3 rounded-xl shadow-sm text-sm font-bold border border-blue-100">Audios IA</div>
                <div className="bg-blue-50 text-blue-700 p-3 rounded-xl shadow-sm text-sm font-bold border border-blue-100">Solucionarios</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h3 className="text-2xl font-bold mb-8">Comparación</h3>
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm text-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr><th className="p-4">Característica</th><th className="p-4 text-center">Tradicional</th><th className="p-4 text-center text-blue-600 bg-blue-50/50">Asistente</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr><td className="p-4 font-medium">Tiempo de respuesta</td><td className="p-4 text-center text-slate-400">Minutos navegando</td><td className="p-4 text-center font-bold bg-blue-50/50 text-slate-900">&lt; 3 seg</td></tr>
                  <tr><td className="p-4 font-medium">Movilidad</td><td className="p-4 text-center text-slate-400">Requiere PC</td><td className="p-4 text-center font-bold bg-blue-50/50 text-slate-900">100% Móvil</td></tr>
                  <tr><td className="p-4 font-medium">Práctica de Speaking</td><td className="p-4 text-center text-slate-400">Nula</td><td className="p-4 text-center font-bold bg-blue-50/50 text-slate-900">Voz a Voz</td></tr>
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SECCIÓN 9 — PLAN / PRICING */}
      <section id="planes" className="py-24 bg-slate-50">
        <div className="max-w-lg mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Suscripción Simple</h2>
            <p className="text-slate-600 mb-10">Menos de S/. 0.17 por día. Cancela cuando quieras.</p>
            
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 relative">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-[2.5rem]"></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Plan Único</h3>
              <div className="flex justify-center items-end gap-1 mb-8">
                <span className="text-6xl font-extrabold text-slate-900">S/.5</span><span className="text-lg text-slate-500 mb-2">/mes</span>
              </div>
              
              <ul className="space-y-4 text-sm text-slate-600 text-left mb-10 w-max mx-auto">
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-green-500"/> Acceso total vía WhatsApp</li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-green-500"/> Historial en Dashboard web</li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-green-500"/> Soporte técnico 24/7</li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-green-500"/> Activación inmediata</li>
              </ul>
              
              {checkingSession ? (
                <button disabled className="w-full py-4 bg-slate-300 text-white rounded-xl font-bold cursor-not-allowed">
                  Revisando sesión...
                </button>
              ) : authUser ? (
                <button onClick={handlePay} disabled={isPaying} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isPaying ? 'Preparando pago...' : 'Pagar suscripción'} <ArrowRight size={18} />
                </button>
              ) : (
                <div className="space-y-3">
                  <button onClick={() => navigate(buildAuthUrl('login'))} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg flex justify-center items-center gap-2">
                    Iniciar sesión para pagar <ArrowRight size={18} />
                  </button>
                  <button onClick={() => navigate(buildAuthUrl('register'))} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                    Crear cuenta nueva
                  </button>
                </div>
              )}
              {paymentMessage && <p className="mt-4 text-sm text-red-600">{paymentMessage}</p>}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SECCIÓN 11 — CTA FINAL */}
      <section className="py-24 bg-blue-600 text-center">
        <FadeIn className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold text-white mb-6">Empieza hoy.</h2>
          <p className="text-blue-100 text-xl mb-10 font-light">Deja de buscar materiales. Empieza a aprender.</p>
          <button onClick={() => authUser ? handlePay() : navigate(buildAuthUrl('login'))} className="bg-white text-slate-900 px-10 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition-transform">
            {authUser ? 'Pagar ahora' : 'Iniciar sesión o crear cuenta'}
          </button>
        </FadeIn>
      </section>
      
      <footer className="bg-slate-950 py-10 text-center text-slate-500 text-sm">
        <p>Frontend Mockup - ICPNA Assistant 2026. Proyecto Universitario.</p>
      </footer>
    </div>
  );
};

// ==========================================
// PÁGINA 2: AUTH (Ruta: /auth)
// ==========================================
const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [authMode, setAuthMode] = useState(initialMode);
  const [user, setUser] = useState('');
  const [mail, setMail] = useState('');
  const [phone, setPhone] = useState('');
  const [pswd, setPswd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const redirectTo = searchParams.get('redirect') || AUTH_REDIRECT;

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setSearchParams({ mode, redirect: redirectTo });
    setMessage('');
  };

  const storeTokens = (data) => {
    sessionStorage.setItem('authToken', data.body.token);
    sessionStorage.setItem('refreshToken', data.body.refresh || '');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (authMode === 'login') {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user,
            pswd,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          setMessage(data?.message || 'Usuario o contraseña incorrectos.');
          return;
        }

        if (data.body?.token) {
          storeTokens(data);
          navigate(redirectTo);
        } else {
          setMessage('Login correcto, pero no se recibió token.');
        }
      } catch (err) {
        setMessage('Error de conexión. Intenta de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }

      return;
    }

    try {
      if (!phone || !isValidPhoneNumber(phone)) {
        setMessage('Ingresa un número de WhatsApp válido.');
        setIsLoading(false);
        return;
      }

      const normalizedPhone = normalizePhoneForEngine(phone);

      const response = await fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user,
          pswd,
          phone: normalizedPhone,
          mail,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setMessage(data?.message || 'Error al registrar la cuenta.');
        setIsLoading(false);
        return;
      }

      if (data.body?.token) {
        storeTokens(data);
        navigate(redirectTo);
      } else {
        setMessage('Registro completado, pero no se recibió token.');
      }
    } catch (err) {
      setMessage('Error de conexión. Intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <FadeIn className="w-full max-w-md sm:max-w-lg">
        <div className="bg-white/85 backdrop-blur border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/70 px-6 py-8 sm:px-10 sm:py-10">
          <div className="mb-8">
            <Link to="/" aria-label="Ir a la página de inicio" className="flex justify-center mb-6 text-blue-600"><MessageCircle size={40} /></Link>
            <h2 className="text-center text-3xl font-extrabold text-slate-900">
              {authMode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              {authMode === 'login' ? 'Entra a tu dashboard de suscripción' : 'Para activar tu asistente en WhatsApp'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-bold">
            <button
              type="button"
              onClick={() => switchAuthMode('login')}
              className={`rounded-xl px-3 py-2 transition ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => switchAuthMode('register')}
              className={`rounded-xl px-3 py-2 transition ${authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Crear cuenta
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-slate-700">Usuario</label>
              <input
                id="user"
                type="text"
                name="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                className="mt-1 appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="usuario"
              />
            </div>
            {authMode === 'register' && (
              <>
                <div>
                  <label htmlFor="mail" className="block text-sm font-medium text-slate-700">Email institucional o personal</label>
                  <input
                    id="mail"
                    type="email"
                    name="mail"
                    value={mail}
                    onChange={(e) => setMail(e.target.value)}
                    required={authMode === 'register'}
                    className="mt-1 appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder="alumno@utp.edu.pe"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Teléfono (WhatsApp)</label>
                  <PhoneInput
                    id="phone"
                    name="phone"
                    international
                    defaultCountry="PE"
                    countryCallingCodeEditable={false}
                    value={phone}
                    onChange={(value) => setPhone(value || '')}
                    required={authMode === 'register'}
                    className="phone-input mt-1"
                    placeholder="929 073 820"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Se guardará sin símbolos: {phone ? normalizePhoneForEngine(phone) : '51929073820'}
                  </p>
                </div>
              </>
            )}
            <div>
              <label htmlFor="pswd" className="block text-sm font-medium text-slate-700">Contraseña</label>
              <input
                id="pswd"
                type="password"
                name="pswd"
                value={pswd}
                onChange={(e) => setPswd(e.target.value)}
                required
                className="mt-1 appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>
            {message && <p className="text-sm text-red-600">{message}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </FadeIn>
    </div>
  );
};

// ==========================================
// PÁGINA 3: SUCCESS (Ruta: /success)
// ==========================================
const SuccessPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-6">
      <FadeIn className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-500" size={40} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">¡Pago exitoso!</h2>
        <p className="text-slate-600 mb-8">Tu suscripción está activa. El número de WhatsApp ha sido habilitado en nuestro motor.</p>
        <Link to="/dashboard" className="w-full block bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md">
          Ir a mi Dashboard
        </Link>
      </FadeIn>
    </div>
  );
};

// ==========================================
// PÁGINA 4: DASHBOARD (Ruta: /dashboard)
// ==========================================
const DashboardPage = () => {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [meError, setMeError] = useState('');

  const refreshTokens = async (refreshToken) => {
    try {
      const refreshResponse = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (!refreshResponse.ok) {
        return null;
      }

      const refreshData = await refreshResponse.json();
      if (refreshData.error || !refreshData.body?.token) {
        return null;
      }

      sessionStorage.setItem('authToken', refreshData.body.token);
      sessionStorage.setItem('refreshToken', refreshData.body.refresh || '');
      return refreshData.body;
    } catch (err) {
      return null;
    }
  };

  const loadProfile = async () => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      setMeError('No se encontró el token de autenticación.');
      setLoadingMe(false);
      return;
    }

    try {
      let response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (!refreshToken) {
          setMeError('Sesión expirada. Por favor, regresa y crea tu cuenta de nuevo.');
          setLoadingMe(false);
          return;
        }

        const refreshed = await refreshTokens(refreshToken);
        if (!refreshed) {
          setMeError('No se pudo renovar la sesión. Intenta nuevamente.');
          setLoadingMe(false);
          return;
        }

        response = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${refreshed.token}`,
          },
        });
      }

      const data = await response.json();
      if (!response.ok || data.error) {
        setMeError(data?.message || 'No se pudo obtener los datos del usuario.');
      } else {
        setMe(data.body);
      }
    } catch (err) {
      setMeError('Error de conexión al recuperar el perfil.');
    } finally {
      setLoadingMe(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 h-8">
          <img src="/logo_completo.avif" alt="Logo ICPNA" className="h-full w-auto object-contain" />
          <span className="font-bold text-lg text-blue-600">Assistant</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">AI</div>
          <span className="text-sm font-medium text-slate-700">{me?.user || 'Usuario'}</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <FadeIn>
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Mi Suscripción</h1>
        </FadeIn>

        {loadingMe ? (
          <FadeIn>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-slate-600">Cargando perfil...</div>
          </FadeIn>
        ) : meError ? (
          <FadeIn>
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm text-red-700">{meError}</div>
          </FadeIn>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Card Estado */}
            <FadeIn delay={0.1} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-2">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Estado de la cuenta</h3>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
                    <span className="text-2xl font-bold text-slate-900">Activo</span>
                  </div>
                </div>
                <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-600">Plan: S/. 5/mes</div>
              </div>
              <p className="text-sm text-slate-600 mb-6">Tu número {me?.phone || '+51 987 654 321'} está vinculado y autorizado en el motor de IA.</p>
            </FadeIn>

            {/* Card Quick Action */}
            <FadeIn delay={0.2} className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-center items-center text-center">
              <MessageCircle size={40} className="mb-4 opacity-80" />
              <h3 className="font-bold mb-2">Hablar con el Bot</h3>
              <p className="text-xs text-blue-100 mb-4">Abre WhatsApp para empezar a practicar.</p>
              <a
                href={WHATSAPP_AGENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-6 py-2 rounded-full text-sm font-bold w-full hover:bg-blue-50 transition"
              >
                Abrir WhatsApp
              </a>
            </FadeIn>
          </div>
        )}

        <FadeIn delay={0.3}>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Historial de Pagos</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr><th className="p-4">Fecha</th><th className="p-4">Monto</th><th className="p-4">Estado</th><th className="p-4">Factura</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr><td className="p-4">12 Jun 2026</td><td className="p-4 font-medium">S/. 5.00</td><td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Pagado</span></td><td className="p-4 text-slate-400">No disponible</td></tr>
              </tbody>
            </table>
          </div>
        </FadeIn>
      </main>
    </div>
  );
};

// ==========================================
// ENRUTADOR PRINCIPAL
// ==========================================
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}
