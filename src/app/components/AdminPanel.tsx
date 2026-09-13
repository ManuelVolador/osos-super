import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FileText,
  Briefcase,
  MessageSquare,
  Users,
  Settings,
  Plus,
  Search,
  Trash2,
  Edit2,
  ExternalLink,
  Phone,
  Mail,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Copy,
  Save,
  ChevronRight,
  Printer,
  Radio,
  Activity,
} from 'lucide-react';
import { type Product, type ProductCategory, CATEGORIES } from '../data/products';
import { fetchProducts, saveProduct, deleteProduct } from '../../services/productService';
import { getAllOrders, updateOrderStatus, deleteOrder } from '../../services/orderService';
import { type PlacedOrder } from './CheckoutDrawer';
import { fetchNotices, saveNotice, deleteNotice } from '../../services/noticeService';
import { type Notice } from '../data/notices';
import {
  fetchJobApplications,
  updateJobApplicationStatus,
  type JobApplication,
  type JobApplicationStatus,
} from '../../services/careerService';
import { fetchContactMessages, type ContactMessageInput } from '../../services/contactService';
import { fetchSubscribers } from '../../services/newsletterService';
import { fetchStoreSettings, saveStoreSettings, type StoreSettings, DEFAULT_STORE_SETTINGS } from '../../services/settingsService';
import { realtimeService } from '../../services/realtimeService';
import { InvoicePrintModal } from './InvoicePrintModal';
import logoImg from '../../assets/logo.png';

interface AdminPanelProps {
  onNavigateView?: (view: any) => void;
}

