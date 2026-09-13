import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Banknote,
  Smartphone,
  Sparkles,
  ChevronRight,
  Store,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { SANTA_ROSA_NEIGHBORHOODS } from '../data/products';
import { saveOrder } from '../../services/orderService';

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  qty: number;
  unit?: string;
  image: string;
  category?: string;
}

export interface PlacedOrder {
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  discount?: number;
  shipping: number;
  total: number;
  address: string;
  notes?: string;
  slot: string;
  paymentMethod: string;
  paymentDetails?: string;
  estimatedMinutes?: string;
  status?: string;
  createdAt?: string;
  customerName?: string;
  customerPhone?: string;
}

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (id: number | string, delta: number) => void;
  onRemoveItem: (id: number | string) => void;
  onClearCart?: () => void;
  onOrderPlaced?: (order: PlacedOrder) => void;
  onExploreCatalog?: () => void;
  onOpenPrivacyPolicy?: () => void;
}

const STANDARD_SHIPPING_FEE = 4500;
const STORE_PICKUP_ADDRESS = 'Sede Central Calle 30 # 29-15, Santa Rosa de Osos';
const WHATSAPP_PHONE = '573105550199';

function generateOrderNumber(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `#OSOS-${randomSuffix}`;
}

export const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  onExploreCatalog,
  onOpenPrivacyPolicy,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart');
  const [deliveryType, setDeliveryType] = useState<'tienda' | 'domicilio'>('tienda');
  const [neighborhood, setNeighborhood] = useState<string>('Centro');
  const [address, setAddress] = useState('Carrera 30 # 29-15');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [notes, setNotes] = useState('Dejar en portería');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [cashExact, setCashExact] = useState(false);
  const [cashChangeFor, setCashChangeFor] = useState('50000');
  const [cashError, setCashError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<PlacedOrder | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen && step === 'confirmation') {
      setStep('cart');
      setCompletedOrder(null);
      setWhatsappUrl('');
      setAddressError(null);
      setCashError(null);
    }
  }

  const handleClose = () => {
    if (step === 'confirmation') {
      setStep('cart');
      setCompletedOrder(null);
      setWhatsappUrl('');
      setAddressError(null);
      setCashError(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  const totalItemCount = items.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingCost = deliveryType === 'domicilio' ? STANDARD_SHIPPING_FEE : 0;
  const grandTotal = Math.max(0, subtotal + shippingCost);

  const handleConfirmOrder = () => {
    setAddressError(null);
    setCashError(null);

    // Only validate address when deliveryType is 'domicilio'
    if (deliveryType === 'domicilio' && !address.trim()) {
      setAddressError('Por favor ingresa la dirección de entrega en Santa Rosa de Osos (ej. Carrera 30 # 29-15)');
      return;
    }

    if (paymentMethod === 'efectivo' && !cashExact) {
      const cashVal = parseInt(cashChangeFor, 10);
      if (isNaN(cashVal) || cashVal < grandTotal) {
        setCashError(`El valor del billete debe ser mayor o igual al total ($${grandTotal.toLocaleString('es-CO')})`);
        return;
      }
    }

    const effectiveCashChange = parseInt(cashChangeFor || grandTotal.toString(), 10);
    const orderNum = generateOrderNumber();

    const paymentDescription =
      paymentMethod === 'efectivo'
        ? cashExact
          ? 'Efectivo (Monto exacto, sin cambio)'
          : `Efectivo (Cambio para $${effectiveCashChange.toLocaleString('es-CO')})`
        : 'Transferencia / Tarjeta física / QR (Nequi, Daviplata, Bancolombia QR o Datáfono)';

    const destinationAddress =
      deliveryType === 'tienda'
        ? STORE_PICKUP_ADDRESS
        : `${address.trim()} (${neighborhood})`;

    const orderData: PlacedOrder = {
      orderNumber: orderNum,
      items: [...items],
      subtotal,
      discount: 0,
      shipping: shippingCost,
      total: grandTotal,
      address: destinationAddress,
      notes: notes.trim(),
      slot: deliveryType === 'tienda' ? 'Recoger en Sede Central' : 'Envío a Domicilio Santa Rosa de Osos',
      paymentMethod: paymentDescription,
      estimatedMinutes: deliveryType === 'tienda' ? 'Listo en tienda física' : '25-35 min aprox.',
    };

    // Format message for WhatsApp
    const lines = [
      '*SUPERMERCADO OSOS - NUEVO PEDIDO*',
      `*Pedido:* ${orderNum}`,
      '----------------------------------',
      `*Modalidad:* ${deliveryType === 'tienda' ? `Recoger en Tienda (${STORE_PICKUP_ADDRESS})` : `Domicilio en ${neighborhood} - ${address.trim()}`}`,
      notes.trim() ? `*Notas:* ${notes.trim()}` : null,
      `*Forma de Pago:* ${paymentDescription}`,
      '----------------------------------',
      '*Productos a Reservar:*',
      ...items.map((item) => `• ${item.qty}x ${item.name} - $${(item.price * item.qty).toLocaleString('es-CO')}`),
      '----------------------------------',
      deliveryType === 'domicilio'
        ? `*Domicilio:* $${shippingCost.toLocaleString('es-CO')}`
        : '*Entrega:* $0 (Recogida en tienda física)',
      `*TOTAL:* $${grandTotal.toLocaleString('es-CO')}`,
      '----------------------------------',
      'Hola Supermercado Osos, confirmo mi pedido para tenerlo listo.',
    ].filter(Boolean) as string[];

    const waMessage = lines.join('\n');
    const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(waMessage)}`;

    setWhatsappUrl(waUrl);
    try {
      window.open(waUrl, '_blank');
    } catch {
      // Ignore popup blocker errors; user can still click link in confirmation
    }

    void saveOrder(orderData);
    setCompletedOrder(orderData);
    setStep('confirmation');
    onOrderPlaced?.(orderData);
    onClearCart?.();
  };

  const handleResetOrder = () => {
    setStep('cart');
    setCompletedOrder(null);
    setWhatsappUrl('');
    setAddressError(null);
    setCashError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-drawer-title"
    >
      {/* Clickable Backdrop */}
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Main Drawer Container */}
      <aside className="relative w-full max-w-full sm:max-w-md md:max-w-lg bg-white h-[100dvh] shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300 border-l border-stone-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F06522] flex items-center justify-center font-bold">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 id="checkout-drawer-title" className="text-base sm:text-lg font-bold text-stone-900 leading-tight font-editorial">
                {step === 'confirmation' ? '¡Pedido Registrado!' : step === 'checkout' ? 'Reservar Pedido' : 'Tu Canasta de Mercado'}
              </h2>
              <p className="text-xs text-stone-500">
                {step === 'confirmation' ? 'Listo para enviar por WhatsApp' : `${totalItemCount} ${totalItemCount === 1 ? 'producto' : 'productos'} seleccionados`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar carrito"
            className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Center Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {/* VIEW 1: CART ITEMS */}
          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
                  <div className="w-20 h-20 rounded-3xl bg-orange-50 text-[#F06522] flex items-center justify-center text-3xl mb-4 border border-orange-100 shadow-inner">
                    <ShoppingBag size={36} />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">Tu canasta está vacía</h3>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xs leading-relaxed">
                    Descubre frutas cosechadas del día, carnes premium y panadería recién horneada en Santa Rosa de Osos.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onExploreCatalog?.();
                    }}
                    className="mt-6 px-6 py-2.5 bg-[#F06522] hover:bg-[#d94f13] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Explorar Catálogo de Productos
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Table Control Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-600 font-caledonia">
                        Detalle del Pedido
                      </span>
                      <span className="text-[11px] text-stone-400 font-caledonia">
                        ({totalItemCount} {totalItemCount === 1 ? 'artículo' : 'artículos'})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="text-xs text-stone-500 hover:text-rose-600 font-medium transition-colors cursor-pointer"
                    >
                      Vaciar canasta
                    </button>
                  </div>

                  {/* Formal Order Table (No Cards) */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse table-fixed" role="table">
                      <thead className="bg-stone-50/90 border-b border-stone-200 text-[10px] sm:text-[11px] uppercase tracking-wider text-stone-600 font-bold font-caledonia">
                        <tr>
                          <th scope="col" className="py-2.5 pl-3 pr-2 w-[46%] sm:w-[50%] font-bold">Artículo</th>
                          <th scope="col" className="py-2.5 px-1 text-center w-[25%] sm:w-[23%] font-bold">Cant.</th>
                          <th scope="col" className="py-2.5 px-2 text-right w-[22%] sm:w-[21%] font-bold whitespace-nowrap">Importe</th>
                          <th scope="col" className="py-2.5 pr-2.5 pl-1 w-[7%] sm:w-[6%] text-center font-bold">
                            <span className="sr-only">Acciones</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-xs">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                            {/* Product Info Column */}
                            <td className="py-2.5 pl-3 pr-2 align-middle">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-stone-100 border border-stone-200 shrink-0 overflow-hidden">
                                  {item.image.startsWith('http') ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full text-stone-400 flex items-center justify-center">
                                      <ShoppingBag size={15} />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-caledonia font-bold text-stone-900 leading-tight truncate text-xs sm:text-sm">
                                    {item.name}
                                  </p>
                                  <p className="text-[10px] sm:text-[11px] text-stone-400 font-caledonia mt-0.5 truncate">
                                    ${item.price.toLocaleString('es-CO')} c/u
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Quantity Column */}
                            <td className="py-2.5 px-1 align-middle text-center">
                              <div className="inline-flex items-center border border-stone-200 rounded-md bg-stone-50/70 p-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.qty <= 1) {
                                      onRemoveItem(item.id);
                                    } else {
                                      onUpdateQty(item.id, -1);
                                    }
                                  }}
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm flex items-center justify-center text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 active:scale-90 transition-transform cursor-pointer touch-manipulation"
                                  aria-label={`Disminuir cantidad de ${item.name}`}
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="w-4 sm:w-5 text-center font-bold text-stone-800 text-xs font-caledonia">
                                  {item.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(item.id, 1)}
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm flex items-center justify-center text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 active:scale-90 transition-transform cursor-pointer touch-manipulation"
                                  aria-label={`Aumentar cantidad de ${item.name}`}
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                            </td>

                            {/* Line Subtotal Column */}
                            <td className="py-2.5 px-2 align-middle text-right font-caledonia">
                              <span className="font-bold text-stone-900 text-xs sm:text-sm whitespace-nowrap">
                                ${(item.price * item.qty).toLocaleString('es-CO')}
                              </span>
                            </td>

                            {/* Remove Action Column */}
                            <td className="py-2.5 pr-2.5 pl-1 align-middle text-center">
                              <button
                                type="button"
                                onClick={() => onRemoveItem(item.id)}
                                className="p-1 text-stone-300 hover:text-rose-600 transition-colors cursor-pointer"
                                aria-label={`Eliminar ${item.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Formal Editorial Footer Note (No Card/Box) */}
                  <div className="pt-2 px-1 flex items-start gap-2 text-stone-500 text-[11px] font-caledonia">
                    <span className="text-[#5A3825] font-bold shrink-0">•</span>
                    <p className="leading-relaxed">
                      Alistamiento directo en nuestro local físico de Santa Rosa de Osos (Calle 30 # 29-15) para entrega personal o despacho a domicilio.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* VIEW 2: CHECKOUT STEP (Modalidad de entrega y método de pago estilo tabla formal) */}
          {step === 'checkout' && (
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Back to cart button */}
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#F06522] font-semibold transition-colors cursor-pointer pb-1 font-caledonia"
              >
                ← Volver a revisar productos
              </button>

              {/* SECTION 1: TABLA FORMAL - MODALIDAD DE ENTREGA */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="bg-stone-50/80 px-3.5 py-2.5 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 text-xs sm:text-sm font-caledonia">
                    <MapPin size={15} className="text-[#F06522]" />
                    <span>1. Modalidad de Entrega</span>
                  </div>
                  <span className="text-[11px] text-stone-500 font-caledonia">Elige una modalidad</span>
                </div>

                <table className="w-full text-left border-collapse text-xs" role="table">
                  <tbody className="divide-y divide-stone-150 font-caledonia">
                    {/* Option: Recoger en Tienda */}
                    <tr
                      onClick={() => {
                        setDeliveryType('tienda');
                        setAddressError(null);
                      }}
                      className={`cursor-pointer transition-colors ${
                        deliveryType === 'tienda' ? 'bg-orange-50/40' : 'hover:bg-stone-50/60'
                      }`}
                    >
                      <td className="py-3 px-3.5 align-top w-8">
                        <input
                          type="radio"
                          name="deliveryType"
                          checked={deliveryType === 'tienda'}
                          onChange={() => {
                            setDeliveryType('tienda');
                            setAddressError(null);
                          }}
                          className="mt-0.5 accent-[#F06522] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 pr-2 align-top">
                        <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs sm:text-sm">
                          <Store size={15} className="text-[#F06522] shrink-0" />
                          <span>Recoger en Tienda</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          Tener productos listos en el local físico. Alistamos tu canasta en caja.
                        </p>
                      </td>
                      <td className="py-3 pr-3.5 align-top text-right whitespace-nowrap">
                        <span className="text-emerald-700 font-medium text-xs">Sin costo ($0)</span>
                      </td>
                    </tr>

                    {/* Option: Envío a Domicilio */}
                    <tr
                      onClick={() => setDeliveryType('domicilio')}
                      className={`cursor-pointer transition-colors ${
                        deliveryType === 'domicilio' ? 'bg-orange-50/40' : 'hover:bg-stone-50/60'
                      }`}
                    >
                      <td className="py-3 px-3.5 align-top w-8">
                        <input
                          type="radio"
                          name="deliveryType"
                          checked={deliveryType === 'domicilio'}
                          onChange={() => setDeliveryType('domicilio')}
                          className="mt-0.5 accent-[#F06522] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 pr-2 align-top">
                        <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs sm:text-sm">
                          <Truck size={15} className="text-[#F06522] shrink-0" />
                          <span>Envío a Domicilio</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          Entrega directa en el área urbana de Santa Rosa de Osos ($4.500).
                        </p>
                      </td>
                      <td className="py-3 pr-3.5 align-top text-right whitespace-nowrap">
                        <span className="text-stone-900 font-bold text-xs">$4.500</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Sub-view embedded in the table container */}
                {deliveryType === 'tienda' ? (
                  <div className="border-t border-stone-200 p-3.5 space-y-3 bg-stone-50/30 font-caledonia">
                    <div className="text-xs text-stone-700 space-y-1">
                      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        Punto de Recogida:
                      </div>
                      <p className="text-xs font-bold text-stone-900">
                        {STORE_PICKUP_ADDRESS}
                      </p>
                      <p className="text-[11px] text-stone-500 leading-snug">
                        Reservamos tus productos frescos y los dejamos listos para que solo pases a recogerlos sin filas.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="tienda-notes-input" className="block text-[11px] font-bold text-stone-700 mb-1">
                        Nombre de quien recoge o indicación especial (opcional)
                      </label>
                      <input
                        id="tienda-notes-input"
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej. Recoge Juan Pérez en 30 minutos"
                        className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:border-[#F06522] text-stone-900"
                      />
                      <div className="flex gap-1.5 flex-wrap pt-1.5">
                        {['Paso en 30 min', 'Paso en la tarde', 'A nombre de quien pide'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setNotes(preset)}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-sm border transition-colors cursor-pointer ${
                              notes === preset
                                ? 'bg-stone-800 text-white border-stone-800'
                                : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-stone-200 p-3.5 space-y-3 bg-stone-50/30 font-caledonia">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="neighborhood-select" className="block text-[11px] font-bold text-stone-700 mb-1">
                          Barrio / Sector en Santa Rosa
                        </label>
                        <select
                          id="neighborhood-select"
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:border-[#F06522] text-stone-900 cursor-pointer"
                        >
                          {SANTA_ROSA_NEIGHBORHOODS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="address-input" className="block text-[11px] font-bold text-stone-700 mb-1">
                          Dirección completa
                        </label>
                        <input
                          id="address-input"
                          type="text"
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            if (addressError) setAddressError(null);
                          }}
                          placeholder="Ej. Carrera 30 # 29-15"
                          className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-hidden text-stone-900 ${
                            addressError
                              ? 'border-rose-500 focus:border-rose-500'
                              : 'border-stone-300 focus:border-[#F06522]'
                          }`}
                        />
                        {addressError && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-1">{addressError}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="domicilio-notes-input" className="block text-[11px] font-bold text-stone-700 mb-1">
                        Apartamento, casa o notas para el domiciliario
                      </label>
                      <input
                        id="domicilio-notes-input"
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej. Casa de reja blanca, dejar en portería"
                        className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:border-[#F06522] text-stone-900"
                      />
                      <div className="flex gap-1.5 flex-wrap pt-1.5">
                        {['Dejar en portería', 'Llamar al llegar', 'Casa de reja blanca', 'Timbre no funciona'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setNotes(preset)}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-sm border transition-colors cursor-pointer ${
                              notes === preset
                                ? 'bg-stone-800 text-white border-stone-800'
                                : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: TABLA FORMAL - FORMA DE PAGO */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="bg-stone-50/80 px-3.5 py-2.5 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 text-xs sm:text-sm font-caledonia">
                    <Banknote size={15} className="text-[#F06522]" />
                    <span>2. Forma de Pago</span>
                  </div>
                  <span className="text-[11px] text-stone-500 font-caledonia">¿Cómo vas a pagar?</span>
                </div>

                <table className="w-full text-left border-collapse text-xs" role="table">
                  <tbody className="divide-y divide-stone-150 font-caledonia">
                    {/* Option: Efectivo */}
                    <tr
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`cursor-pointer transition-colors ${
                        paymentMethod === 'efectivo' ? 'bg-orange-50/40' : 'hover:bg-stone-50/60'
                      }`}
                    >
                      <td className="py-3 px-3.5 align-top w-8">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'efectivo'}
                          onChange={() => setPaymentMethod('efectivo')}
                          className="mt-0.5 accent-[#F06522] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 pr-3.5 align-top">
                        <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs sm:text-sm">
                          <Banknote size={15} className="text-[#F06522] shrink-0" />
                          <span>Efectivo</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          {deliveryType === 'tienda' ? 'En caja al momento de recoger los productos.' : 'Contraentrega al recibir el domicilio con cambio.'}
                        </p>
                      </td>
                    </tr>

                    {/* Option: Transferencia / QR / Tarjeta */}
                    <tr
                      onClick={() => {
                        setPaymentMethod('transferencia');
                        setCashError(null);
                      }}
                      className={`cursor-pointer transition-colors ${
                        paymentMethod === 'transferencia' ? 'bg-orange-50/40' : 'hover:bg-stone-50/60'
                      }`}
                    >
                      <td className="py-3 px-3.5 align-top w-8">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'transferencia'}
                          onChange={() => {
                            setPaymentMethod('transferencia');
                            setCashError(null);
                          }}
                          className="mt-0.5 accent-[#F06522] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 pr-3.5 align-top">
                        <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs sm:text-sm">
                          <Smartphone size={15} className="text-[#F06522] shrink-0" />
                          <span>Transferencia / QR / Tarjeta</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          Nequi, Daviplata, QR Bancolombia o Datáfono físico.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {paymentMethod === 'efectivo' && (
                  <div className="border-t border-stone-200 p-3.5 space-y-3 bg-stone-50/30 font-caledonia">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label htmlFor="custom-cash" className="block text-[11px] font-bold text-stone-700">
                        ¿Con qué valor de billete vas a pagar?
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCashExact(!cashExact);
                          setCashError(null);
                        }}
                        className={`text-[11px] font-medium px-2.5 py-1 border rounded-md transition-colors cursor-pointer ${
                          cashExact
                            ? 'bg-stone-800 text-white border-stone-800'
                            : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                        }`}
                      >
                        {cashExact ? 'Valor exacto' : 'Pagaré con cambio'}
                      </button>
                    </div>

                    {!cashExact ? (
                      <div className="space-y-2.5">
                        {/* Tabular selection for common denominations */}
                        <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
                          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-stone-200 text-center text-xs">
                            {[20000, 50000, 100000, 200000]
                              .filter((b) => b >= grandTotal)
                              .concat(
                                grandTotal > 200000
                                  ? [Math.ceil(grandTotal / 50000) * 50000]
                                  : []
                              )
                              .map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => {
                                    setCashChangeFor(val.toString());
                                    setCashError(null);
                                  }}
                                  className={`py-2 px-1 font-caledonia transition-colors cursor-pointer text-xs ${
                                    cashChangeFor === val.toString()
                                      ? 'bg-[#5A3825] text-white font-bold'
                                      : 'bg-white text-stone-700 hover:bg-stone-50 font-medium'
                                  }`}
                                >
                                  ${val.toLocaleString('es-CO')}
                                </button>
                              ))}
                          </div>
                        </div>

                        {/* Custom Cash Input Row */}
                        <div className="flex items-center gap-2">
                          <label htmlFor="custom-cash" className="text-[11px] text-stone-600 font-medium whitespace-nowrap">
                            Otro valor:
                          </label>
                          <div className="relative flex-1 max-w-[170px]">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-caledonia">$</span>
                            <input
                              id="custom-cash"
                              type="number"
                              value={cashChangeFor}
                              onChange={(e) => {
                                setCashChangeFor(e.target.value);
                                if (cashError) setCashError(null);
                              }}
                              placeholder="Ej. 70000"
                              className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-hidden focus:border-[#F06522]"
                            />
                          </div>
                        </div>

                        {/* Change calculation displayed as formal text (No colored boxes/capsules) */}
                        {(() => {
                          const cashVal = parseInt(cashChangeFor, 10);
                          if (isNaN(cashVal)) return null;
                          if (cashVal >= grandTotal) {
                            const change = cashVal - grandTotal;
                            return (
                              <div className="pt-1 text-xs text-stone-700 font-caledonia flex items-center justify-between border-t border-stone-200">
                                <span className="text-stone-500">Tu cambio será de:</span>
                                <span className="font-bold text-emerald-700 text-sm">
                                  ${change.toLocaleString('es-CO')}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div className="pt-1 text-[11px] text-amber-700 font-caledonia border-t border-stone-200">
                              <span>
                                El billete (${cashVal.toLocaleString('es-CO')}) debe ser mayor o igual al total (${grandTotal.toLocaleString('es-CO')})
                              </span>
                            </div>
                          );
                        })()}

                        {cashError && (
                          <p className="text-[11px] text-rose-600 font-semibold">{cashError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="pt-1 text-xs text-stone-600 font-caledonia border-t border-stone-200 flex items-center justify-between">
                        <span className="text-stone-500">Importe exacto:</span>
                        <span className="font-bold text-stone-900">${grandTotal.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: CONFIRMATION RECEIPT (ESTILO TABLA FORMAL SIN CARDS NI TEXTO ENCAPSULADO) */}
          {step === 'confirmation' && completedOrder && (
            <div className="space-y-4 py-2 text-left font-caledonia">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                  ¡Pedido Listo para WhatsApp!
                </h3>
                <p className="text-xs text-stone-500">
                  Tu pedido ha sido registrado para enviarse directamente por WhatsApp a nuestro supermercado.
                </p>
              </div>

              {/* Formal Order Summary Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white text-xs shadow-2xs">
                <table className="w-full border-collapse" role="table">
                  <tbody className="divide-y divide-stone-150">
                    <tr>
                      <td className="py-2.5 px-3.5 text-stone-500 font-caledonia text-left">Número de Pedido:</td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[#F06522] text-sm font-caledonia">{completedOrder.orderNumber}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 text-stone-500 font-caledonia text-left">Modalidad:</td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-stone-900 font-caledonia truncate max-w-[200px]">{completedOrder.slot}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 text-stone-500 font-caledonia text-left">Ubicación / Destino:</td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-stone-900 font-caledonia truncate max-w-[200px]">{completedOrder.address}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 text-stone-500 font-caledonia text-left">Método de pago:</td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-stone-900 font-caledonia">{completedOrder.paymentMethod}</td>
                    </tr>
                    <tr className="bg-stone-50/80 border-t border-stone-200">
                      <td className="py-3 px-3.5 font-bold text-stone-900 text-sm font-caledonia text-left">Total a pagar:</td>
                      <td className="py-3 px-3.5 text-right font-black text-[#5A3825] text-sm font-caledonia">${completedOrder.total.toLocaleString('es-CO')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Confirmación vía WhatsApp - Panel formal sin card verde encapsulada */}
              {whatsappUrl && (
                <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="bg-stone-50/80 px-3.5 py-2.5 border-b border-stone-200 flex items-center gap-2 text-stone-900 font-bold text-xs sm:text-sm font-caledonia">
                    <Sparkles size={15} className="text-[#F06522]" />
                    <span>Confirmación vía WhatsApp</span>
                  </div>
                  <div className="p-3.5 space-y-3 text-xs">
                    <p className="text-stone-600 text-xs font-caledonia leading-relaxed">
                      Si WhatsApp no se abrió automáticamente, presiona el botón a continuación para enviar el mensaje con tu número de orden <strong className="font-bold text-stone-900">{completedOrder.orderNumber}</strong>.
                    </p>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Abrir WhatsApp con mi Pedido</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResetOrder}
                  className="w-full bg-[#5A3825] hover:bg-[#432818] text-white font-bold py-2.5 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer text-center"
                >
                  Volver a la Tienda
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Summary & Action Button */}
        {step !== 'confirmation' && items.length > 0 && (
          <div
            className="sticky bottom-0 z-20 p-4 sm:p-5 border-t border-stone-200 bg-white/95 backdrop-blur-md flex flex-col gap-3 shadow-lg shrink-0"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))' }}
          >
            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex items-center justify-between">
                <span>Subtotal ({totalItemCount} {totalItemCount === 1 ? 'ítem' : 'ítems'})</span>
                <span className="font-semibold text-stone-900">${subtotal.toLocaleString('es-CO')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>{deliveryType === 'tienda' ? 'Recogida en local físico' : 'Costo de envío a domicilio'}</span>
                {shippingCost === 0 ? (
                  <span className="text-emerald-600 font-bold">GRATIS ($0)</span>
                ) : (
                  <span className="font-semibold text-stone-900">${shippingCost.toLocaleString('es-CO')}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-base font-black text-stone-900 pt-2 border-t border-stone-200 font-editorial tabular-nums">
                <span>Total</span>
                <span className="text-lg text-[#5A3825] font-black">${grandTotal.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Step Action Button */}
            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full bg-gradient-to-r from-[#F06522] via-[#ea580c] to-[#d94f13] hover:from-[#ea580c] hover:to-[#c2410c] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-950/15 hover:shadow-orange-500/25 transition-all active:scale-98 cursor-pointer"
              >
                <span>Continuar con Entrega y Pago</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmOrder}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/15 hover:shadow-emerald-600/25 transition-all active:scale-98 cursor-pointer"
              >
                <span>Confirmar Pedido por WhatsApp</span>
                <ArrowRight size={16} />
              </button>
            )}

            {/* User explanation below the action buttons */}
            <div className="flex flex-col items-center justify-center gap-1 text-[11px] text-stone-500 text-center">
              {step === 'checkout' ? (
                <p className="text-[11px] text-stone-600 font-medium">
                  Confirmar pedido te da tu número de pedido en el mismo texto de WhatsApp y te manda a WhatsApp para enviarlo.
                </p>
              ) : (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                  <span>Alistamos tus productos frescos para recoger o entregar</span>
                </div>
              )}
              {onOpenPrivacyPolicy && (
                <p className="text-[10px] text-stone-400">
                  Tus datos son tratados por ARANGO HERMANOS S.A.S bajo la Ley 1581 de 2012.{' '}
                  <button
                    type="button"
                    onClick={onOpenPrivacyPolicy}
                    className="text-[#F06522] underline font-medium hover:text-[#d94f13] cursor-pointer"
                  >
                    Ver política de datos
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default CheckoutDrawer;
