import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ProductCatalog from './components/ProductCatalog';
import CheckoutDrawer, { type CartItem, type PlacedOrder } from './components/CheckoutDrawer';
import AdditionalServices from './components/AdditionalServices';
import NoticeBoard from './components/NoticeBoard';
import CareersSection from './components/CareersSection';
import ContactSection from './components/ContactSection';
import NewsletterSection from './components/NewsletterSection';
import PrivacyPolicyModal, { PrivacyPolicyContent } from './components/PrivacyPolicyModal';
import { initTursoDatabase } from '../lib/turso';
import { saveOrder } from '../services/orderService';
import {
  ChevronRight,
  Sparkles,
  Search,
  ArrowLeft,
} from 'lucide-react';
import heroVideo from '../assets/hero.mp4';
import heroWebm from '../assets/hero.webm';
import heroPoster from '../assets/hero-poster.jpg';
import logoImg from '../assets/logo.png';
import '../styles/fonts.css';

export type ViewMode = 'inicio' | 'catalogo' | 'servicios' | 'avisos' | 'empleo' | 'contacto' | 'privacidad';

const getInitialView = (): ViewMode => {
  if (typeof window === 'undefined') return 'inicio';
  const path = window.location.pathname.toLowerCase();
  if (path.includes('catalogo')) return 'catalogo';
  if (path.includes('servicios')) return 'servicios';
  if (path.includes('avisos')) return 'avisos';
  if (path.includes('empleo')) return 'empleo';
  if (path.includes('contacto')) return 'contacto';
  if (path.includes('privacidad')) return 'privacidad';
  return 'inicio';
};

const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: 'prod-aguacate',
    name: 'Aguacate Hass de Exportación (1 kg)',
    price: 4900,
    originalPrice: 7000,
    qty: 1,
    unit: '1 kg',
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&q=80',
    category: 'Frutas y Verduras',
  },
  {
    id: 'prod-leche',
    name: 'Leche Entera Colanta de Granja (6 Litros)',
    price: 18900,
    qty: 1,
    unit: '6 Litros',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80',
    category: 'Lácteos',
  },
  {
    id: 'prod-arroz',
    name: 'Arroz Supremo Grano Entero (2.5 kg)',
    price: 11500,
    originalPrice: 13500,
    qty: 1,
    unit: '2.5 kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80',
    category: 'Abarrotes',
  },
];