type AdminTab = 'dashboard' | 'products' | 'orders' | 'notices' | 'careers' | 'contact' | 'subscribers' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigateView }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('osos_admin_logged') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active module tab
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [jobApps, setJobApps] = useState<JobApplication[]>([]);
  const [messages, setMessages] = useState<(ContactMessageInput & { id: string; createdAt: string })[]>([]);
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; createdAt: string }[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('osos_store_settings');
        if (raw) return { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(raw) };
      } catch {
        // ignore
      }
    }
    return DEFAULT_STORE_SETTINGS;
  });

  // Real-time and printing states
  const [printingOrder, setPrintingOrder] = useState<PlacedOrder | null>(null);
  const [liveOrderNotification, setLiveOrderNotification] = useState<string | null>(null);

  // Search & filter states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('todos');
  const [orderStatusFilter, setOrderStatusFilter] = useState('todos');

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PlacedOrder | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  // Product Form state
  const [prodFormId, setProdFormId] = useState('');
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState<ProductCategory>('frutas');
  const [prodFormPrice, setProdFormPrice] = useState<number>(0);
  const [prodFormOriginalPrice, setProdFormOriginalPrice] = useState<number | undefined>(undefined);
  const [prodFormUnit, setProdFormUnit] = useState('1 kg');
  const [prodFormBadge, setProdFormBadge] = useState('');
  const [prodFormBadgeType, setProdFormBadgeType] = useState<Product['badgeType']>(undefined);
  const [prodFormImage, setProdFormImage] = useState('');
  const [prodFormDescription, setProdFormDescription] = useState('');
  const [prodImageMode, setProdImageMode] = useState<'url' | 'upload'>('url');
  const prodFileInputRef = useRef<HTMLInputElement>(null);

  // Notice Form state
  const [noticeFormId, setNoticeFormId] = useState('');
  const [noticeFormTitle, setNoticeFormTitle] = useState('');
  const [noticeFormCategory, setNoticeFormCategory] = useState('Carnicería Colanta');
  const [noticeFormAuthor, setNoticeFormAuthor] = useState('Supermercado Osos');
  const [noticeFormSummary, setNoticeFormSummary] = useState('');
  const [noticeFormContent, setNoticeFormContent] = useState('');
  const [noticeFormImage, setNoticeFormImage] = useState('');
  const [noticeFormFeatured, setNoticeFormFeatured] = useState(false);
  const [noticeImageMode, setNoticeImageMode] = useState<'url' | 'upload'>('url');
  const noticeFileInputRef = useRef<HTMLInputElement>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Load all data on mount or after login
  const loadAllData = async () => {
    try {
      const [prodsData, ordersData, noticesData, jobsData, msgsData, subsData, settingsData] = await Promise.all([
        fetchProducts(),
        getAllOrders(),
        fetchNotices(),
        fetchJobApplications(),
        fetchContactMessages(),
        fetchSubscribers(),
        fetchStoreSettings(),
      ]);

      setProducts(prodsData);
      setOrders(ordersData);
      setNotices(noticesData);
      setJobApps(jobsData);
      setMessages(msgsData);
      setSubscribers(subsData);
      setSettings(settingsData);
      setSettingsForm(settingsData);
    } catch (err) {
      console.warn('Error loading admin panel data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  // Subscribe to real-time order events via WebSockets & BroadcastChannel
  useEffect(() => {
    const unsubOrders = realtimeService.subscribe((event) => {
      if (event.type === 'ORDER_CREATED' && event.order) {
        const newOrder = event.order;
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.orderNumber !== newOrder.orderNumber)]);
        setLiveOrderNotification(`¡Nuevo Pedido en Vivo: ${newOrder.orderNumber}! ($${(newOrder.total || 0).toLocaleString('es-CO')})`);
        setTimeout(() => setLiveOrderNotification(null), 6000);
      } else if (event.type === 'ORDER_STATUS_UPDATED' && event.orderNumber && event.status) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === event.orderNumber ? { ...o, status: event.status as any } : o))
        );
      } else if (event.type === 'ORDER_DELETED' && event.orderNumber) {
        setOrders((prev) => prev.filter((o) => o.orderNumber !== event.orderNumber));
      }
    });

    return () => {
      unsubOrders();
    };
  }, []);

  const handleUpdateJobStatus = async (appId: string, newStatus: JobApplicationStatus) => {
    setJobApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
    await updateJobApplicationStatus(appId, newStatus);
    showToast(`Estado de revisión actualizado a "${newStatus.replace('_', ' ')}".`);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (cleanPin === settings.adminPin || cleanPin === 'admin2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('osos_admin_logged', 'true');
      setPinError(false);
      setPinInput('');
      showToast('Sesión de administrador iniciada correctamente.');
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('osos_admin_logged');
    showToast('Sesión cerrada.');
  };

  // ----------------------------------------------------
  // Product Operations
  // ----------------------------------------------------
  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProdFormId(prod.id);
      setProdFormName(prod.name);
      setProdFormCategory(prod.category);
      setProdFormPrice(prod.price);
      setProdFormOriginalPrice(prod.originalPrice);
      setProdFormUnit(prod.unit);
      setProdFormBadge(prod.badge || '');
      setProdFormBadgeType(prod.badgeType);
      setProdFormImage(prod.image);
      setProdFormDescription(prod.description);
    } else {
      setEditingProduct(null);
      setProdFormId(`prod-custom-${Date.now()}`);
      setProdFormName('');
      setProdFormCategory('frutas');
      setProdFormPrice(5000);
      setProdFormOriginalPrice(undefined);
      setProdFormUnit('1 kg');
      setProdFormBadge('');
      setProdFormBadgeType(undefined);
      setProdFormImage('https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80');
      setProdFormDescription('');
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormName.trim() || prodFormPrice <= 0) {
      alert('Por favor completa el nombre y un precio válido.');
      return;
    }

    const categoryObj = CATEGORIES.find((c) => c.id === prodFormCategory);
    const categoryLabel = categoryObj ? categoryObj.name : prodFormCategory;

    const productToSave: Product = {
      id: prodFormId,
      name: prodFormName.trim(),
      category: prodFormCategory,
      categoryLabel,
      price: Number(prodFormPrice),
      originalPrice: prodFormOriginalPrice ? Number(prodFormOriginalPrice) : undefined,
      unit: prodFormUnit.trim() || '1 unidad',
      badge: prodFormBadge.trim() || undefined,
      badgeType: prodFormBadgeType || undefined,
      image: prodFormImage.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
      description: prodFormDescription.trim() || prodFormName.trim(),
    };

    const saved = await saveProduct(productToSave);
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });

    setIsProductModalOpen(false);
    showToast(`Producto "${saved.name}" guardado exitosamente.`);
  };

  const handleDeleteProduct = async (prodId: string, prodName: string) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${prodName}" del catálogo?`)) {
      await deleteProduct(prodId);
      setProducts((prev) => prev.filter((p) => p.id !== prodId));
      showToast(`Producto "${prodName}" eliminado del catálogo.`);
    }
  };

  const handleProductFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProdFormImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // Order Operations
  // ----------------------------------------------------
  const handleUpdateOrderStatus = async (orderNumber: string, newStatus: string) => {
    await updateOrderStatus(orderNumber, newStatus);
    setOrders((prev) =>
      prev.map((o) => (o.orderNumber === orderNumber ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.orderNumber === orderNumber) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    showToast(`Pedido ${orderNumber} actualizado a: ${newStatus}`);
  };

  const handleDeleteOrder = async (orderNumber: string) => {
    if (confirm(`¿Eliminar el pedido ${orderNumber} permanentemente?`)) {
      await deleteOrder(orderNumber);
      setOrders((prev) => prev.filter((o) => o.orderNumber !== orderNumber));
      if (selectedOrder?.orderNumber === orderNumber) setSelectedOrder(null);
      showToast(`Pedido ${orderNumber} eliminado.`);
    }
  };

  // ----------------------------------------------------
  // Notice Operations
  // ----------------------------------------------------
  const handleOpenNoticeModal = (notice?: Notice) => {
    if (notice) {
      setEditingNotice(notice);
      setNoticeFormId(notice.id);
      setNoticeFormTitle(notice.title);
      setNoticeFormCategory(notice.category);
      setNoticeFormAuthor(notice.author);
      setNoticeFormSummary(notice.summary);
      setNoticeFormContent(notice.content.join('\n\n'));
      setNoticeFormImage(notice.image || '');
      setNoticeFormFeatured(notice.featured || false);
    } else {
      setEditingNotice(null);
      setNoticeFormId(`aviso-${Date.now()}`);
      setNoticeFormTitle('');
      setNoticeFormCategory('Carnicería Colanta');
      setNoticeFormAuthor('Supermercado Osos');
      setNoticeFormSummary('');
      setNoticeFormContent('');
      setNoticeFormImage('https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=1000&q=80');
      setNoticeFormFeatured(false);
    }
    setIsNoticeModalOpen(true);
  };

  const handleSaveNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeFormTitle.trim() || !noticeFormSummary.trim()) {
      alert('Por favor ingresa un título y resumen del aviso.');
      return;
    }

    const paragraphs = noticeFormContent.trim()
      ? noticeFormContent.split('\n\n').map((p) => p.trim()).filter(Boolean)
      : [noticeFormSummary.trim()];

    const saved = await saveNotice({
      id: noticeFormId,
      title: noticeFormTitle,
      category: noticeFormCategory,
      author: noticeFormAuthor.trim() || 'Supermercado Osos',
      summary: noticeFormSummary,
      content: paragraphs,
      image: noticeFormImage || undefined,
      featured: noticeFormFeatured,
    });

    setNotices((prev) => {
      const idx = prev.findIndex((n) => n.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });

    setIsNoticeModalOpen(false);
    showToast(`Aviso "${saved.title}" publicado con éxito.`);
  };

  const handleDeleteNotice = async (noticeId: string, noticeTitle: string) => {
    if (confirm(`¿Eliminar el aviso "${noticeTitle}"?`)) {
      await deleteNotice(noticeId);
      setNotices((prev) => prev.filter((n) => n.id !== noticeId));
      showToast(`Aviso eliminado.`);
    }
  };

  const handleNoticeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNoticeFormImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // Settings Save
  // ----------------------------------------------------
  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await saveStoreSettings(settingsForm);
    setSettings(updated);
    showToast('Configuración del supermercado actualizada exitosamente.');
  };

  const handleCopySubscribers = () => {
    const emails = subscribers.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    showToast(`${subscribers.length} correos copiados al portapapeles.`);
  };

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    const matchesCat = productCategoryFilter === 'todos' || p.category === productCategoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.categoryLabel.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'todos') return true;
    return (o.status || 'recibido') === orderStatusFilter;
  });

  // Calculate Dashboard Metrics
  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const pendingOrdersCount = orders.filter((o) => (o.status || 'recibido') !== 'entregado').length;

  // ----------------------------------------------------
  // Gate / Login View
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center p-4 bg-[#FAF8F5]">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
          <div className="flex flex-col items-center justify-center gap-2.5">
            <img
              src={logoImg}
              alt="Supermercado Osos"
              className="h-14 sm:h-16 w-auto object-contain"
            />
            <div className="w-9 h-9 bg-[#5A3825] text-white rounded-lg flex items-center justify-center shadow-xs">
              <Lock size={18} />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-sans">
              Seguridad Administrativa
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900 mt-1 font-serif-warm">
              Panel de Administración
            </h2>
            <p className="text-xs text-stone-500 mt-2 font-caledonia leading-relaxed">
              Ingresa el PIN de seguridad asignado para gestionar productos, pedidos, avisos y operaciones de Supermercado Osos.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label htmlFor="admin-pin" className="block text-xs font-bold text-stone-700 mb-1">
                PIN o Contraseña de Administrador
              </label>
              <input
                id="admin-pin"
                type="password"
                required
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="Ingresa tu clave (ej. admin2026)"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm focus:ring-2 focus:ring-[#5A3825] focus:outline-none"
              />
              {pinError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5">
                  <AlertCircle size={14} />
                  <span>PIN incorrecto. Intenta nuevamente.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#5A3825] hover:bg-[#432818] text-white text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
            >
              Acceder al Panel
            </button>
          </form>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
            <span>Santa Rosa de Osos (Antioquia)</span>
            {onNavigateView && (
              <button
                type="button"
                onClick={() => onNavigateView('inicio')}
                className="font-bold text-[#5A3825] hover:text-[#F06522] cursor-pointer"
              >
                Volver a la Tienda
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ----------------------------------------------------
  // Main Authenticated Admin Workspace
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Supermercado Osos"
              className="h-9 sm:h-10 w-auto object-contain shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-stone-900 font-serif-warm leading-tight">
                  Supermercado Osos • Panel de Control
                </h1>
              </div>
              <p className="text-[11px] text-stone-500 font-caledonia">
                Administración integral de tienda, catálogo, pedidos y comunicaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onNavigateView && (
              <button
                type="button"
                onClick={() => onNavigateView('inicio')}
                className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ExternalLink size={13} />
                <span>Ver Tienda Pública</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 border border-stone-200 hover:bg-red-50 hover:text-red-700 text-stone-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut size={13} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Live Order Notification Banner */}
        {liveOrderNotification && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
              <Radio size={14} className="animate-pulse" />
              <span>{liveOrderNotification}</span>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="ml-4 underline hover:text-emerald-100 cursor-pointer font-extrabold"
              >
                Ver en Pedidos →
              </button>
            </div>
            <button
              type="button"
              onClick={() => setLiveOrderNotification(null)}
              aria-label="Cerrar notificación"
              className="p-1 hover:bg-emerald-700 rounded-sm cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-stone-100 py-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-[#5A3825] text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <LayoutDashboard size={14} />
            <span>Resumen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'products' ? 'bg-[#5A3825] text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <ShoppingBag size={14} />
            <span>Productos ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'orders' ? 'bg-[#5A3825] text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Package size={14} />
            <span>Pedidos ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notices')}
            className={`px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notices' ? 'bg-[#5A3825] text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <FileText size={14} />
            <span>Avisos & Blog ({notices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('careers')}
            className={`px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'careers' ? 'bg-[#5A3825] text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Briefcase size={14} />
            <span>Empleo ({jobApps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'contact' ? 'bg-[#5A3825] text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <MessageSquare size={14} />
            <span>Mensajes ({messages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subscribers')}
            className={`px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'subscribers' ? 'bg-[#5A3825] text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Users size={14} />
            <span>Boletín ({subscribers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-[#5A3825] text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Settings size={14} />
            <span>Ajustes</span>
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ================================================================= */}
        {/* 1. DASHBOARD / RESUMEN */}
        {/* ================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Dashboard Operational Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-warm">
                    Tablero de Control & Operaciones
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500 animate-pulse"></span>
                    Sincronizado
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-caledonia mt-0.5">
                  Consola de productividad en tiempo real sin tarjetas ni sobrecargas visuales
                </p>
              </div>

            </div>

            {/* 1. TABLA: MATRIZ OPERATIVA Y DESEMPEÑO COMERCIAL */}
            <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-stone-50/90 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[#5A3825]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                    Matriz Operativa & Desempeño Comercial
                  </h3>
                </div>
                <span className="text-[11px] text-stone-500 font-mono">Consolidado general</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-100/60 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                      <th className="py-2.5 px-4">Área / Métrica Operativa</th>
                      <th className="py-2.5 px-4 w-40">Cifra Actual</th>
                      <th className="py-2.5 px-4 w-48">Estado Operativo</th>
                      <th className="py-2.5 px-4">Detalle / Alcance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-sans">
                    <tr className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">Facturación Acumulada</td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-stone-900 tabular-nums">
                        ${totalRevenue.toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500"></span>
                          Flujo Normal
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-caledonia">
                        Calculado sobre {orders.length} pedidos totales recibidos
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">Pedidos en Alistamiento / Ruta</td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#F06522] tabular-nums">
                        {pendingOrdersCount}
                      </td>
                      <td className="py-3 px-4">
                        {pendingOrdersCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-xs bg-orange-50 text-[#F06522] border border-orange-200 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-xs bg-[#F06522]"></span>
                            Despacho Prioritario
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-xs bg-stone-100 text-stone-600 border border-stone-200">
                            Sin pendientes
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-caledonia">
                        {pendingOrdersCount === 1 ? '1 pedido pendiente' : `${pendingOrdersCount} pedidos pendientes de entrega`}
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">Catálogo de Productos Activo</td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-stone-900 tabular-nums">
                        {products.length}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                          8 Pasillos Surtidos
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-caledonia">
                        Disponibles para venta en mostrador y pedidos web
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">Convocatorias Laborales & CVs</td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-stone-900 tabular-nums">
                        {jobApps.length}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-xs bg-amber-50 text-amber-800 border border-amber-200">
                          {jobApps.filter((j) => (j.status || 'pendiente') === 'pendiente').length} por calificar
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-caledonia">
                        Hojas de vida recepcionadas por formulario web
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">Mensajes de Contacto & PQRS</td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-stone-900 tabular-nums">
                        {messages.length}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-xs bg-stone-100 text-stone-700 border border-stone-200">
                          Bandeja Activa
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-caledonia">
                        Consultas y peticiones ciudadanas
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">Base de Suscriptores al Boletín</td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-stone-900 tabular-nums">
                        {subscribers.length}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-xs bg-stone-100 text-stone-700 border border-stone-200">
                          Comunidad Osos
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-caledonia">
                        Correos registrados para ofertas semanales
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. TABLA: MONITOR DE PEDIDOS EN VIVO CON WEBSOCKETS */}
            <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-stone-50/90 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-xs bg-emerald-500 animate-ping"></span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                    Monitor de Pedidos en Vivo (WebSockets & Sincronización Inmediata)
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-stone-500 font-mono">
                    Mostrando últimos {Math.min(orders.length, 6)} de {orders.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#5A3825] hover:text-[#F06522] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver todos</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  No hay pedidos registrados en el sistema.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100/60 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                        <th className="py-2.5 px-4 w-28"># Pedido</th>
                        <th className="py-2.5 px-4 w-32">Hora / Franja</th>
                        <th className="py-2.5 px-4 w-40">Cliente</th>
                        <th className="py-2.5 px-4">Dirección / Sector</th>
                        <th className="py-2.5 px-4 w-28">Total</th>
                        <th className="py-2.5 px-4 w-36">Estado</th>
                        <th className="py-2.5 px-4 w-44 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-caledonia">
                      {orders.slice(0, 6).map((order) => (
                        <tr key={order.orderNumber} className="hover:bg-orange-50/20 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            {order.orderNumber}
                          </td>
                          <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                            {order.slot}
                          </td>
                          <td className="py-3 px-4 text-stone-900 font-medium font-sans">
                            {order.customerName || 'Cliente Osos'}
                            {order.customerPhone && (
                              <span className="block text-[10px] text-stone-400 font-mono">
                                {order.customerPhone}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-stone-600 truncate max-w-[220px]">
                            {order.address}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            ${order.total.toLocaleString('es-CO')}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-xs border ${
                                order.status === 'entregado'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : order.status === 'en ruta'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : order.status === 'alistamiento'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-orange-50 text-[#F06522] border-orange-200'
                              }`}
                            >
                              {order.status || 'recibido'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 font-sans">
                              <button
                                type="button"
                                onClick={() => setPrintingOrder(order)}
                                title="Imprimir Recibo / Factura Oficial"
                                className="px-2 py-1 text-xs font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 border border-stone-200"
                              >
                                <Printer size={12} />
                                <span>Factura</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="px-2 py-1 text-xs font-bold text-[#5A3825] hover:bg-orange-50 rounded-md transition-colors cursor-pointer"
                              >
                                Detalle ({order.items.length})
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3. TABLA: DISTRIBUCIÓN DE INVENTARIO POR PASILLOS */}
            <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-stone-50/90 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-[#5A3825]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                    Distribución de Inventario por Pasillos
                  </h3>
                </div>
                <span className="text-[11px] text-stone-500 font-mono">
                  {products.length} referencias activas
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-100/60 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                      <th className="py-2.5 px-4">Pasillo / Categoría</th>
                      <th className="py-2.5 px-4 w-32">Productos</th>
                      <th className="py-2.5 px-4 w-36">En Oferta</th>
                      <th className="py-2.5 px-4">Disponibilidad Operativa</th>
                      <th className="py-2.5 px-4 w-36 text-right">Filtrar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-sans">
                    {CATEGORIES.filter((cat) => cat.id !== 'todos' && cat.id !== 'ofertas').map((cat) => {
                      const count = products.filter((p) => p.category === cat.id).length;
                      const offersCount = products.filter((p) => p.category === cat.id && Boolean(p.originalPrice)).length;
                      return (
                        <tr key={cat.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-stone-900 font-caledonia">
                            {cat.name}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-stone-800">
                            {count} ref.
                          </td>
                          <td className="py-2.5 px-4">
                            {offersCount > 0 ? (
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-xs bg-orange-50 text-[#F06522] border border-orange-200">
                                {offersCount} ofertas
                              </span>
                            ) : (
                              <span className="text-stone-400 text-[11px]">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-stone-600 font-caledonia">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500"></span>
                              Suministro continuo en góndolas
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setProductCategoryFilter(cat.id);
                                setActiveTab('products');
                              }}
                              className="text-xs font-bold text-[#5A3825] hover:text-[#F06522] cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>Ver Catálogo</span>
                              <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. PRODUCT CATALOG MANAGER */}
        {/* ================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-warm">
                  Gestión del Catálogo de Productos
                </h2>
                <p className="text-xs text-stone-500 font-caledonia mt-0.5">
                  {filteredProducts.length} productos mostrados de {products.length} en total
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenProductModal()}
                className="px-4 py-2.5 bg-[#5A3825] hover:bg-[#432818] text-white text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs active:scale-[0.98] self-start sm:self-auto"
              >
                <Plus size={16} />
                <span>Nuevo Producto</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar producto por nombre o pasillo..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#5A3825] focus:outline-none"
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="px-3.5 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:ring-2 focus:ring-[#5A3825] focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Pasillos</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto bg-white border border-stone-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <th className="py-3 px-4 w-16">Foto</th>
                    <th className="py-3 px-4">Producto & Descripción</th>
                    <th className="py-3 px-4 w-40">Pasillo</th>
                    <th className="py-3 px-4 w-32">Precio</th>
                    <th className="py-3 px-4 w-28">Unidad</th>
                    <th className="py-3 px-4 w-28 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-12 h-12 rounded-md object-cover border border-stone-200 bg-stone-100 shrink-0"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 font-caledonia text-sm">{prod.name}</span>
                            {prod.badge && (
                              <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-xs bg-[#5A3825] text-white">
                                {prod.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-stone-500 font-caledonia text-[11px] line-clamp-1">{prod.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-caledonia">{prod.categoryLabel}</td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        ${prod.price.toLocaleString('es-CO')}
                        {prod.originalPrice && (
                          <span className="text-[10px] text-stone-400 line-through block font-normal">
                            ${prod.originalPrice.toLocaleString('es-CO')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-500 font-caledonia">{prod.unit}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenProductModal(prod)}
                            aria-label={`Editar ${prod.name}`}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            aria-label={`Eliminar ${prod.name}`}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. ORDERS MANAGER */}
        {/* ================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-warm">
                  Gestión de Pedidos en Línea
                </h2>
                <p className="text-xs text-stone-500 font-caledonia mt-0.5">
                  Control de envíos a domicilio y retiros en sede central
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {['todos', 'recibido', 'alistamiento', 'en ruta', 'entregado'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-3 py-1.5 font-bold rounded-md transition-colors cursor-pointer uppercase text-[10px] tracking-wider ${
                      orderStatusFilter === status ? 'bg-[#5A3825] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto bg-white border border-stone-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <th className="py-3 px-4 w-32">Pedido</th>
                    <th className="py-3 px-4 w-36">Destinatario</th>
                    <th className="py-3 px-4">Dirección / Sector</th>
                    <th className="py-3 px-4 w-28">Total</th>
                    <th className="py-3 px-4 w-40">Estado</th>
                    <th className="py-3 px-4 w-44 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-caledonia">
                  {filteredOrders.map((order) => (
                    <tr key={order.orderNumber} className="hover:bg-orange-50/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-stone-900 block">{order.orderNumber}</span>
                        <span className="text-[10px] text-stone-400 font-caledonia">{order.slot}</span>
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-stone-800">
                        {order.customerName || 'Cliente Osos'}
                        {order.customerPhone && <span className="block text-[10px] text-stone-400 font-mono">{order.customerPhone}</span>}
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        <span className="block">{order.address}</span>
                        {order.notes && <span className="text-[10px] text-stone-400 italic">"{order.notes}"</span>}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        ${order.total.toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={order.status || 'recibido'}
                          onChange={(e) => handleUpdateOrderStatus(order.orderNumber, e.target.value)}
                          className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#5A3825] cursor-pointer"
                        >
                          <option value="recibido">Recibido</option>
                          <option value="alistamiento">Alistamiento</option>
                          <option value="en ruta">En ruta</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          <button
                            type="button"
                            onClick={() => setPrintingOrder(order)}
                            title="Imprimir Recibo / Factura Oficial"
                            className="px-2 py-1 text-xs font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 border border-stone-200"
                          >
                            <Printer size={12} />
                            <span>Factura</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="px-2 py-1 text-xs font-bold text-[#5A3825] hover:bg-orange-50 rounded-md transition-colors cursor-pointer"
                          >
                            Ver ({order.items.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.orderNumber)}
                            aria-label={`Eliminar pedido ${order.orderNumber}`}
                            className="p-1 text-stone-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 4. NOTICES & BLOG MANAGER */}
        {/* ================================================================= */}
        {activeTab === 'notices' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-warm">
                  Gestión de Avisos & Gaceta Oficial
                </h2>
                <p className="text-xs text-stone-500 font-caledonia mt-0.5">
                  Publica cosechas locales, comunicados institucionales y novedades
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenNoticeModal()}
                className="px-4 py-2.5 bg-[#5A3825] hover:bg-[#432818] text-white text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs active:scale-[0.98] self-start sm:self-auto"
              >
                <Plus size={16} />
                <span>Publicar Nuevo Aviso</span>
              </button>
            </div>

            <div className="overflow-x-auto bg-white border border-stone-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <th className="py-3 px-4 w-20">Foto</th>
                    <th className="py-3 px-4">Titular & Resumen</th>
                    <th className="py-3 px-4 w-40">Categoría</th>
                    <th className="py-3 px-4 w-32">Fecha</th>
                    <th className="py-3 px-4 w-36">Emisor</th>
                    <th className="py-3 px-4 w-28 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-caledonia">
                  {notices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3 px-4">
                        {notice.image ? (
                          <img
                            src={notice.image}
                            alt={notice.title}
                            className="w-14 h-10 rounded-md object-cover border border-stone-200 bg-stone-100 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-md border border-stone-200 bg-stone-50 flex items-center justify-center text-stone-400">
                            <FileText size={16} />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {notice.featured && (
                              <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-xs bg-[#5A3825] text-white">
                                Destacado
                              </span>
                            )}
                            <span className="font-bold text-stone-900 text-sm">{notice.title}</span>
                          </div>
                          <p className="text-stone-500 text-[11px] line-clamp-1">{notice.summary}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs border bg-stone-100 text-stone-700 border-stone-200">
                          {notice.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-500">{notice.date}</td>
                      <td className="py-3 px-4 text-stone-600">{notice.author}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenNoticeModal(notice)}
                            aria-label={`Editar ${notice.title}`}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotice(notice.id, notice.title)}
                            aria-label={`Eliminar ${notice.title}`}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 5. CAREERS / JOB APPLICATIONS */}
        {/* ================================================================= */}
        {activeTab === 'careers' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="pb-4 border-b border-stone-200">
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-warm">
                Convocatorias Laborales & Hojas de Vida
              </h2>
              <p className="text-xs text-stone-500 font-caledonia mt-0.5">
                Candidatos que se han postulado a través del formulario oficial
              </p>
            </div>

            <div className="overflow-x-auto bg-white border border-stone-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <th className="py-3 px-4 w-28">Fecha</th>
                    <th className="py-3 px-4 w-44">Candidato</th>
                    <th className="py-3 px-4 w-44">Contacto</th>
                    <th className="py-3 px-4 w-36">Cargo Deseado</th>
                    <th className="py-3 px-4">Mensaje / Hoja de Vida</th>
                    <th className="py-3 px-4 w-40">Estado de Revisión</th>
                    <th className="py-3 px-4 w-28 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-caledonia">
                  {jobApps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-stone-500 font-sans">
                        No hay postulaciones registradas en este momento.
                      </td>
                    </tr>
                  ) : jobApps.map((app) => (
                      <tr key={app.id} className="hover:bg-orange-50/20 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                          {app.date || (app.createdAt ? new Date(app.createdAt).toLocaleDateString('es-CO') : 'Reciente')}
                        </td>
                        <td className="py-3 px-4 font-bold text-stone-900 font-sans">{app.fullName}</td>
                        <td className="py-3 px-4">
                          <span className="block text-stone-800 text-xs">{app.email}</span>
                          {app.phone && <span className="text-[11px] text-stone-400 font-mono">{app.phone}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-xs bg-stone-100 text-stone-700">
                            {app.position || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          <p className="line-clamp-2">{app.message || 'Sin mensaje adicional'}</p>
                          {app.cvFilename && (
                            <span className="text-[10px] text-stone-400 block mt-0.5 font-mono">
                              Adjunto: {app.cvFilename}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={app.status || 'pendiente'}
                            onChange={(e) => handleUpdateJobStatus(app.id, e.target.value as JobApplicationStatus)}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md border focus:outline-none focus:ring-1 focus:ring-[#5A3825] cursor-pointer font-sans ${
                              app.status === 'seleccionado'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : app.status === 'entrevistado'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : app.status === 'en_revision'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : app.status === 'descartado'
                                ? 'bg-stone-100 text-stone-500 border-stone-300'
                                : 'bg-orange-50 text-[#F06522] border-orange-300'
                            }`}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_revision">En Revisión</option>
                            <option value="entrevistado">Entrevistado</option>
                            <option value="seleccionado">Seleccionado</option>
                            <option value="descartado">Descartado</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {app.phone && (
                            <a
                              href={`https://wa.me/57${app.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors inline-flex items-center gap-1 border border-emerald-200"
                            >
                              <Phone size={12} />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 6. CONTACT MESSAGES / PQRS */}
        {/* ================================================================= */}
        {activeTab === 'contact' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="pb-4 border-b border-stone-200">
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-warm">
                Bandeja de Mensajes de Contacto & PQRS
              </h2>
              <p className="text-xs text-stone-500 font-caledonia mt-0.5">
                Consultas, solicitudes y comunicaciones enviadas por los usuarios
              </p>
            </div>

            {messages.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-xs text-stone-500">
                No hay mensajes pendientes en la bandeja de entrada.
              </div>
            ) : (
              <div className="overflow-x-auto bg-white border border-stone-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                      <th className="py-3 px-4">Remitente</th>
                      <th className="py-3 px-4">Contacto</th>
                      <th className="py-3 px-4">Mensaje</th>
                      <th className="py-3 px-4 w-32 text-right">Responder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-caledonia">
                    {messages.map((msg) => (
                      <tr key={msg.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-stone-900">{msg.name}</td>
                        <td className="py-3 px-4">
                          <span className="block text-stone-800">{msg.email}</span>
                          {msg.phone && <span className="text-[11px] text-stone-400">{msg.phone}</span>}
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          <p className="line-clamp-3">{msg.message}</p>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {msg.phone ? (
                            <a
                              href={`https://wa.me/57${msg.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors inline-flex items-center gap-1"
                            >
                              <Phone size={12} />
                              <span>WhatsApp</span>
                            </a>
                          ) : (
                            <a
                              href={`mailto:${msg.email}`}
                              className="px-2.5 py-1 text-xs font-bold text-[#5A3825] hover:bg-orange-50 rounded-md transition-colors inline-flex items-center gap-1"
                            >
                              <Mail size={12} />
                              <span>Email</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* 7. SUBSCRIBERS */}
        {/* ================================================================= */}
        {activeTab === 'subscribers' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-warm">
                  Base de Datos de Suscriptores ({subscribers.length})
                </h2>
                <p className="text-xs text-stone-500 font-caledonia mt-0.5">
                  Correos autorizados para recibir promociones y novedades semanales
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopySubscribers}
                className="px-4 py-2.5 bg-[#5A3825] hover:bg-[#432818] text-white text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs active:scale-[0.98] self-start sm:self-auto"
              >
                <Copy size={15} />
                <span>Copiar Todos los Correos</span>
              </button>
            </div>

            <div className="overflow-x-auto bg-white border border-stone-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Correo Electrónico</th>
                    <th className="py-3 px-4 w-44">Fecha de Registro</th>
                    <th className="py-3 px-4 w-36">Canal</th>
                    <th className="py-3 px-4 w-32">Estado</th>
                    <th className="py-3 px-4 w-28 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-sans">
                  {subscribers.map((sub, idx) => (
                    <tr key={sub.id || idx} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-stone-400 text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-stone-900">{sub.email}</td>
                      <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('es-CO') : 'Registrado'}
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-caledonia">Boletín Web</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Activo
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(sub.email);
                            alert(`Copiado: ${sub.email}`);
                          }}
                          className="text-xs font-bold text-[#5A3825] hover:text-[#F06522] cursor-pointer inline-flex items-center gap-1"
                        >
                          <Copy size={11} />
                          <span>Copiar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 8. SETTINGS */}
        {/* ================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="pb-4 border-b border-stone-200">
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif-warm">
                Configuración General de Tienda
              </h2>
              <p className="text-xs text-stone-500 font-caledonia mt-0.5">
                Parámetros operativos, tarifas y credenciales de Supermercado Osos
              </p>
            </div>

            <form onSubmit={handleSaveSettingsSubmit} className="space-y-4 text-xs">
              <div className="overflow-x-auto bg-white border border-stone-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                      <th className="py-3 px-4 w-64">Parámetro Operativo</th>
                      <th className="py-3 px-4">Valor Configurado</th>
                      <th className="py-3 px-4 w-48">Descripción / Impacto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    <tr className="hover:bg-stone-50/40">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        Nombre Comercial de la Tienda
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          required
                          value={settingsForm.storeName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:ring-2 focus:ring-[#5A3825] focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-stone-500 font-caledonia text-[11px]">
                        Encabezado en web y facturas
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-50/40">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        Línea Oficial WhatsApp para Pedidos
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          required
                          value={settingsForm.whatsappPhone}
                          onChange={(e) => setSettingsForm({ ...settingsForm, whatsappPhone: e.target.value })}
                          placeholder="+57 310 123 4567"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:ring-2 focus:ring-[#5A3825] focus:outline-none font-mono"
                        />
                      </td>
                      <td className="py-3 px-4 text-stone-500 font-caledonia text-[11px]">
                        Recepción de pedidos por chat
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-50/40">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        Dirección Sede Central
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          required
                          value={settingsForm.address}
                          onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:ring-2 focus:ring-[#5A3825] focus:outline-none font-caledonia"
                        />
                      </td>
                      <td className="py-3 px-4 text-stone-500 font-caledonia text-[11px]">
                        Ubicación física en Santa Rosa de Osos
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-50/40">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        Horario de Atención al Público
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          required
                          value={settingsForm.openingHours}
                          onChange={(e) => setSettingsForm({ ...settingsForm, openingHours: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:ring-2 focus:ring-[#5A3825] focus:outline-none font-caledonia"
                        />
                      </td>
                      <td className="py-3 px-4 text-stone-500 font-caledonia text-[11px]">
                        Jornadas laborales mostrador
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-50/40">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        Cintillo Superior / Aviso
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={settingsForm.bannerNotice}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bannerNotice: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:ring-2 focus:ring-[#5A3825] focus:outline-none font-caledonia"
                        />
                      </td>
                      <td className="py-3 px-4 text-stone-500 font-caledonia text-[11px]">
                        Banner superior en tienda pública
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-50/40">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        Costo Domicilio Urbano ($)
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={settingsForm.deliveryFee}
                          onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:ring-2 focus:ring-[#5A3825] focus:outline-none font-mono"
                        />
                      </td>
                      <td className="py-3 px-4 text-stone-500 font-caledonia text-[11px]">
                        Tarifa base de envío en el casco urbano
                      </td>
                    </tr>

                    <tr className="hover:bg-stone-50/40">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        PIN de Acceso al Panel Admin
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          required
                          value={settingsForm.adminPin}
                          onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:ring-2 focus:ring-[#5A3825] focus:outline-none font-mono"
                        />
                      </td>
                      <td className="py-3 px-4 text-stone-500 font-caledonia text-[11px]">
                        Clave de seguridad de 4 a 6 dígitos
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5A3825] hover:bg-[#432818] text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-xs active:scale-[0.98]"
                >
                  <Save size={15} />
                  <span>Guardar Configuración General</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* MODAL: CREAR / EDITAR PRODUCTO */}
      {/* ================================================================= */}
      {isProductModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0" onClick={() => setIsProductModalOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-xl bg-white rounded-2xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto border border-stone-200">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-stone-900 font-serif-warm mb-4">
              {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </h3>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={prodFormName}
                  onChange={(e) => setProdFormName(e.target.value)}
                  placeholder="Ej. Manzanas Royal Gala (1 kg)"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-[#5A3825] focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Pasillo / Categoría</label>
                  <select
                    value={prodFormCategory}
                    onChange={(e) => setProdFormCategory(e.target.value as ProductCategory)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-[#5A3825] focus:outline-none text-xs cursor-pointer"
                  >
                    {CATEGORIES.filter((cat) => cat.id !== 'todos' && cat.id !== 'ofertas').map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Unidad de Venta</label>
                  <input
                    type="text"
                    required
                    value={prodFormUnit}
                    onChange={(e) => setProdFormUnit(e.target.value)}
                    placeholder="1 kg, 500 g, 6 Litros"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-[#5A3825] focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Precio Actual ($) *</label>
                  <input
                    type="number"
                    required
                    value={prodFormPrice || ''}
                    onChange={(e) => setProdFormPrice(Number(e.target.value))}
                    placeholder="4900"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-[#5A3825] focus:outline-none text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Precio Anterior ($ - Para Oferta)</label>
                  <input
                    type="number"
                    value={prodFormOriginalPrice || ''}
                    onChange={(e) => setProdFormOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Opcional (ej. 7000)"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-[#5A3825] focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Etiqueta Especial (Badge)</label>
                  <input
                    type="text"
                    value={prodFormBadge}
                    onChange={(e) => setProdFormBadge(e.target.value)}
                    placeholder="Colanta, Ahorro, Cosecha"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-[#5A3825] focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Tipo de Etiqueta</label>
                  <select
                    value={prodFormBadgeType || ''}
                    onChange={(e) => setProdFormBadgeType(e.target.value ? (e.target.value as Product['badgeType']) : undefined)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-[#5A3825] focus:outline-none text-xs cursor-pointer"
                  >
                    <option value="">Normal / Sin tipo</option>
                    <option value="colanta">Colanta Oficial</option>
                    <option value="discount">Descuento / Ahorro</option>
                    <option value="special">Especial</option>
                  </select>
                </div>
              </div>

              {/* Product Image Section */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800">Fotografía del Producto</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setProdImageMode('url')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                        prodImageMode === 'url' ? 'bg-[#5A3825] text-white' : 'text-stone-600'
                      }`}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdImageMode('upload')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                        prodImageMode === 'upload' ? 'bg-[#5A3825] text-white' : 'text-stone-600'
                      }`}
                    >
                      Subir
                    </button>
                  </div>
                </div>

                {prodImageMode === 'url' ? (
                  <input
                    type="url"
                    value={prodFormImage}
                    onChange={(e) => setProdFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                ) : (
                  <div>
                    <input
                      ref={prodFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProductFileUpload}
                      className="hidden"
                      id="prod-upload"
                    />
                    <label
                      htmlFor="prod-upload"
                      className="w-full flex items-center justify-center p-3 border border-dashed border-stone-300 rounded-lg bg-white cursor-pointer hover:border-stone-400 gap-2"
                    >
                      <Upload size={14} className="text-stone-400" />
                      <span className="text-xs text-stone-600">Seleccionar foto desde dispositivo</span>
                    </label>
                  </div>
                )}

                {prodFormImage && (
                  <div className="flex items-center gap-3 pt-1">
                    <img src={prodFormImage} alt="Vista previa" className="w-12 h-12 rounded-md object-cover border border-stone-300" />
                    <span className="text-[11px] text-stone-500 truncate">{prodFormImage}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={prodFormDescription}
                  onChange={(e) => setProdFormDescription(e.target.value)}
                  placeholder="Detalles sobre frescura, origen o presentación..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-[#5A3825] focus:outline-none text-xs"
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5A3825] hover:bg-[#432818] text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: DETALLE DE PEDIDO */}
      {/* ================================================================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0" onClick={() => setSelectedOrder(null)} aria-hidden="true" />
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto border border-stone-200 space-y-5 text-xs">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-sans">Detalle del Pedido</span>
              <h3 className="text-xl font-extrabold text-stone-900 font-mono mt-0.5">{selectedOrder.orderNumber}</h3>
              <p className="text-stone-500 font-caledonia">{selectedOrder.slot}</p>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1.5 font-caledonia">
              <div className="flex justify-between">
                <span className="text-stone-500">Cliente:</span>
                <span className="font-bold text-stone-800">{selectedOrder.customerName || 'Cliente Osos'}</span>
              </div>
              {selectedOrder.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Teléfono:</span>
                  <span className="font-mono font-bold text-stone-800">{selectedOrder.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">Dirección:</span>
                <span className="font-medium text-stone-800 text-right">{selectedOrder.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Pago:</span>
                <span className="font-medium text-stone-800">{selectedOrder.paymentMethod}</span>
              </div>
              {selectedOrder.notes && (
                <div className="flex justify-between pt-1 border-t border-stone-200 text-stone-600 italic">
                  <span>Notas:</span>
                  <span className="text-right">"{selectedOrder.notes}"</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[10px]">Productos Solicitados</h4>
              <div className="border border-stone-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 text-[10px] font-bold text-stone-500 uppercase border-b border-stone-200">
                      <th className="py-2 px-3">Producto</th>
                      <th className="py-2 px-3 w-16 text-center">Cant.</th>
                      <th className="py-2 px-3 w-24 text-right">Unitario</th>
                      <th className="py-2 px-3 w-24 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-caledonia">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <img src={item.image} alt={item.name} className="w-7 h-7 rounded-xs object-cover border border-stone-200 shrink-0" />
                            <span className="font-medium text-stone-900 line-clamp-1">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-stone-700">{item.qty}</td>
                        <td className="py-2 px-3 text-right font-mono text-stone-500">${item.price.toLocaleString('es-CO')}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                          ${(item.price * item.qty).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Table */}
            <div className="border border-stone-200 rounded-lg overflow-hidden font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="py-1.5 px-3 text-stone-500">Subtotal de Productos:</td>
                    <td className="py-1.5 px-3 text-right text-stone-800">${selectedOrder.subtotal.toLocaleString('es-CO')}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-stone-500">Servicio de Domicilio:</td>
                    <td className="py-1.5 px-3 text-right text-stone-800">
                      {selectedOrder.shipping === 0 ? 'GRATIS' : `$${selectedOrder.shipping.toLocaleString('es-CO')}`}
                    </td>
                  </tr>
                  <tr className="bg-stone-50/80 font-bold text-sm">
                    <td className="py-2 px-3 text-stone-900">Total Liquidado:</td>
                    <td className="py-2 px-3 text-right text-[#5A3825]">${selectedOrder.total.toLocaleString('es-CO')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <select
                  value={selectedOrder.status || 'recibido'}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrder.orderNumber, e.target.value)}
                  className="px-3 py-2 text-xs font-bold uppercase rounded-lg border border-stone-300 text-stone-800 cursor-pointer bg-white"
                >
                  <option value="recibido">Recibido</option>
                  <option value="alistamiento">En Alistamiento</option>
                  <option value="en ruta">En Ruta</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>

                <button
                  type="button"
                  onClick={() => setPrintingOrder(selectedOrder)}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-stone-300"
                >
                  <Printer size={13} />
                  <span>Imprimir Factura</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedOrder.customerPhone && (
                  <a
                    href={`https://wa.me/57${selectedOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hola ${selectedOrder.customerName || 'vecino'}, te escribimos de Supermercado Osos sobre tu pedido ${selectedOrder.orderNumber}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Phone size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-[#5A3825] hover:bg-[#432818] text-white font-bold rounded-lg cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CREAR / EDITAR AVISO */}
      {/* ================================================================= */}
      {isNoticeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0" onClick={() => setIsNoticeModalOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-xl bg-white rounded-2xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto border border-stone-200">
            <button
              type="button"
              onClick={() => setIsNoticeModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-stone-900 font-serif-warm mb-4">
              {editingNotice ? 'Editar Aviso de Gaceta' : 'Publicar Nuevo Aviso'}
            </h3>

            <form onSubmit={handleSaveNoticeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Título del Aviso *</label>
                <input
                  type="text"
                  required
                  value={noticeFormTitle}
                  onChange={(e) => setNoticeFormTitle(e.target.value)}
                  placeholder="Ej. Cosecha Especial de Fresas de Santa Rosa"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Categoría</label>
                  <input
                    type="text"
                    required
                    value={noticeFormCategory}
                    onChange={(e) => setNoticeFormCategory(e.target.value)}
                    placeholder="Carnicería Colanta, Campo Local..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Autor / Emisor</label>
                  <input
                    type="text"
                    required
                    value={noticeFormAuthor}
                    onChange={(e) => setNoticeFormAuthor(e.target.value)}
                    placeholder="Supermercado Osos"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs"
                  />
                </div>
              </div>

              {/* Image */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800">Fotografía de Portada</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setNoticeImageMode('url')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                        noticeImageMode === 'url' ? 'bg-[#5A3825] text-white' : 'text-stone-600'
                      }`}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoticeImageMode('upload')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                        noticeImageMode === 'upload' ? 'bg-[#5A3825] text-white' : 'text-stone-600'
                      }`}
                    >
                      Subir
                    </button>
                  </div>
                </div>

                {noticeImageMode === 'url' ? (
                  <input
                    type="url"
                    value={noticeFormImage}
                    onChange={(e) => setNoticeFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                ) : (
                  <div>
                    <input
                      ref={noticeFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleNoticeFileUpload}
                      className="hidden"
                      id="notice-upload"
                    />
                    <label
                      htmlFor="notice-upload"
                      className="w-full flex items-center justify-center p-3 border border-dashed border-stone-300 rounded-lg bg-white cursor-pointer hover:border-stone-400 gap-2"
                    >
                      <Upload size={14} className="text-stone-400" />
                      <span className="text-xs text-stone-600">Seleccionar imagen desde tu equipo</span>
                    </label>
                  </div>
                )}

                {noticeFormImage && (
                  <div className="flex items-center gap-3 pt-1">
                    <img src={noticeFormImage} alt="Portada" className="w-14 h-10 rounded-md object-cover border border-stone-300" />
                    <span className="text-[11px] text-stone-500 truncate">{noticeFormImage}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Extracto / Resumen *</label>
                <textarea
                  rows={2}
                  required
                  value={noticeFormSummary}
                  onChange={(e) => setNoticeFormSummary(e.target.value)}
                  placeholder="Breve introducción para la tarjeta..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Contenido Completo (Párrafos)</label>
                <textarea
                  rows={4}
                  value={noticeFormContent}
                  onChange={(e) => setNoticeFormContent(e.target.value)}
                  placeholder="Párrafos separados por doble salto de línea..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="notice-featured"
                  checked={noticeFormFeatured}
                  onChange={(e) => setNoticeFormFeatured(e.target.checked)}
                  className="rounded-xs border-stone-300 text-[#5A3825] focus:ring-[#5A3825] cursor-pointer"
                />
                <label htmlFor="notice-featured" className="text-xs font-medium text-stone-700 cursor-pointer">
                  Destacar este aviso en la cabecera del blog
                </label>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="px-4 py-2 text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5A3825] hover:bg-[#432818] text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Guardar Publicación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL / VISTA DE IMPRESIÓN: FACTURA OFICIAL EN TABLAS */}
      {/* ================================================================= */}
      {printingOrder && (
        <InvoicePrintModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
};

export default AdminPanel;
