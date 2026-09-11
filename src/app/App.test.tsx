import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import Navbar from './components/Navbar';
import ProductCatalog from './components/ProductCatalog';
import CheckoutDrawer, { type CartItem } from './components/CheckoutDrawer';
import AdditionalServices from './components/AdditionalServices';
import NoticeBoard from './components/NoticeBoard';
import ContactSection from './components/ContactSection';
import CareersSection from './components/CareersSection';
import NewsletterSection from './components/NewsletterSection';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import App from './App';
import { tursoClient, getTursoClient, initTursoDatabase } from '../lib/turso';
import * as orderService from '../services/orderService';
import * as productService from '../services/productService';
import * as careerService from '../services/careerService';
import * as newsletterService from '../services/newsletterService';
import * as contactService from '../services/contactService';
import * as noticeService from '../services/noticeService';

const MOCK_ITEMS: CartItem[] = [
  {
    id: 'prod-aguacate',
    name: 'Aguacate Hass de Exportación (1 kg)',
    price: 4900,
    originalPrice: 7000,
    qty: 2,
    unit: '1 kg',
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&q=80',
    category: 'Frutas y Verduras',
  },
  {
    id: 'prod-pollo',
    name: 'Pechuga de Pollo Campesino Deshuesada (1 kg)',
    price: 14900,
    qty: 1,
    unit: '1 kg',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&q=80',
    category: 'Carnes Frías y Congelados',
  },
];

