import React, { useState } from 'react';
import {
  ShoppingCart,
  MapPin,
  Search,
  ChevronDown,
  Menu,
  X,
  Truck,
  CheckCircle2,
  Home,
  ShoppingBag,
  BookOpen,
  Briefcase,
  Phone,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { SANTA_ROSA_LOCATIONS } from '../data/products';

export type NavViewMode = 'inicio' | 'catalogo' | 'servicios' | 'avisos' | 'empleo' | 'contacto' | 'privacidad' | 'admin';

interface NavbarProps {
  cartCount?: number;
  cartTotal?: number;
  onOpenCart?: () => void;
  onOrderClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  currentLocation?: string;
  onLocationChange?: (loc: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onTrackOrder?: () => void;
  onOpenPrivacyPolicy?: () => void;
  activeView?: NavViewMode;
  onNavigateView?: (view: NavViewMode) => void;
}

const LOCATIONS = SANTA_ROSA_LOCATIONS;

export const Navbar: React.FC<NavbarProps> = ({
  cartCount = 0,
  cartTotal: _cartTotal = 0,
  onOpenCart,
  onOrderClick,
  searchQuery = '',
  onSearchChange,
  currentLocation = 'Santa Rosa de Osos, Centro',
  onLocationChange,
  selectedCategory: _selectedCategory = 'todos',
  onSelectCategory: _onSelectCategory,
  onTrackOrder: _onTrackOrder,
  onOpenPrivacyPolicy: _onOpenPrivacyPolicy,
  activeView = 'inicio',
  onNavigateView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const handleSelectLocation = (loc: string) => {
    onLocationChange?.(loc);
    setLocationDropdownOpen(false);
  };

  const handleNavView = (
    e: React.MouseEvent,
    view: NavViewMode
  ) => {
    if (onNavigateView) {
      e.preventDefault();
      onNavigateView(view);
      setMobileMenuOpen(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (onNavigateView && activeView !== 'catalogo') {
        onNavigateView('catalogo');
      }
      const el = document.getElementById('catalogo');
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="w-full sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      {/* Main Navigation Bar */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo & Brand Identity */}
          <a
            href="index.html"
            onClick={(e) => handleNavView(e, 'inicio')}
            className="flex items-center gap-2.5 shrink-0 group select-none text-decoration-none cursor-pointer"
            aria-label="Supermercado Osos"
          >
            <img
              src={logoImg}
              alt="Supermercado Osos"
              className="h-9 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-103"
            />
            <div className="sr-only">
              <span style={{ fontFamily: "ui-rounded, 'Arial Rounded MT Bold', sans-serif" }}>
                OSOS
              </span>
              <span>Supermercado</span>
            </div>
          </a>

          {/* Delivery Location Selector */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-stone-800 text-xs font-semibold transition-all cursor-pointer"
              aria-expanded={locationDropdownOpen}
            >
              <MapPin size={14} className="text-[#F06522] shrink-0" />
              <span className="truncate max-w-[130px] lg:max-w-[170px]">{currentLocation}</span>
              <ChevronDown size={12} className={`text-stone-500 transition-transform ${locationDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {locationDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setLocationDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Sectores Santa Rosa de Osos
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className={`text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          currentLocation === loc
                            ? 'bg-orange-50 text-[#F06522] font-bold'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span>{loc}</span>
                        {currentLocation === loc && <CheckCircle2 size={13} className="text-[#F06522]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Integrated Search Bar (Desktop / Tablet) */}
          <div className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar aguacates, carnes, panadería, lácteos..."
                className="w-full pl-10 pr-9 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#F06522] focus:bg-white focus:ring-2 focus:ring-[#F06522]/15 text-stone-900 placeholder:text-stone-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Right Cluster: Cart Button & Action Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Slide-over Cart Trigger (Pure Icon Button with Offset Clear Counter Badge) */}
            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Carrito de compras con ${cartCount} productos`}
              className="relative p-2 sm:p-2.5 rounded-lg bg-stone-100 hover:bg-orange-50 border border-stone-200 hover:border-orange-200 transition-all active:scale-95 cursor-pointer group flex items-center justify-center shrink-0"
            >
              <ShoppingCart size={20} className="text-stone-700 group-hover:text-[#F06522] transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#16a34a] text-white text-[10px] font-extrabold rounded-md flex items-center justify-center shadow-xs border-2 border-white pointer-events-none">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Quick Checkout CTA Button */}
            <button
              type="button"
              onClick={onOrderClick}
              className="inline-flex items-center gap-1.5 bg-[#F06522] hover:bg-[#ea580c] text-white text-xs sm:text-sm font-semibold rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 shadow-md shadow-orange-950/10 hover:shadow-orange-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <span>Hacer Pedido</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Sections Navigation Bar (Desktop) */}
        <nav aria-label="Navegación principal de secciones" className="hidden md:flex items-center justify-between gap-2 pt-2.5 text-xs font-semibold text-stone-700 border-t border-stone-100 mt-2.5">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <a
              href="index.html"
              onClick={(e) => handleNavView(e, 'inicio')}
              className={`transition-all whitespace-nowrap cursor-pointer px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                activeView === 'inicio'
                  ? 'bg-[#F06522] text-white font-bold shadow-xs'
                  : 'text-stone-700 hover:text-[#F06522] hover:bg-orange-50'
              }`}
            >
              <Home size={13} />
              <span>Inicio</span>
            </a>
            <a
              href="catalogo.html"
              onClick={(e) => handleNavView(e, 'catalogo')}
              className={`transition-all whitespace-nowrap cursor-pointer px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                activeView === 'catalogo'
                  ? 'bg-[#F06522] text-white font-bold shadow-xs'
                  : 'text-stone-700 hover:text-[#F06522] hover:bg-orange-50'
              }`}
            >
              <ShoppingBag size={13} />
              <span>Catálogo</span>
            </a>
            <a
              href="servicios.html"
              onClick={(e) => handleNavView(e, 'servicios')}
              className={`transition-all whitespace-nowrap cursor-pointer px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                activeView === 'servicios'
                  ? 'bg-[#F06522] text-white font-bold shadow-xs'
                  : 'text-stone-700 hover:text-[#F06522] hover:bg-orange-50'
              }`}
            >
              <span>Servicios & Colanta</span>
            </a>
            <a
              href="avisos.html"
              onClick={(e) => handleNavView(e, 'avisos')}
              className={`transition-all whitespace-nowrap cursor-pointer px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                activeView === 'avisos'
                  ? 'bg-[#F06522] text-white font-bold shadow-xs'
                  : 'text-stone-700 hover:text-[#F06522] hover:bg-orange-50'
              }`}
            >
              <span>Avisos</span>
            </a>
            <a
              href="empleo.html"
              onClick={(e) => handleNavView(e, 'empleo')}
              className={`transition-all whitespace-nowrap cursor-pointer px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                activeView === 'empleo'
                  ? 'bg-[#F06522] text-white font-bold shadow-xs'
                  : 'text-stone-700 hover:text-[#F06522] hover:bg-orange-50'
              }`}
            >
              <span>Empleo</span>
            </a>
            <a
              href="contacto.html"
              onClick={(e) => handleNavView(e, 'contacto')}
              className={`transition-all whitespace-nowrap cursor-pointer px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                activeView === 'contacto'
                  ? 'bg-[#F06522] text-white font-bold shadow-xs'
                  : 'text-stone-700 hover:text-[#F06522] hover:bg-orange-50'
              }`}
            >
              <span>Contacto</span>
            </a>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-500 whitespace-nowrap">
            <span className="hidden lg:inline-flex items-center gap-1.5 text-stone-600 font-medium">
              <Truck size={13} className="text-[#F06522]" />
              <span>Domicilios</span>
            </span>
            <span className="hidden xl:inline text-stone-300">|</span>
            <span className="hidden xl:inline font-medium text-stone-600">
              7:00 AM - 9:00 PM
            </span>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white p-4 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-lg max-h-[85vh] overflow-y-auto">
          {/* Mobile Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#F06522] text-stone-900"
            />
          </div>

          {/* Mobile Location Selector (Interactive for Santa Rosa de Osos) */}
          <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-100 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-stone-700">
              <MapPin size={15} className="text-[#F06522] shrink-0" />
              <span>Sector en Santa Rosa de Osos:</span>
            </div>
            <select
              aria-label="Seleccionar sector móvil"
              value={currentLocation}
              onChange={(e) => handleSelectLocation(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 font-medium focus:outline-hidden focus:border-[#F06522] cursor-pointer"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Links */}
          <div className="flex flex-col gap-1 text-xs font-semibold text-stone-800">
            <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Secciones del Sitio
            </div>
            <a
              href="index.html"
              onClick={(e) => handleNavView(e, 'inicio')}
              className={`p-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                activeView === 'inicio' ? 'bg-orange-50 text-[#F06522] font-bold' : 'hover:bg-stone-50 text-stone-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Home size={15} className="text-[#F06522]" />
                <span>Inicio</span>
              </span>
            </a>
            <a
              href="catalogo.html"
              onClick={(e) => handleNavView(e, 'catalogo')}
              className={`p-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                activeView === 'catalogo' ? 'bg-orange-50 text-[#F06522] font-bold' : 'hover:bg-stone-50 text-stone-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={15} className="text-[#F06522]" />
                <span>Catálogo Completo (8 Pasillos)</span>
              </span>
            </a>
            <a
              href="servicios.html"
              onClick={(e) => handleNavView(e, 'servicios')}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                activeView === 'servicios'
                  ? 'bg-orange-50 text-[#F06522] font-bold'
                  : 'hover:bg-stone-50 text-stone-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Truck size={15} className="text-[#F06522]" />
                <span>Servicios Adicionales (Carnicería Colanta)</span>
              </span>
            </a>
            <a
              href="avisos.html"
              onClick={(e) => handleNavView(e, 'avisos')}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                activeView === 'avisos'
                  ? 'bg-orange-50 text-[#F06522] font-bold'
                  : 'hover:bg-stone-50 text-stone-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen size={15} className="text-[#F06522]" />
                <span>Canal de Avisos tipo Blog</span>
              </span>
            </a>
            <a
              href="empleo.html"
              onClick={(e) => handleNavView(e, 'empleo')}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                activeView === 'empleo'
                  ? 'bg-orange-50 text-[#F06522] font-bold'
                  : 'hover:bg-stone-50 text-stone-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Briefcase size={15} className="text-[#F06522]" />
                <span>¡Trabaja con nosotros!</span>
              </span>
            </a>
            <a
              href="contacto.html"
              onClick={(e) => handleNavView(e, 'contacto')}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                activeView === 'contacto'
                  ? 'bg-orange-50 text-[#F06522] font-bold'
                  : 'hover:bg-stone-50 text-stone-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Phone size={15} className="text-[#F06522]" />
                <span>Comunícate con nosotros</span>
              </span>
            </a>
          </div>

          {/* Mobile CTA */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenCart?.();
            }}
            className="w-full py-2.5 bg-[#F06522] hover:bg-[#d94f13] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98 transition-all"
          >
            <ShoppingCart size={15} />
            <span>Ver Mi Canasta ({cartCount})</span>
          </button>
        </div>
      )}

      {/* Mobile Ergonomic Bottom Action Bar (Thumb-Zone Friendly & No Occlusion) */}
      <aside aria-label="Navegación rápida inferior móvil" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/96 backdrop-blur-md border-t border-stone-200/90 py-1.5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-4px_20px_rgba(40,25,15,0.08)]">
        <button
          type="button"
          onClick={() => onNavigateView?.('inicio')}
          aria-label="Ir a página de Inicio"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
            activeView === 'inicio' ? 'text-[#F06522] font-bold' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Home size={19} className={activeView === 'inicio' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] tracking-tight">Inicio</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateView?.('catalogo')}
          aria-label="Ir a catálogo completo de productos"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
            activeView === 'catalogo' ? 'text-[#F06522] font-bold' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ShoppingBag size={19} className={activeView === 'catalogo' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] tracking-tight">Catálogo</span>
        </button>

        <a
          href="https://wa.me/573105550199"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp a domicilios"
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-emerald-600 hover:text-emerald-700 transition-all active:scale-95"
        >
          <div className="relative">
            <Phone size={19} className="stroke-[2.5]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-xs bg-emerald-500 animate-pulse"></span>
          </div>
          <span className="text-[10px] font-semibold tracking-tight">WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={onOpenCart}
          aria-label={`Abrir canasta con ${cartCount} productos`}
          className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-stone-700 hover:text-[#F06522] transition-all active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <ShoppingCart size={19} className="stroke-2" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#16a34a] rounded-xs border-2 border-white pointer-events-none"></span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-tight">
            {cartCount > 0 ? `Canasta (${cartCount})` : 'Canasta'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Alternar menú inferior"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
            mobileMenuOpen ? 'text-[#F06522] font-bold' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {mobileMenuOpen ? <X size={19} className="stroke-[2.5]" /> : <Menu size={19} className="stroke-2" />}
          <span className="text-[10px] tracking-tight">Menú</span>
        </button>
      </aside>
    </header>
  );
};

export default Navbar;
