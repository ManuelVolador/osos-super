import React from 'react';
import { X, Printer } from 'lucide-react';
import type { PlacedOrder } from './CheckoutDrawer';
import logoImg from '../../assets/logo.png';

interface InvoicePrintModalProps {
  order: PlacedOrder;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const currentDate = new Date().toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const subtotal = order.subtotal || 0;
  const shipping = order.shipping || 0;
  const grandTotal = order.total || subtotal + shipping;

  // Calculo estimado base e IVA (19% en productos gravados)
  const baseGravable = Math.round((subtotal / 1.19) * 0.4); // Aprox 40% de canasta con IVA
  const ivaEstimado = Math.round(baseGravable * 0.19);
  const bienesExcluidos = subtotal - baseGravable;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-title"
    >
      {/* Print-specific stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Backdrop click */}
      <div className="fixed inset-0 no-print" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl z-10 max-h-[92vh] flex flex-col border border-stone-300 my-auto">
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="no-print p-4 bg-stone-100 border-b border-stone-200 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-[#5A3825]" />
            <span id="invoice-title" className="font-bold text-stone-900 text-sm font-sans">
              Factura de Venta Comercial / Recibo Oficial • {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#5A3825] hover:bg-[#432818] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
            >
              <Printer size={14} />
              <span>Imprimir Recibo</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar vista de factura"
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* PRINTABLE INVOICE: 100% CLASSIC TABLES / ZERO CARDS */}
        {/* ================================================================= */}
        <div id="printable-invoice" className="p-6 sm:p-8 overflow-y-auto flex-1 font-sans text-xs text-stone-900 bg-white">
          {/* 1. Header / Emisor Table */}
          <table className="w-full border-collapse mb-4 border border-stone-900">
            <tbody>
              <tr>
                <td className="p-3 w-1/3 align-top border-r border-stone-900">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={logoImg}
                      alt="Supermercado Osos"
                      className="w-14 h-14 object-contain"
                    />
                    <div>
                      <div className="font-black text-sm uppercase tracking-tight text-stone-900 font-display">
                        Supermercado Osos
                      </div>
                      <div className="text-[10px] text-stone-700 font-bold">
                        ARANGO HERMANOS S.A.S
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-600 mt-1.5 leading-snug">
                    <div>NIT: 890.984.321-7</div>
                    <div>Régimen Común • Responsable de IVA</div>
                    <div>Santa Rosa de Osos (Antioquia)</div>
                    <div>PBX: (604) 860-8899 • WhatsApp: 310 555 0199</div>
                  </div>
                </td>