describe('CheckoutDrawer Component', () => {
  it('renders cart items, quantities, and price calculations correctly', () => {
    const handleUpdateQty = vi.fn();
    const handleRemoveItem = vi.fn();

    render(
      <CheckoutDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={MOCK_ITEMS}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
      />
    );

    expect(screen.getByText('Tu Canasta de Mercado')).toBeDefined();
    expect(screen.getByText('Aguacate Hass de Exportación (1 kg)')).toBeDefined();
    expect(screen.getByText('Pechuga de Pollo Campesino Deshuesada (1 kg)')).toBeDefined();
    // 2 aguacates * 4900 = 9800
    expect(screen.getByText('$9.800')).toBeDefined();
    // Subtotal and Total: 9800 + 14900 = 24700 (both equal in store pickup mode with free delivery)
    expect(screen.getAllByText('$24.700').length).toBe(2);
  });

  it('displays delivery onboarding modal options (Recoger en Tienda vs Domicilio) and excludes free shipping progress bar', () => {
    render(
      <CheckoutDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={MOCK_ITEMS}
        onUpdateQty={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );

    // Free shipping progress bar and "Te faltan $ para envío gratis" must not exist
    expect(screen.queryByText(/Te faltan.*para envío gratis/i)).toBeNull();

    // Advance to checkout step
    fireEvent.click(screen.getByText('Continuar con Entrega y Pago'));

    // Delivery onboarding options
    expect(screen.getByText('1. Modalidad de Entrega')).toBeDefined();
    expect(screen.getByText('Recoger en Tienda')).toBeDefined();
    expect(screen.getByText('Envío a Domicilio')).toBeDefined();

    // Default is store pickup: displays Sede Central info and no address input
    expect(screen.getByText(/Sede Central Calle 30 # 29-15/)).toBeDefined();
    expect(screen.queryByLabelText('Barrio / Sector en Santa Rosa')).toBeNull();
    expect(screen.getByText('GRATIS ($0)')).toBeDefined();
  });

  it('handles quantity increase, decrease, and item deletion without redundant double trash icons', () => {
    const handleUpdateQty = vi.fn();
    const handleRemoveItem = vi.fn();

    render(
      <CheckoutDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={MOCK_ITEMS}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
      />
    );

    // Increase pechuga
    const incBtns = screen.getAllByLabelText(/Aumentar cantidad/);
    fireEvent.click(incBtns[0]);
    expect(handleUpdateQty).toHaveBeenCalledWith('prod-aguacate', 1);

    // Decrease pechuga
    const decBtns = screen.getAllByLabelText(/Disminuir cantidad/);
    fireEvent.click(decBtns[0]);
    expect(handleUpdateQty).toHaveBeenCalledWith('prod-aguacate', -1);

    // Remove directly via trash icon
    const removeBtns = screen.getAllByLabelText(/Eliminar /);
    fireEvent.click(removeBtns[0]);
    expect(handleRemoveItem).toHaveBeenCalledWith('prod-aguacate');
  });

  it('strictly excludes the guarantee sentence "Garantía de frescura: Si algún producto no te gusta al recibirlo, lo cambiamos sin costo."', () => {
    render(
      <CheckoutDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={MOCK_ITEMS}
        onUpdateQty={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );

    expect(screen.queryByText(/Garantía de frescura: Si algún producto no te gusta/i)).toBeNull();
  });

  it('excludes discount coupon section and excludes online card payment option', () => {
    render(
      <CheckoutDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={MOCK_ITEMS}
        onUpdateQty={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );

    // Advance to checkout step
    fireEvent.click(screen.getByText('Continuar con Entrega y Pago'));

    // Coupon section must be removed
    expect(screen.queryByLabelText('Código de cupón')).toBeNull();
    expect(screen.queryByText('Cupón de Descuento')).toBeNull();

    // Delivery slot section (Express, Hoy tarde, Mañana) must be removed
    expect(screen.queryByText('2. Horario de Entrega')).toBeNull();

    // Online card option must be removed
    expect(screen.queryByText('Tarjeta en línea')).toBeNull();

    // Only simplified payment methods exist
    expect(screen.getByText('2. Forma de Pago')).toBeDefined();
    expect(screen.getByText('Efectivo')).toBeDefined();
    expect(screen.getByText('Transferencia / QR / Tarjeta')).toBeDefined();
  });

  it('allows selecting Santa Rosa de Osos neighborhood during checkout only when Domicilio is selected', () => {
    render(
      <CheckoutDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={MOCK_ITEMS}
        onUpdateQty={vi.fn()}
        onRemoveItem={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Continuar con Entrega y Pago'));

    // In store pickup mode, neighborhood selector is not shown
    expect(screen.queryByLabelText('Barrio / Sector en Santa Rosa')).toBeNull();

    // Switch to Domicilio
    fireEvent.click(screen.getByText('Envío a Domicilio'));

    expect(screen.getByLabelText('Barrio / Sector en Santa Rosa')).toBeDefined();
    expect(screen.getByText('Centro')).toBeDefined();
    expect(screen.getByText('El Carmelo')).toBeDefined();
    expect(screen.getByText('Los Osos')).toBeDefined();
    expect(screen.getByText('Alto de la Mina')).toBeDefined();
    expect(screen.getByLabelText('Dirección completa')).toBeDefined();
  });

  it('completes the entire checkout order flow, triggers WhatsApp redirect, and renders confirmation receipt', () => {
    const handleOrderPlaced = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <CheckoutDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={MOCK_ITEMS}
        onUpdateQty={vi.fn()}
        onRemoveItem={vi.fn()}
        onOrderPlaced={handleOrderPlaced}
      />
    );

    // Click Continue to Checkout
    fireEvent.click(screen.getByText('Continuar con Entrega y Pago'));
    expect(screen.getByText('Reservar Pedido')).toBeDefined();

    // Verify WhatsApp button prompt is clearly explained
    expect(
      screen.getByText(/Confirmar pedido te da tu número de pedido en el mismo texto de WhatsApp/)
    ).toBeDefined();

    // Switch to Domicilio
    fireEvent.click(screen.getByText('Envío a Domicilio'));

    // Quick notes chip
    const noteChip = screen.getByText('Llamar al llegar');
    fireEvent.click(noteChip);
    const notesInput = screen.getByPlaceholderText(/Casa de reja blanca/) as HTMLInputElement;
    expect(notesInput.value).toBe('Llamar al llegar');

    // Select payment method: Efectivo
    fireEvent.click(screen.getByText('Efectivo'));
    expect(screen.getByText(/¿Con qué valor de billete vas a pagar\?/)).toBeDefined();

    // Test cash validation: 20000 is less than grand total
    const customCashInput = screen.getByPlaceholderText('Ej. 70000');
    fireEvent.change(customCashInput, { target: { value: '20000' } });
    expect(screen.getByText(/El billete.*debe ser mayor o igual al total/)).toBeDefined();

    // Click confirm when cash is invalid: should prevent order submission
    const confirmBtn = screen.getByText('Confirmar Pedido por WhatsApp');
    fireEvent.click(confirmBtn);
    expect(handleOrderPlaced).not.toHaveBeenCalled();

    // Enter valid cash amount: 50.000
    fireEvent.change(customCashInput, { target: { value: '50000' } });
    expect(screen.getByText(/Tu cambio será de:/)).toBeDefined();

    // Now confirm order
    fireEvent.click(confirmBtn);

    // Verifies window.open was called with WhatsApp link containing official phone and order info
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/573105550199?text='),
      '_blank'
    );

    // Verifies confirmation view
    expect(screen.getByText('¡Pedido Registrado!')).toBeDefined();
    expect(screen.getByText('¡Pedido Listo para WhatsApp!')).toBeDefined();
    expect(screen.getByText(/Número de Pedido:/)).toBeDefined();
    expect(screen.getByText('Abrir WhatsApp con mi Pedido')).toBeDefined();
    expect(handleOrderPlaced).toHaveBeenCalledTimes(1);

    // Verifies return to store button without tracking button
    expect(screen.queryByText('Rastrear Domicilio')).toBeNull();
    expect(screen.getByText('Volver a la Tienda')).toBeDefined();

    openSpy.mockRestore();
  });

  it('renders empty cart view with CTA button', () => {
    const handleExplore = vi.fn();
    render(
      <CheckoutDrawer
        isOpen={true}
        onClose={vi.fn()}
        items={[]}
        onUpdateQty={vi.fn()}
        onRemoveItem={vi.fn()}
        onExploreCatalog={handleExplore}
      />
    );

    expect(screen.getByText('Tu canasta está vacía')).toBeDefined();
    const exploreBtn = screen.getByText('Explorar Catálogo de Productos');
    fireEvent.click(exploreBtn);
    expect(handleExplore).toHaveBeenCalledTimes(1);
  });
});

describe('ProductCatalog Component (8 Official Pasillos)', () => {
  it('renders all 8 official pasillos and product cards', () => {
    render(<ProductCatalog onAddToCart={vi.fn()} />);

    expect(screen.getByText('Lo Más Fresco para tu Hogar')).toBeDefined();
    expect(screen.getByRole('button', { name: /Todos los Pasillos/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Ofertas Permanentes/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Abarrotes/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Frutas y Verduras/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Aseo Personal/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Aseo Hogar/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Dulcería y Galletería/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Lácteos/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Carnes Frías y Congelados/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Rancho y Licores/ })).toBeDefined();

    // Check sample product
    expect(screen.getByText('Aguacate Hass de Exportación')).toBeDefined();
    expect(screen.getByText('$4.900')).toBeDefined();
  });

  it('filters products by official pasillo tab (Abarrotes)', () => {
    render(<ProductCatalog onAddToCart={vi.fn()} />);

    // Click Abarrotes
    const abarrotesBtn = screen.getByRole('button', { name: /Abarrotes/ });
    fireEvent.click(abarrotesBtn);

    expect(screen.getByText('Arroz Supremo Grano Entero')).toBeDefined();
    expect(screen.queryByText('Pechuga de Pollo Campesino Deshuesada')).toBeNull();
  });

  it('filters products based on search query', () => {
    render(<ProductCatalog onAddToCart={vi.fn()} searchQuery="Pollo" />);

    expect(screen.getByText('Pechuga de Pollo Campesino Deshuesada')).toBeDefined();
    expect(screen.queryByText('Arroz Supremo Grano Entero')).toBeNull();
  });

  it('triggers onAddToCart with correct item details', () => {
    const handleAdd = vi.fn();
    render(<ProductCatalog onAddToCart={handleAdd} />);

    const addBtns = screen.getAllByLabelText(/Agregar /);
    fireEvent.click(addBtns[0]);

    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd.mock.calls[0][0].name).toContain('Arroz');
    expect(screen.getByText('¡Agregado!')).toBeDefined();
  });
});

describe('Navbar Component', () => {
  it('renders official brand logo, Santa Rosa location indicator, search input, and cart button', () => {
    render(
      <Navbar
        cartCount={3}
        cartTotal={28400}
        onOpenCart={vi.fn()}
        onOrderClick={vi.fn()}
      />
    );

    // Official logo
    expect(screen.getByAltText('Supermercado Osos')).toBeDefined();
    expect(screen.getByText('OSOS')).toBeDefined();

    // Santa Rosa de Osos location selector
    expect(screen.getByText('Santa Rosa de Osos, Centro')).toBeDefined();

    // Top announcement bar removed completely
    expect(screen.queryByText(/Domicilios Express Bogotá:/)).toBeNull();

    // Cart button with live count (pure icon without price or text)
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.queryByText('$28.400')).toBeNull();
    expect(screen.getByText('Hacer Pedido')).toBeDefined();
  });

  it('toggles location selection dropdown with Santa Rosa de Osos sectors and calls onLocationChange', () => {
    const handleLocationChange = vi.fn();
    render(
      <Navbar
        currentLocation="Santa Rosa de Osos, Centro"
        onLocationChange={handleLocationChange}
      />
    );

    const locationBtn = screen.getByText('Santa Rosa de Osos, Centro');
    fireEvent.click(locationBtn);

    expect(screen.getByText('Sectores Santa Rosa de Osos')).toBeDefined();
    expect(screen.getByText('Santa Rosa de Osos, El Carmelo')).toBeDefined();

    fireEvent.click(screen.getByText('Santa Rosa de Osos, El Carmelo'));
    expect(handleLocationChange).toHaveBeenCalledWith('Santa Rosa de Osos, El Carmelo');
  });

  it('toggles mobile navigation drawer and renders prominent section links without 10-pasillo clutter', () => {
    const handleLocationChange = vi.fn();
    const handleNavigateView = vi.fn();

    render(
      <Navbar
        cartCount={2}
        onLocationChange={handleLocationChange}
        onNavigateView={handleNavigateView}
      />
    );
    const menuBtn = screen.getByLabelText('Abrir menú');
    fireEvent.click(menuBtn);

    expect(screen.getByLabelText('Cerrar menú')).toBeDefined();
    expect(screen.getByText('Secciones del Sitio')).toBeDefined();

    // Check prominent section links
    expect(screen.getAllByText('Inicio').length).toBeGreaterThan(0);
    expect(screen.getByText('Catálogo Completo (8 Pasillos)')).toBeDefined();
    expect(screen.getByText('Servicios Adicionales (Carnicería Colanta)')).toBeDefined();
    expect(screen.getByText('Canal de Avisos tipo Blog')).toBeDefined();
    expect(screen.getByText('¡Trabaja con nosotros!')).toBeDefined();
    expect(screen.getByText('Comunícate con nosotros')).toBeDefined();
    // Verify Tratamiento de Datos is not in section navigation (reserved exclusively for footer)
    expect(screen.queryByText('Tratamiento de Datos (Ley 1581)')).toBeNull();
    expect(screen.queryByText('Datos Personales')).toBeNull();

    // Navigate to catalogo via mobile link
    fireEvent.click(screen.getByText('Catálogo Completo (8 Pasillos)'));
    expect(handleNavigateView).toHaveBeenCalledWith('catalogo');

    // Drawer should have closed after navigation click
    expect(screen.queryByLabelText('Cerrar menú')).toBeNull();
  });
});

describe('AdditionalServices Component (5 Strategic Services)', () => {
  it('renders CARNICERIA COLANTA, SERVICIO A DOMICILIO, VENTAS INSTITUCIONALES, VENTAS AL POR MAYOR, and OFERTAS PERMANENTES with the verbatim quote', () => {
    render(<AdditionalServices />);

    expect(screen.getByText('SERVICIOS ADICIONALES')).toBeDefined();
    expect(screen.getByText('CARNICERIA COLANTA')).toBeDefined();
    expect(screen.getByText('SERVICIO A DOMICILIO')).toBeDefined();
    expect(screen.getByText('VENTAS INSTITUCIONALES')).toBeDefined();
    expect(screen.getByText('VENTAS AL POR MAYOR')).toBeDefined();
    expect(screen.getByText('OFERTAS PERMANENTES')).toBeDefined();

    // Verbatim quote requirement
    expect(
      screen.getByText(/En colaboración con todos nuestros proveedores, estamos realizando permanentemente ofertas y descuentos para que puedas ahorrar\./i)
    ).toBeDefined();
  });
});

describe('NoticeBoard Component (Canal de Avisos tipo Blog)', () => {
  it('renders blog announcements and opens detail modal on click', () => {
    render(<NoticeBoard />);

    expect(screen.getByText('Canal de Avisos & Novedades')).toBeDefined();
    const notices = screen.getAllByText(/Nueva Llegada de Cortes Certificados Carnicería Colanta/);
    expect(notices.length).toBeGreaterThan(0);

    // Click on notice to open reader modal
    fireEvent.click(notices[0]);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Publicado por Arango Hermanos S\.A\.S/)).toBeDefined();

    // Close reader modal
    fireEvent.click(screen.getByText('Cerrar Lectura'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('ContactSection Component (Comunícate con nosotros)', () => {
  it('renders contact form, validates required email and policy consent, and submits message', () => {
    render(<ContactSection />);

    expect(screen.getByText('Comunícate con nosotros')).toBeDefined();
    expect(screen.getByLabelText('Nombre')).toBeDefined();
    expect(screen.getByLabelText('Correo electrónico*')).toBeDefined();

    const submitBtn = screen.getByText('Enviar Mensaje');
    fireEvent.click(submitBtn);

    // Validation messages
    expect(screen.getByText('El correo electrónico es obligatorio.')).toBeDefined();
    expect(screen.getByText(/Debes autorizar el tratamiento de tus datos personales/)).toBeDefined();

    // Fill valid data
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Carlos Arango' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico*'), { target: { value: 'carlos@ejemplo.com' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(submitBtn);

    expect(screen.getByText('¡Mensaje Enviado con Éxito!')).toBeDefined();
  });
});

describe('CareersSection Component (¡Trabaja con nosotros!)', () => {
  it('renders job application form with CV attachment and Anexo 1 consent', () => {
    render(<CareersSection />);

    expect(screen.getByText('¡Trabaja con nosotros!')).toBeDefined();
    expect(screen.getByLabelText('Nombre completo')).toBeDefined();
    expect(screen.getByLabelText('Correo electrónico*')).toBeDefined();
    expect(screen.getByLabelText('Área de Interés')).toBeDefined();

    // Fill and submit
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Laura Montoya' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico*'), { target: { value: 'laura@ejemplo.com' } });
    fireEvent.click(screen.getByRole('checkbox'));

    const submitBtn = screen.getByText('Postularse Ahora');
    fireEvent.click(submitBtn);

    expect(screen.getByText('¡Postulación Recibida!')).toBeDefined();
  });
});

describe('NewsletterSection Component (Suscribirse)', () => {
  it('renders newsletter subscription form with privacy link and handles submission', () => {
    render(<NewsletterSection />);

    expect(screen.getByText('Suscríbete a Nuestras Ofertas y Avisos')).toBeDefined();
    const emailInput = screen.getByPlaceholderText(/Ingresa tu correo electrónico/);
    const registerBtn = screen.getByText('Registrarse');

    fireEvent.change(emailInput, { target: { value: 'vecino@santarosa.com' } });
    fireEvent.click(registerBtn);

    expect(screen.getByText('¡Gracias por suscribirte!')).toBeDefined();
  });
});

describe('PrivacyPolicyModal Component (Manual Arango Hermanos S.A.S)', () => {
  it('renders complete legal manual text with Articles 1 to 18, Anexo 1 and Anexo 2 under Ley 1581 de 2012', () => {
    const handleClose = vi.fn();
    render(<PrivacyPolicyModal isOpen={true} onClose={handleClose} initialTab="manual" />);

    expect(
      screen.getByText('MANUAL DE TRATAMIENTO DE DATOS PERSONALES ARANGO HERMANOS S.A.S')
    ).toBeDefined();
    expect(screen.getByText(/Ley 1581 de 2012 • Decreto 1377 de 2013/)).toBeDefined();

    // Verify contact and location information
    expect(screen.getAllByText(/Santa Rosa de Osos, Antioquia/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/http:\/\/www\.osos\.com\.co/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/marian@nutrinor\.com\.co/).length).toBeGreaterThan(0);

    // Verify Articles 1 to 18
    expect(screen.getByText('1.')).toBeDefined();
    expect(screen.getByText('Definiciones.')).toBeDefined();
    expect(screen.getByText('2.')).toBeDefined();
    expect(screen.getByText('Principios generales y postulados.')).toBeDefined();
    expect(screen.getByText('3.')).toBeDefined();
    expect(screen.getByText('Datos sensibles.')).toBeDefined();
    expect(screen.getByText('17.')).toBeDefined();
    expect(screen.getByText('Encargado del Tratamiento.')).toBeDefined();
    expect(screen.getByText('18.')).toBeDefined();
    expect(screen.getByText('Vigencia.')).toBeDefined();
    expect(screen.getByText(/El presente Manual rige a partir del 1º de septiembre de 2016\./)).toBeDefined();

    // Switch to Anexo 1 tab
    const anexo1Tab = screen.getByText(/Anexo 1: Modelos de Autorización/);
    fireEvent.click(anexo1Tab);
    expect(screen.getByText(/INFORMACIÓN COMERCIAL PROVEEDORES Y CLIENTES/)).toBeDefined();
    expect(screen.getByText(/CONTROL DE ACCESO A LAS INSTALACIONES/)).toBeDefined();
    expect(screen.getByText(/VINCULACIÓN LABORAL A ARANGO HERMANOS S\.A\.S/)).toBeDefined();

    // Switch to Anexo 2 tab
    const anexo2Tab = screen.getByText(/Anexo 2: Modelo Aviso de Privacidad/);
    fireEvent.click(anexo2Tab);
    expect(screen.getByText(/ANEXO 2 MODELO AVISO DE PRIVACIDAD/)).toBeDefined();
    expect(screen.getByText(/1\) Responsable del Tratamiento/)).toBeDefined();
    expect(screen.getByText(/2\) Finalidad del Tratamiento/)).toBeDefined();
    expect(screen.getByText(/3\) Derechos de los Titulares/)).toBeDefined();

    // Copyright
    expect(
      screen.getByText(/Copyright © 2023 OSOS SUPERMERCADO - Todos los derechos reservados\./)
    ).toBeDefined();
  });
});

describe('App Component (Full Supermarket Integration)', () => {
  beforeAll(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders index page with Hero and direct portal links without requiring endless scroll for other sections', () => {
    const { container } = render(<App />);

    // Video background exists with valid sources
    const video = container.querySelector('video');
    expect(video).toBeDefined();
    expect(video?.getAttribute('poster')).toContain('hero-poster.jpg');
    expect(video?.getAttribute('src')).toContain('hero.mp4');

    // Confirms NO hero pill badge "Calidad y Frescura para tu Hogar" exists
    expect(screen.queryByText('Calidad y Frescura para tu Hogar')).toBeNull();

    // Confirms status badge "Santa Rosa de Osos, Antioquia • Tradición y Frescura" is removed
    expect(screen.queryByText('Santa Rosa de Osos, Antioquia • Tradición y Frescura')).toBeNull();

    // Editorial headline with Poppins Specimen
    const headline = screen.getByRole('heading', { level: 1 });
    expect(headline.className).toContain('font-poppins');
    expect(screen.getByText(/Todo lo que tu hogar necesita,/)).toBeDefined();
    const precioSpan = screen.getByText('fresco y al mejor precio');
    expect(precioSpan).toBeDefined();
    expect(precioSpan.className).toContain('font-extrabold');
    expect(precioSpan.className).toContain('text-white');
    expect(precioSpan.className).not.toContain('font-light');

    // Confirms mountain shape divider is removed from header
    expect(container.querySelector('[data-testid="header-mountain-divider"]')).toBeNull();

    // Confirms trust pills are removed from Hero
    expect(screen.queryByText('100% Frescura de Origen')).toBeNull();
    expect(screen.queryByText('Pago Contra Entrega')).toBeNull();

    // Hero search input exists without frequent tag chips
    expect(screen.getByPlaceholderText(/¿Qué necesitas hoy\?/)).toBeDefined();
    expect(screen.queryByText('Pollo campesino')).toBeNull();

    // Portal action buttons to dedicated pages
    expect(screen.getByText('Ver Catálogo (8 Pasillos)')).toBeDefined();
    expect(screen.getAllByText('Servicios & Colanta').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Avisos Comunitarios').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Trabaja con Nosotros').length).toBeGreaterThan(0);

    // Compact index footer exists
    expect(screen.getAllByText(/ARANGO HERMANOS S\.A\.S/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Santa Rosa de Osos/).length).toBeGreaterThan(0);
  });

  it('strictly contains zero emojis across the entire rendered application', () => {
    const { container } = render(<App />);
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    expect(emojiRegex.test(container.innerHTML)).toBe(false);
  });

  it('strictly targets Santa Rosa de Osos and has zero Bogotá references', () => {
    const { container } = render(<App />);
    expect(container.innerHTML).not.toMatch(/Bogot[aá]/i);
    expect(screen.getAllByText(/Santa Rosa de Osos/).length).toBeGreaterThan(0);
  });

  it('opens and reads Privacy Policy from footer link', () => {
    render(<App />);

    const privacyLinks = screen.getAllByText('Tratamiento de Datos');
    fireEvent.click(privacyLinks[0]);

    expect(
      screen.getByText('MANUAL DE TRATAMIENTO DE DATOS PERSONALES ARANGO HERMANOS S.A.S')
    ).toBeDefined();
  });

  it('opens slide-over cart drawer, manages items, and completes order', () => {
    render(<App />);

    // Cart button click
    const cartTrigger = screen.getByLabelText(/Carrito de compras/);
    fireEvent.click(cartTrigger);

    expect(screen.getByText('Tu Canasta de Mercado')).toBeDefined();

    // Add another item from catalog
    fireEvent.click(screen.getByText('Continuar con Entrega y Pago'));
    expect(screen.getByText('Reservar Pedido')).toBeDefined();

    // Confirm order
    fireEvent.click(screen.getByText('Confirmar Pedido por WhatsApp'));
    expect(screen.getByText('¡Pedido Registrado!')).toBeDefined();
  });

  it('verifies Domicilios label in Navbar, absence of Rastrear Domicilio, and clean footer without bullets', () => {
    const { container } = render(<App />);

    // Verify Navbar shows 'Domicilios' and not 'Santa Rosa Domicilios: 25-35 min'
    expect(screen.getByText('Domicilios')).toBeDefined();
    expect(screen.queryByText('Santa Rosa Domicilios: 25-35 min')).toBeNull();

    // Verify 'Rastrear Domicilio' is completely removed from Hero and page
    expect(screen.queryByText('Rastrear Domicilio')).toBeNull();

    // Verify footer compact text does not have divider dots '•'
    const compactFooter = container.querySelector('.bg-\\[\\#1c140e\\]');
    expect(compactFooter).toBeDefined();
    expect(compactFooter?.textContent).not.toContain('•');
  });

  it('closes active modals and drawers when Escape is pressed', () => {
    render(<App />);

    // Open cart drawer via cart button
    const cartBtn = screen.getByLabelText(/Carrito de compras/);
    expect(cartBtn).toBeDefined();
    fireEvent.click(cartBtn);
    expect(screen.getByText('Tu Canasta de Mercado')).toBeDefined();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Tu Canasta de Mercado')).toBeNull();
  });

  it('renders cart trigger as an icon-only button without price or "Mi Canasta" text in desktop header', () => {
    render(<App />);

    const cartBtn = screen.getByLabelText(/Carrito de compras/);
    expect(cartBtn).toBeDefined();
    // Verify only the badge number is displayed without 'Mi Canasta' text or prices
    expect(cartBtn.textContent?.trim()).toBe('3');
    expect(cartBtn.querySelector('svg')).toBeDefined();
  });

  it('increments quantity when adding an already existing product from catalog', () => {
    render(<App />);

    // Initial count is 3 (1 aguacate + 1 leche + 1 arroz)
    expect(screen.getByText('3')).toBeDefined();

    // Navigate to dedicated catalog page
    fireEvent.click(screen.getByRole('link', { name: /Catálogo/ }));
    expect(screen.getByText('Lo Más Fresco para tu Hogar')).toBeDefined();

    // Click Agregar on the first product (Arroz Supremo)
    const addBtns = screen.getAllByLabelText(/Agregar /);
    fireEvent.click(addBtns[0]);

    // Cart count should increment to 4
    expect(screen.getByText('4')).toBeDefined();
  });

  it('synchronizes section navigation in Navbar with App views', () => {
    render(<App />);

    // Click 'Catálogo' in the top navbar
    const catalogoNav = screen.getByRole('link', { name: /Catálogo/ });
    fireEvent.click(catalogoNav);

    // ProductCatalog should now be rendered with 8 pasillos
    expect(screen.getByText('Lo Más Fresco para tu Hogar')).toBeDefined();
    expect(screen.getAllByText('Catálogo de Productos & 8 Pasillos').length).toBeGreaterThan(0);

    // Click 'Servicios & Colanta' in the top navbar
    const serviciosNav = screen.getByRole('link', { name: /Servicios & Colanta/ });
    fireEvent.click(serviciosNav);
    expect(screen.getByText('CARNICERIA COLANTA')).toBeDefined();

    // Click 'Avisos'
    const avisosNav = screen.getByRole('link', { name: /Avisos/ });
    fireEvent.click(avisosNav);
    expect(screen.getAllByText('Canal de Avisos & Novedades').length).toBeGreaterThan(0);

    // Click 'Inicio' to return to hero without scroll
    const inicioNav = screen.getByRole('link', { name: /Inicio/ });
    fireEvent.click(inicioNav);
    expect(screen.getByText('Ver Catálogo (8 Pasillos)')).toBeDefined();

    // Verify 'Datos Personales' is NOT in the top navigation bar of sections
    const topNav = screen.getByRole('navigation', { name: 'Navegación principal de secciones' });
    expect(topNav.textContent).not.toContain('Datos Personales');

    // Verify 'Tratamiento de Datos' is present in the footer
    expect(screen.getByRole('button', { name: 'Tratamiento de Datos' })).toBeDefined();
  });

  it('verifies quote in AdditionalServices has no colored border and tags are neutral', () => {
    const { container } = render(<AdditionalServices />);
    // The quote should exist and have no border-[#F06522] or orange-50 classes
    const blockquote = container.querySelector('blockquote');
    expect(blockquote).not.toBeNull();
    expect(blockquote?.className).not.toContain('border-[#F06522]');
    expect(blockquote?.className).not.toContain('bg-orange-');

    // Verify tags have no colorful classes (red, emerald, blue, amber)
    const tagElements = container.querySelectorAll('span');
    const hasLoudColorTags = Array.from(tagElements).some((el) =>
      /\bbg-(red|emerald|blue|amber)-[0-9]{2,3}\b/.test(el.className)
    );
    expect(hasLoudColorTags).toBe(false);
  });

  it('strictly verifies index.html and catalogo.html have no Bogota, no Calidad y Frescura para tu Hogar, and target Santa Rosa de Osos', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');

    expect(indexHtml).not.toMatch(/Bogot[aá]/i);
    expect(indexHtml).not.toContain('Calidad y Frescura para tu Hogar');
    expect(indexHtml).toContain('Santa Rosa de Osos');

    const catalogoPath = path.resolve(__dirname, '../../catalogo.html');
    const catalogoHtml = fs.readFileSync(catalogoPath, 'utf8');

    expect(catalogoHtml).not.toMatch(/Bogot[aá]/i);
    expect(catalogoHtml).not.toContain('Calidad y Frescura para tu Hogar');
    expect(catalogoHtml).toContain('Santa Rosa de Osos');
  });

  describe('Turso Backend Services & Resilience', () => {
    it('verifies Turso client instance and schema initialization', async () => {
      const client = getTursoClient();
      expect(client).toBeDefined();
      expect(typeof client.execute).toBe('function');
      expect(typeof client.batch).toBe('function');

      await expect(initTursoDatabase()).resolves.toBeUndefined();
    });

    it('persists and retrieves orders via orderService with Turso and local cache', async () => {
      const testOrder = {
        orderNumber: '#OSOS-TEST-999',
        items: [{ id: 'test-1', name: 'Papa Criolla', price: 3500, qty: 2, image: '', category: 'Frutas y Verduras' }],
        subtotal: 7000,
        discount: 0,
        shipping: 4500,
        total: 11500,
        address: 'Calle Real # 30-12',
        notes: 'Timbre 2',
        slot: 'express',
        paymentMethod: 'contraentrega',
        estimatedMinutes: '25-35 min',
      };

      const saveOk = await orderService.saveOrder(testOrder);
      expect(saveOk).toBe(true);

      const retrieved = await orderService.getOrderById('#OSOS-TEST-999');
      expect(retrieved).toBeDefined();
      expect(retrieved?.orderNumber).toBe('#OSOS-TEST-999');
      expect(retrieved?.total).toBe(11500);

      const all = await orderService.getAllOrders();
      expect(all.some((o) => o.orderNumber === '#OSOS-TEST-999')).toBe(true);
    });

    it('handles offline fallback gracefully in orderService when Turso rejects', async () => {
      const executeSpy = vi.spyOn(tursoClient, 'execute').mockRejectedValueOnce(new Error('Network Offline'));
      const fallbackOrder = {
        orderNumber: '#OSOS-OFFLINE-001',
        items: [{ id: 'test-off', name: 'Leche', price: 3200, qty: 1, image: '' }],
        subtotal: 3200,
        discount: 0,
        shipping: 0,
        total: 3200,
        address: 'Sector Los Osos',
        notes: '',
        slot: 'express',
        paymentMethod: 'efectivo',
        estimatedMinutes: '25-35 min',
      };

      const saved = await orderService.saveOrder(fallbackOrder);
      expect(saved).toBe(true);

      const fetched = await orderService.getOrderById('#OSOS-OFFLINE-001');
      expect(fetched?.orderNumber).toBe('#OSOS-OFFLINE-001');

      executeSpy.mockRestore();
    });

    it('fetches products via productService with category filtering and Turso mapping', async () => {
      const products = await productService.fetchProducts();
      expect(products.length).toBeGreaterThan(0);

      const abarrotes = await productService.fetchProductsByCategory('abarrotes');
      expect(abarrotes.every((p) => p.category === 'abarrotes')).toBe(true);

      const ofertas = await productService.fetchProductsByCategory('ofertas');
      expect(ofertas.every((p) => (p.originalPrice !== undefined && p.originalPrice > p.price) || p.badgeType === 'discount')).toBe(true);

      const todos = await productService.fetchProductsByCategory('todos');
      expect(todos.length).toBe(products.length);
    });

    it('handles offline fallback in productService when Turso query fails', async () => {
      const executeSpy = vi.spyOn(tursoClient, 'execute').mockRejectedValueOnce(new Error('Connection Failed'));
      const products = await productService.fetchProducts();
      expect(products.length).toBeGreaterThan(0);
      expect(products[0].name).toBeDefined();
      executeSpy.mockRestore();
    });

    it('submits job applications via careerService and falls back gracefully on error', async () => {
      const resSuccess = await careerService.saveJobApplication({
        fullName: 'Juan Gomez',
        email: 'juan@santarosa.co',
        phone: '3109998877',
        position: 'cajas',
        message: 'Disponibilidad inmediata en Santa Rosa de Osos',
        cvFilename: 'cv_juan_gomez.pdf',
      });
      expect(resSuccess).toBe(true);

      const executeSpy = vi.spyOn(tursoClient, 'execute').mockRejectedValueOnce(new Error('Turso Unavailable'));
      const resFallback = await careerService.saveJobApplication({
        fullName: 'Marta Diaz',
        email: 'marta@santarosa.co',
        phone: '3121112233',
        position: 'bodega',
      });
      expect(resFallback).toBe(true);
      executeSpy.mockRestore();
    });

    it('manages newsletter subscriptions and detects duplicate subscribers', async () => {
      const email = `test-newsletter-${Date.now()}@santarosa.com`;
      const firstSub = await newsletterService.subscribeNewsletter(email);
      expect(firstSub.success).toBe(true);
      expect(firstSub.message).toContain('¡Gracias por suscribirte!');

      // Subscribing again with the same email
      const duplicateSub = await newsletterService.subscribeNewsletter(email);
      expect(duplicateSub.success).toBe(true);
      expect(duplicateSub.message).toContain('Ya estás registrado');

      // Offline fallback
      const executeSpy = vi.spyOn(tursoClient, 'execute').mockRejectedValueOnce(new Error('Network Offline'));
      const fallbackSub = await newsletterService.subscribeNewsletter('offline-user@santarosa.com');
      expect(fallbackSub.success).toBe(true);
      executeSpy.mockRestore();
    });

    it('records contact inquiries via contactService and handles offline fallback', async () => {
      const resSuccess = await contactService.saveContactMessage({
        name: 'Maria Perez',
        email: 'maria@santarosa.com',
        phone: '3112223344',
        message: 'Consulta sobre pedidos al por mayor en Santa Rosa de Osos',
      });
      expect(resSuccess).toBe(true);

      const executeSpy = vi.spyOn(tursoClient, 'execute').mockRejectedValueOnce(new Error('Turso down'));
      const resFallback = await contactService.saveContactMessage({
        name: 'Carlos Ruiz',
        email: 'carlos@santarosa.com',
        phone: '3155556677',
        message: 'Horarios de fin de semana',
      });
      expect(resFallback).toBe(true);
      executeSpy.mockRestore();
    });

    it('fetches notices via noticeService with Turso parsing and offline fallback', async () => {
      const notices = await noticeService.fetchNotices();
      expect(notices.length).toBeGreaterThan(0);
      expect(notices[0].title).toBeDefined();
      expect(Array.isArray(notices[0].content)).toBe(true);

      const executeSpy = vi.spyOn(tursoClient, 'execute').mockRejectedValueOnce(new Error('Turso timeout'));
      const fallbackNotices = await noticeService.fetchNotices();
      expect(fallbackNotices.length).toBeGreaterThan(0);
      expect(fallbackNotices[0].category).toBeDefined();
      executeSpy.mockRestore();
    });

    it('integrates CareersSection UI submission with careerService.saveJobApplication', async () => {
      const saveSpy = vi.spyOn(careerService, 'saveJobApplication');
      render(<CareersSection />);

      fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Sofia Vergara' } });
      fireEvent.change(screen.getByLabelText('Correo electrónico*'), { target: { value: 'sofia@santarosa.co' } });
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByText('Postularse Ahora'));

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Sofia Vergara',
          email: 'sofia@santarosa.co',
        })
      );
      expect(screen.getByText('¡Postulación Recibida!')).toBeDefined();
      saveSpy.mockRestore();
    });

    it('integrates ContactSection UI submission with contactService.saveContactMessage', async () => {
      const saveSpy = vi.spyOn(contactService, 'saveContactMessage');
      render(<ContactSection />);

      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Pedro Gomez' } });
      fireEvent.change(screen.getByLabelText('Correo electrónico*'), { target: { value: 'pedro@santarosa.co' } });
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByText('Enviar Mensaje'));

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Pedro Gomez',
          email: 'pedro@santarosa.co',
        })
      );
      expect(screen.getByText('¡Mensaje Enviado con Éxito!')).toBeDefined();
      saveSpy.mockRestore();
    });

    it('integrates NewsletterSection UI submission with newsletterService.subscribeNewsletter', async () => {
      const subSpy = vi.spyOn(newsletterService, 'subscribeNewsletter').mockResolvedValueOnce({
        success: true,
        message: '¡Te has suscrito con éxito!',
      });
      render(<NewsletterSection />);

      const emailInput = screen.getByPlaceholderText(/Ingresa tu correo electrónico/);
      fireEvent.change(emailInput, { target: { value: 'cliente-nuevo@santarosa.com' } });
      fireEvent.click(screen.getByText('Registrarse'));

      expect(subSpy).toHaveBeenCalledWith('cliente-nuevo@santarosa.com');
      await waitFor(() => {
        expect(screen.getByText('¡Gracias por suscribirte!')).toBeDefined();
      });
      subSpy.mockRestore();
    });

    it('integrates CheckoutDrawer order confirmation with orderService.saveOrder', async () => {
      const saveSpy = vi.spyOn(orderService, 'saveOrder');
      render(
        <CheckoutDrawer
          isOpen={true}
          onClose={vi.fn()}
          items={MOCK_ITEMS}
          onUpdateQty={vi.fn()}
          onRemoveItem={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Continuar con Entrega y Pago'));
      fireEvent.click(screen.getByText('Confirmar Pedido por WhatsApp'));

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ name: 'Aguacate Hass de Exportación (1 kg)' }),
          ]),
        })
      );
      expect(screen.getByText('¡Pedido Registrado!')).toBeDefined();
      saveSpy.mockRestore();
    });

    it('verifies NoticeBoard renders as a blog-style editorial table without cards and without pills', () => {
      const { container } = render(<NoticeBoard />);
      
      // Should have gazette header
      expect(screen.getByText('Gaceta Informativa Oficial')).toBeDefined();
      
      // Should render semantic table headers in blog table
      expect(screen.getByText('Fecha')).toBeDefined();
      expect(screen.getAllByText('Categoría').length).toBeGreaterThan(0);
      expect(screen.getByText('Aviso / Publicación')).toBeDefined();
      expect(screen.getByText('Emisor')).toBeDefined();
      expect(screen.getByText('Lectura')).toBeDefined();

      // Should have interactive 'Leer entrada' actions
      expect(screen.getAllByText('Leer entrada').length).toBeGreaterThan(0);

      // Verify NO cards (zero article tags) and NO rounded-full pills
      expect(container.querySelectorAll('article').length).toBe(0);
      expect(container.querySelectorAll('.rounded-full').length).toBe(0);
      expect(container.querySelector('table')).not.toBeNull();
    });

    it('verifies absence of rounded-full pills across key components', () => {
      const { container: appContainer } = render(<App />);
      expect(appContainer.querySelectorAll('.rounded-full').length).toBe(0);

      const { container: navbarContainer } = render(
        <Navbar
          cartCount={3}
          cartTotal={45000}
          onOpenCart={vi.fn()}
          onOrderClick={vi.fn()}
          activeView="inicio"
          onNavigateView={vi.fn()}
        />
      );
      expect(navbarContainer.querySelectorAll('.rounded-full').length).toBe(0);

      const { container: contactContainer } = render(<ContactSection />);
      expect(contactContainer.querySelectorAll('.rounded-full').length).toBe(0);

      const { container: careersContainer } = render(<CareersSection />);
      expect(careersContainer.querySelectorAll('.rounded-full').length).toBe(0);
    });

    it('verifies clean typography eyebrows without status boxes and without "• Santa Rosa de Osos"', () => {
      const { container: catContainer } = render(
        <ProductCatalog
          searchQuery=""
          selectedCategory="todos"
          onSelectCategory={vi.fn()}
          onAddToCart={vi.fn()}
        />
      );
      expect(screen.getByText('Selección Fresca del Día')).toBeDefined();
      expect(screen.queryByText('Selección Fresca del Día • Santa Rosa de Osos')).toBeNull();
      expect(catContainer.querySelector('.inline-flex.bg-stone-100')).toBeNull();

      const { container: noticeContainer } = render(<NoticeBoard />);
      expect(screen.getByText('Gaceta Informativa Oficial')).toBeDefined();
      expect(screen.queryByText('Gaceta Informativa Oficial • Santa Rosa de Osos')).toBeNull();
      expect(noticeContainer.querySelector('.inline-flex.bg-stone-100')).toBeNull();

      const { container: careersContainer } = render(<CareersSection />);
      expect(screen.getByText('Oportunidades Laborales')).toBeDefined();
      expect(screen.queryByText('Oportunidades Laborales • Santa Rosa de Osos')).toBeNull();
      expect(careersContainer.querySelector('.inline-flex.bg-stone-100')).toBeNull();

      const { container: contactContainer } = render(<ContactSection />);
      expect(screen.getByText('Atención al Cliente')).toBeDefined();
      expect(screen.queryByText('Atención al Cliente • Santa Rosa de Osos')).toBeNull();
      expect(contactContainer.querySelector('.inline-flex.bg-stone-100')).toBeNull();
    });
  });
});