export const App: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART_ITEMS);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>(getInitialView);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyModalTab, setPrivacyModalTab] = useState<'manual' | 'anexo1' | 'anexo2'>('manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [currentLocation, setCurrentLocation] = useState('Santa Rosa de Osos, Centro');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync active view with browser back/forward history
  useEffect(() => {
    const handlePopState = () => {
      setActiveView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateView = (view: ViewMode) => {
    setActiveView(view);
    const targetPath = view === 'inicio' ? '/' : `/${view}.html`;
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ view }, '', targetPath);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Guarantee cross-browser video background autoplay
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Handled gracefully without error popups
        });
      }
    }
  }, []);

  // Initialize Turso schema and seed data
  useEffect(() => {
    initTursoDatabase().catch(() => {});
  }, []);

  // Keyboard escape listener for modals/drawers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
        setIsPrivacyModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenPrivacyModal = (tab: 'manual' | 'anexo1' | 'anexo2' = 'manual') => {
    setPrivacyModalTab(tab);
    setIsPrivacyModalOpen(true);
  };

  const renderBreadcrumb = (sectionLabel: string) => (
    <div className="w-full bg-white border-b border-stone-200 py-3 px-4 sm:px-6 lg:px-8 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => handleNavigateView('inicio')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#5A3825] hover:text-[#F06522] transition-colors cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al Inicio</span>
        </button>
        <div className="text-xs text-stone-500 font-medium hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavigateView('inicio')}
            className="hover:text-stone-800 transition-colors cursor-pointer"
          >
            Supermercado Osos
          </button>
          <span>›</span>
          <span className="font-bold text-stone-800">{sectionLabel}</span>
        </div>
      </div>
    </div>
  );

  const handleAddToCart = (product: Omit<CartItem, 'qty'>) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`¡${product.name} agregado a tu canasta!`);
  };

  const handleUpdateQty = (id: number | string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (id: number | string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Producto retirado de la canasta');
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderPlaced = (order: PlacedOrder) => {
    saveOrder(order).catch(() => {});
    showToast(`¡Pedido ${order.orderNumber} confirmado! Tu mercado está en alistamiento.`);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const totalCartPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-stone-900 flex flex-col selection:bg-[#F06522] selection:text-white">
      {/* 1. Full-Width Edge-to-Edge Sticky Navbar */}
      <Navbar
        cartCount={totalCartCount}
        cartTotal={totalCartPrice}
        onOpenCart={() => setIsCartOpen(true)}
        onOrderClick={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentLocation={currentLocation}
        onLocationChange={setCurrentLocation}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenPrivacyPolicy={() => handleNavigateView('privacidad')}
        activeView={activeView}
        onNavigateView={handleNavigateView}
      />

      {/* Dynamic View Rendering (Dedicated Multi-Page / No Endless Scroll) */}
      {activeView === 'catalogo' && (
        <div className="flex-1 flex flex-col w-full animate-in fade-in duration-150">
          {renderBreadcrumb('Catálogo de Productos & 8 Pasillos')}
          <main className="flex-1 w-full bg-[#FAF8F5]">
            <ProductCatalog
              onAddToCart={handleAddToCart}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </main>
          <NewsletterSection onOpenPrivacyPolicy={() => handleOpenPrivacyModal('manual')} />
        </div>
      )}

      {activeView === 'servicios' && (
        <div className="flex-1 flex flex-col w-full animate-in fade-in duration-150">
          {renderBreadcrumb('Servicios Estratégicos')}
          <main className="flex-1 w-full bg-[#FAF8F5]">
            <AdditionalServices
              onSelectCategory={(catId) => {
                handleNavigateView('catalogo');
                setSelectedCategory(catId);
              }}
              onOpenCart={() => setIsCartOpen(true)}
              onContactClick={() => handleNavigateView('contacto')}
            />
          </main>
          <NewsletterSection onOpenPrivacyPolicy={() => handleOpenPrivacyModal('manual')} />
        </div>
      )}

      {activeView === 'avisos' && (
        <div className="flex-1 flex flex-col w-full animate-in fade-in duration-150">
          {renderBreadcrumb('Canal de Avisos & Novedades')}
          <main className="flex-1 w-full bg-[#FAF8F5]">
            <NoticeBoard />
          </main>
          <NewsletterSection onOpenPrivacyPolicy={() => handleOpenPrivacyModal('manual')} />
        </div>
      )}

      {activeView === 'empleo' && (
        <div className="flex-1 flex flex-col w-full animate-in fade-in duration-150">
          {renderBreadcrumb('¡Trabaja con nosotros!')}
          <main className="flex-1 w-full bg-[#FAF8F5]">
            <CareersSection onOpenPrivacyPolicy={handleOpenPrivacyModal} />
          </main>
          <NewsletterSection onOpenPrivacyPolicy={() => handleOpenPrivacyModal('manual')} />
        </div>
      )}

      {activeView === 'contacto' && (
        <div className="flex-1 flex flex-col w-full animate-in fade-in duration-150">
          {renderBreadcrumb('Comunícate con nosotros')}
          <main className="flex-1 w-full bg-[#FAF8F5]">
            <ContactSection onOpenPrivacyPolicy={() => handleOpenPrivacyModal('manual')} />
          </main>
          <NewsletterSection onOpenPrivacyPolicy={() => handleOpenPrivacyModal('manual')} />
        </div>
      )}

      {activeView === 'privacidad' && (
        <div className="flex-1 flex flex-col w-full animate-in fade-in duration-150">
          {renderBreadcrumb('Tratamiento de Datos Personales (Ley 1581)')}
          <main className="flex-1 w-full bg-white">
            <PrivacyPolicyContent
              initialTab={privacyModalTab}
              onBackToHome={() => handleNavigateView('inicio')}
            />
          </main>
        </div>
      )}

      {activeView === 'inicio' && (
        <div className="flex-1 flex flex-col w-full min-h-[calc(100vh-130px)] justify-between bg-[#140e0a] animate-in fade-in duration-150">
          {/* Edge-to-Edge Immersive Hero Section (Exclusive for index.html, no scrolling required) */}
          <section className="relative w-full flex-1 flex items-center justify-center overflow-hidden py-10 sm:py-14 lg:py-16">
            {/* Background Ambient Video with Poster Fallback */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover scale-102"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              disableRemotePlayback
              poster={heroPoster}
              src={heroVideo}
            >
              <source src={heroWebm} type="video/webm" />
              <source src={heroVideo} type="video/mp4" />
            </video>

            {/* Editorial Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#140e0a]/95 via-[#140e0a]/60 to-[#140e0a]/70 backdrop-blur-[1px] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] pointer-events-none" />

            {/* Hero Content Container */}
            <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white flex flex-col items-center">
              {/* Main Editorial Headline with Poppins Type Specimen */}
              <h1 className="font-poppins text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] text-white drop-shadow-md max-w-4xl leading-[1.08]">
                Todo lo que tu hogar necesita,{' '}
                <span className="font-extrabold text-white block sm:inline drop-shadow-md">
                  fresco y al mejor precio
                </span>
              </h1>

              {/* Subtitle */}
              <p className="font-poppins mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-stone-200 max-w-2xl font-normal leading-relaxed drop-shadow-xs">
                Abarrotes, frutas seleccionadas, carnes certificadas Colanta, lácteos de Santa Rosa y domicilios express directo a tu puerta.
              </p>

              {/* Quick Hero Pantry Search Bar */}
              <div className="w-full max-w-xl mt-6 sm:mt-8">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleNavigateView('catalogo');
                  }}
                  className="relative flex items-center bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-1.5 border border-white/80 focus-within:ring-2 focus-within:ring-[#F06522]"
                >
                  <Search size={18} className="text-stone-400 ml-3.5 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="¿Qué necesitas hoy? Ej. Aguacates, lomo Colanta, leche..."
                    className="w-full px-3 py-2 text-xs sm:text-sm text-stone-900 bg-transparent focus:outline-hidden placeholder:text-stone-400 font-poppins"
                  />
                  <button
                    type="submit"
                    className="bg-[#F06522] hover:bg-[#d94f13] text-white px-5 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 shrink-0 shadow-sm cursor-pointer font-poppins"
                  >
                    Buscar
                  </button>
                </form>
              </div>

              {/* Action CTAs & Dedicated Page Portals */}
              <div className="mt-7 sm:mt-8 flex gap-2.5 sm:gap-3.5 flex-wrap justify-center items-center">
                <button
                  type="button"
                  onClick={() => handleNavigateView('catalogo')}
                  className="inline-flex items-center gap-2.5 bg-[#F06522] hover:bg-[#ea580c] text-white font-semibold rounded-xl pl-6 pr-3 py-2.5 sm:py-3 text-xs sm:text-sm shadow-xl shadow-orange-950/30 hover:shadow-orange-500/30 transition-all hover:scale-102 active:scale-98 cursor-pointer group"
                >
                  <span>Ver Catálogo (8 Pasillos)</span>
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight size={14} className="text-white" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateView('servicios')}
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm border border-white/30 shadow-lg shadow-black/15 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <span>Servicios & Colanta</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateView('avisos')}
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm border border-white/30 shadow-lg shadow-black/15 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <span>Avisos Comunitarios</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateView('empleo')}
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm border border-white/30 shadow-lg shadow-black/15 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <span>Trabaja con Nosotros</span>
                </button>
              </div>
            </div>
          </section>

          {/* Compact Index Footer */}
          <div className="w-full bg-[#1c140e] border-t border-white/10 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-400">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-x-4 gap-y-1 flex-wrap justify-center sm:justify-start">
                <span className="font-bold text-white">Supermercado Osos</span>
                <span>ARANGO HERMANOS S.A.S</span>
                <span>Santa Rosa de Osos, Antioquia</span>
              </div>
              <div className="flex items-center gap-x-4 gap-y-1 text-[11px] flex-wrap justify-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => handleNavigateView('contacto')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contacto: (604) 860-8899
                </button>
                <a
                  href="https://wa.me/573105550199"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  WhatsApp: 310 555 0199
                </a>
                <button
                  type="button"
                  onClick={() => handleNavigateView('privacidad')}
                  className="hover:text-white transition-colors cursor-pointer underline"
                >
                  Tratamiento de Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Supermarket Footer (Displayed on dedicated section pages) */}
      {activeView !== 'inicio' && (
        <footer className="w-full bg-[#241711] text-stone-300 py-12 px-4 sm:px-6 lg:px-8 mt-auto border-t border-stone-800">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-stone-800 text-xs">
            {/* Col 1: Brand & Legal Information */}
            <div className="lg:col-span-2 space-y-3">
              <img src={logoImg} alt="Supermercado Osos" className="h-10 w-auto object-contain brightness-110" />
              <p className="text-stone-400 max-w-sm leading-relaxed mt-2">
                Supermercado Osos (ARANGO HERMANOS S.A.S) es el supermercado tradicional de abarrotes, carnes selectas Colanta y productos frescos en Santa Rosa de Osos, Antioquia. Cumplimiento integral Ley 1581 de 2012 y Decreto 1377 de 2013.
              </p>
              <div className="flex flex-col gap-1.5 pt-1 text-stone-400">
                <div className="flex items-center gap-2">
                  <span>Horario:</span>
                  <span className="font-semibold text-stone-200">Lunes a Domingo: 7:00 AM - 9:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Atención telefónica:</span>
                  <a href="tel:6048608899" className="font-bold text-white hover:text-[#F06522] transition-colors">
                    (604) 860-8899
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span>WhatsApp Domicilios:</span>
                  <a href="https://wa.me/573105550199" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                    310 555 0199
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span>Protección de Datos:</span>
                  <a href="mailto:marian@nutrinor.com.co" className="font-medium text-stone-300 hover:text-[#F06522] transition-colors">
                    marian@nutrinor.com.co
                  </a>
                </div>
              </div>
            </div>

            {/* Col 2: Los 8 Pasillos Oficiales */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider font-editorial">8 Pasillos Oficiales</h4>
              <ul className="space-y-1.5 text-stone-400">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavigateView('catalogo');
                      setSelectedCategory('abarrotes');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Abarrotes
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavigateView('catalogo');
                      setSelectedCategory('frutas');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Frutas y Verduras
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavigateView('catalogo');
                      setSelectedCategory('aseo-personal');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Aseo Personal
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavigateView('catalogo');
                      setSelectedCategory('aseo-hogar');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Aseo Hogar
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavigateView('catalogo');
                      setSelectedCategory('dulceria');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Dulcería y Galletería
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavigateView('catalogo');
                      setSelectedCategory('lacteos');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Lácteos
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavigateView('catalogo');
                      setSelectedCategory('carnes');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Carnes Frías & Colanta
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavigateView('catalogo');
                      setSelectedCategory('rancho-licores');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Rancho y Licores
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Zonas */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider font-editorial">Zonas de Domicilio</h4>
              <ul className="space-y-1.5 text-stone-400">
                <li>Centro</li>
                <li>El Carmelo</li>
                <li>Los Osos</li>
                <li>Alto de la Mina</li>
                <li>San Antonio y La Granja</li>
                <li>Veredas aledañas de Santa Rosa</li>
              </ul>
            </div>

            {/* Col 4: Secciones & Vistas Dedicadas */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider font-editorial">Vistas Dedicadas</h4>
              <ul className="space-y-1.5 text-stone-400">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateView('catalogo')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Catálogo de Productos & 8 Pasillos
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateView('servicios')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Servicios Adicionales (Colanta)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateView('avisos')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Canal de Avisos & Blog
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateView('empleo')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Convocatorias y Empleo
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateView('contacto')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Atención y Cotizaciones
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateView('privacidad')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Manual de Datos Personales
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-3">
            <p>Copyright © 2023 OSOS SUPERMERCADO - Todos los derechos reservados. ARANGO HERMANOS S.A.S - Santa Rosa de Osos, Antioquia, Colombia.</p>
            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenPrivacyModal('manual')}
                className="hover:text-stone-300 transition-colors cursor-pointer underline"
              >
                Manual de Tratamiento de Datos Personales
              </button>
              <button
                type="button"
                onClick={() => handleOpenPrivacyModal('anexo2')}
                className="hover:text-stone-300 transition-colors cursor-pointer underline"
              >
                Aviso de Privacidad
              </button>
              <button
                type="button"
                onClick={() => handleOpenPrivacyModal('anexo1')}
                className="hover:text-stone-300 transition-colors cursor-pointer underline"
              >
                Modelos de Autorización
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Slide-Over Cart & Checkout Drawer */}
      <CheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        onExploreCatalog={() => {
          setIsCartOpen(false);
          handleNavigateView('catalogo');
        }}
        onOpenPrivacyPolicy={() => handleOpenPrivacyModal('manual')}
      />

      {/* Legal Privacy Policy Modal: ARANGO HERMANOS S.A.S */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        initialTab={privacyModalTab}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#241711] text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-200"
        >
          <Sparkles size={16} className="text-[#FED7AA] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