                <td className="p-3 w-2/3 align-top">
                  <div className="text-right">
                    <div className="inline-block border-2 border-stone-900 px-3 py-1 bg-stone-50 mb-1">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-stone-600">
                        Factura de Venta Comercial No.
                      </div>
                      <div className="text-base font-black font-mono text-stone-900">
                        {order.orderNumber}
                      </div>
                    </div>
                    <div className="text-[10px] text-stone-700 space-y-0.5">
                      <div><strong>Fecha de Expedición:</strong> {currentDate}</div>
                      <div>Resolución DIAN No. 18764000001 de 2026</div>
                      <div><strong>Habilita del:</strong> OSOS-0001 al OSOS-99999</div>
                      <div><strong>Modalidad:</strong> Venta con Entrega a Domicilio</div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 2. Customer & Delivery Info Table */}
          <table className="w-full border-collapse mb-4 border border-stone-900 text-[11px]">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-900">
                <th colSpan={4} className="py-1.5 px-3 font-bold uppercase tracking-wider text-left text-[10px] text-stone-800">
                  Datos del Adquirente / Cliente y Entrega
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stone-300">
                <td className="py-1.5 px-3 font-bold bg-stone-50 w-28 border-r border-stone-300">Cliente / Nombre:</td>
                <td className="py-1.5 px-3 border-r border-stone-300">{order.customerName || 'Cliente Mostrador / Web'}</td>
                <td className="py-1.5 px-3 font-bold bg-stone-50 w-28 border-r border-stone-300">Teléfono:</td>
                <td className="py-1.5 px-3 font-mono">{order.customerPhone || '310 000 0000'}</td>
              </tr>
              <tr className="border-b border-stone-300">
                <td className="py-1.5 px-3 font-bold bg-stone-50 border-r border-stone-300">Dirección Entrega:</td>
                <td className="py-1.5 px-3 border-r border-stone-300">{order.address}</td>
                <td className="py-1.5 px-3 font-bold bg-stone-50 border-r border-stone-300">Sector / Municipio:</td>
                <td className="py-1.5 px-3">Santa Rosa de Osos (Antioquia)</td>
              </tr>
              <tr className="border-b border-stone-300">
                <td className="py-1.5 px-3 font-bold bg-stone-50 border-r border-stone-300">Forma de Pago:</td>
                <td className="py-1.5 px-3 border-r border-stone-300 uppercase font-semibold">
                  {order.paymentMethod === 'contraentrega' ? 'Pago Contra Entrega (Efectivo / Datáfono)' : 'Transferencia Bancolombia / Nequi'}
                </td>
                <td className="py-1.5 px-3 font-bold bg-stone-50 border-r border-stone-300">Horario / Slot:</td>
                <td className="py-1.5 px-3">{order.slot || 'Entrega Express (25-35 min)'}</td>
              </tr>
              {order.notes && (
                <tr>
                  <td className="py-1.5 px-3 font-bold bg-stone-50 border-r border-stone-300">Instrucciones:</td>
                  <td colSpan={3} className="py-1.5 px-3 italic text-stone-700">"{order.notes}"</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 3. Items Table (Classical 1px Accounting Table) */}
          <table className="w-full border-collapse mb-4 border border-stone-900 text-[11px]">
            <thead>
              <tr className="bg-stone-900 text-white text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2 px-2 text-center w-10 border-r border-stone-700">#</th>
                <th className="py-2 px-3 text-center w-14 border-r border-stone-700">Cant.</th>
                <th className="py-2 px-3 text-center w-20 border-r border-stone-700">Unidad</th>
                <th className="py-2 px-3 text-left border-r border-stone-700">Descripción del Producto</th>
                <th className="py-2 px-3 text-right w-24 border-r border-stone-700">Vr. Unitario</th>
                <th className="py-2 px-3 text-right w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300">
              {order.items.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/60'}>
                  <td className="py-1.5 px-2 text-center text-stone-500 font-mono border-r border-stone-300">{idx + 1}</td>
                  <td className="py-1.5 px-3 text-center font-bold font-mono border-r border-stone-300">{item.qty}</td>
                  <td className="py-1.5 px-3 text-center text-stone-600 border-r border-stone-300">{item.unit || 'Und'}</td>
                  <td className="py-1.5 px-3 font-medium text-stone-900 border-r border-stone-300">{item.name}</td>
                  <td className="py-1.5 px-3 text-right font-mono tabular-nums border-r border-stone-300">
                    ${item.price.toLocaleString('es-CO')}
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold font-mono tabular-nums">
                    ${(item.price * item.qty).toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 4. Financial Totals Table */}
          <div className="flex justify-end mb-4">
            <table className="w-full sm:w-72 border-collapse border border-stone-900 text-[11px]">
              <tbody>
                <tr className="border-b border-stone-300">
                  <td className="py-1.5 px-3 bg-stone-50 font-semibold text-stone-700 border-r border-stone-300">Subtotal Productos:</td>
                  <td className="py-1.5 px-3 text-right font-mono tabular-nums">${subtotal.toLocaleString('es-CO')}</td>
                </tr>
                <tr className="border-b border-stone-300">
                  <td className="py-1.5 px-3 bg-stone-50 font-semibold text-stone-700 border-r border-stone-300">Servicio de Domicilio:</td>
                  <td className="py-1.5 px-3 text-right font-mono tabular-nums">
                    {shipping === 0 ? 'GRATIS' : `$${shipping.toLocaleString('es-CO')}`}
                  </td>
                </tr>
                <tr className="border-b border-stone-300">
                  <td className="py-1.5 px-3 bg-stone-50 font-semibold text-stone-700 border-r border-stone-300">Bienes Excluidos (Agro):</td>
                  <td className="py-1.5 px-3 text-right font-mono tabular-nums">${bienesExcluidos.toLocaleString('es-CO')}</td>
                </tr>
                <tr className="border-b border-stone-300">
                  <td className="py-1.5 px-3 bg-stone-50 font-semibold text-stone-700 border-r border-stone-300">Base Gravable (19%):</td>
                  <td className="py-1.5 px-3 text-right font-mono tabular-nums">${baseGravable.toLocaleString('es-CO')}</td>
                </tr>
                <tr className="border-b border-stone-300">
                  <td className="py-1.5 px-3 bg-stone-50 font-semibold text-stone-700 border-r border-stone-300">IVA Discriminado:</td>
                  <td className="py-1.5 px-3 text-right font-mono tabular-nums">${ivaEstimado.toLocaleString('es-CO')}</td>
                </tr>
                <tr className="bg-stone-900 text-white font-black text-sm">
                  <td className="py-2 px-3 uppercase tracking-wider">Total a Pagar:</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">${grandTotal.toLocaleString('es-CO')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. Legal & Fiscal Footer Table */}
          <table className="w-full border-collapse border border-stone-900 text-[10px] leading-relaxed">
            <tbody>
              <tr>
                <td className="p-3 border-r border-stone-900 w-2/3">
                  <div className="font-bold text-stone-900 mb-0.5">Cláusula Cambiaria & Cumplimiento Tributario:</div>
                  <p className="text-stone-600">
                    Esta factura comercial de venta se asimila en todos sus efectos a una letra de cambio según el
                    Art. 774 del Código de Comercio colombiano. Con la firma o aceptación de este documento,
                    el adquirente declara haber recibido real y materialmente las mercancías a entera satisfacción.
                  </p>
                  <p className="text-stone-500 mt-1">
                    Operación de comercio electrónico con entrega a domicilio en Santa Rosa de Osos (Antioquia).
                  </p>
                </td>
                <td className="p-3 w-1/3 text-center align-bottom">
                  <div className="border-b border-stone-800 pb-8 mb-1"></div>
                  <div className="font-bold text-stone-900 text-[9px] uppercase tracking-wider">
                    Firma de Recibido a Satisfacción
                  </div>
                  <div className="text-[9px] text-stone-500">C.C. / Fecha y Hora de Entrega</div>
                </td>
              </tr>
              <tr className="bg-stone-100 border-t border-stone-900">
                <td colSpan={2} className="py-1 px-3 text-center font-bold text-stone-700">
                  ¡Gracias por comprar en Supermercado Osos! Apoyando a las familias campesinas del Norte Antioqueño.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintModal;
