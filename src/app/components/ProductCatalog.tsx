import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Check,
  Sparkles,
  Flame,
  Leaf,
  Award,
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Apple,
  Beef,
  Milk,
  Package,
  Home,
  Cookie,
  Wine,
} from 'lucide-react';
import type { CartItem } from './CheckoutDrawer';

import { type Product, PRODUCTS, CATEGORIES, normalizeSearch } from '../data/products';
import { fetchProducts } from '../../services/productService';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  todos: ShoppingBag,
  ofertas: Flame,
  abarrotes: Package,
  frutas: Apple,
  'aseo-personal': Sparkles,
  'aseo-hogar': Home,
  dulceria: Cookie,
  lacteos: Milk,
  carnes: Beef,
  'rancho-licores': Wine,
};

interface ProductCatalogProps {
  onAddToCart: (item: Omit<CartItem, 'qty'>) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  onAddToCart,
  searchQuery = '',
  onSearchChange,
  selectedCategory: controlledCategory,
  onSelectCategory,
}) => {
  const [internalCategory, setInternalCategory] = useState<string>('todos');
  const activeCategory = controlledCategory ?? internalCategory;
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);

  useEffect(() => {
    let isMounted = true;
    fetchProducts()
      .then((data) => {
        if (isMounted && data.length > 0) {
          setProductsList(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryChange = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    } else {
      setInternalCategory(catId);
    }
  };

  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      const matchesCategory =
        activeCategory === 'todos' ||
        (activeCategory === 'ofertas'
          ? (product.originalPrice !== undefined && product.originalPrice > product.price) || product.badgeType === 'discount'
          : product.category === activeCategory);

      const cleanSearch = normalizeSearch(searchQuery);
      const matchesSearch =
        cleanSearch === '' ||
        normalizeSearch(product.name).includes(cleanSearch) ||
        normalizeSearch(product.description).includes(cleanSearch) ||
        normalizeSearch(product.categoryLabel).includes(cleanSearch);

      return matchesCategory && matchesSearch;
    });
  }, [productsList, activeCategory, searchQuery]);

  const handleAddProduct = (product: Product) => {
    onAddToCart({
      id: product.id,
      name: `${product.name} (${product.unit})`,
      price: product.price,
      originalPrice: product.originalPrice,
      unit: product.unit,
      image: product.image,
      category: product.categoryLabel,
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  return (
    <section id="catalogo" className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            <Sparkles size={14} className="text-stone-500" />
            <span>Selección Fresca del Día</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight font-serif-warm">
            Lo Más Fresco para tu Hogar
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Cosechado en la mañana por agricultores locales y entregado directamente en la puerta de tu casa.
          </p>
        </div>

        {/* Search inside catalog for quick filter */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Buscar en el catálogo..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#F06522] focus:ring-2 focus:ring-[#F06522]/15 text-stone-900 shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Category Segmented Tabs Navigation (No pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const IconComponent = CATEGORY_ICONS[cat.id] ?? ShoppingBag;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-[#5A3825] text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <IconComponent size={15} className="shrink-0" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Products Count Indicator */}
      <div className="flex items-center justify-between py-3 text-xs text-stone-500 border-b border-stone-200/60 mb-6">
        <span>Mostrando <strong>{filteredProducts.length}</strong> productos</span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange?.('')}
            className="text-[#F06522] hover:underline font-semibold cursor-pointer"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-stone-200 p-8 shadow-xs">
          <div className="w-14 h-14 rounded-xl bg-orange-50 text-[#F06522] flex items-center justify-center mx-auto mb-3">
            <SlidersHorizontal size={24} />
          </div>
          <h3 className="text-base font-bold text-stone-800">No encontramos productos con ese término</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Intenta buscar con otra palabra como &quot;aguacate&quot;, &quot;leche&quot;, &quot;pollo&quot; o &quot;pan&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              handleCategoryChange('todos');
              onSearchChange?.('');
            }}
            className="mt-4 px-4 py-2 bg-[#F06522] hover:bg-[#ea580c] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            Ver todos los productos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((product) => {
            const isAdded = !!addedIds[product.id];
            return (
              <article
                key={product.id}
                className="bg-white rounded-xl border border-stone-200/90 shadow-2xs hover:shadow-md hover:border-stone-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group touch-press"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80';
                      }}
                    />

                    {/* Badge */}
                    {product.badge && (
                      <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10">
                        {product.badgeType === 'discount' ? (
                          <span className="inline-flex items-center gap-1 bg-[#16a34a] text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-xs shadow-xs">
                            <Flame size={11} />
                            {product.badge}
                          </span>
                        ) : product.badgeType === 'fresh' ? (
                          <span className="inline-flex items-center gap-1 bg-stone-800 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-xs shadow-xs">
                            <Leaf size={11} />
                            {product.badge}
                          </span>
                        ) : product.badgeType === 'colanta' ? (
                          <span className="inline-flex items-center gap-1 bg-red-700 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-xs shadow-xs">
                            <Beef size={11} />
                            {product.badge}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-[#5A3825] text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-xs shadow-xs">
                            <Award size={11} />
                            {product.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Category tag */}
                    <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5">
                      <span className="bg-white/95 backdrop-blur-xs text-stone-800 text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-xs border border-stone-200 shadow-2xs">
                        {product.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3 sm:p-4">
                    <h3 className="font-editorial font-bold text-stone-900 text-xs sm:text-base leading-snug group-hover:text-[#F06522] transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed hidden xs:block">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Price & Add Button */}
                <div className="p-3 sm:p-4 pt-0 border-t border-stone-100 mt-1 sm:mt-2 flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
                      <span className="text-sm sm:text-base md:text-lg font-black text-[#5A3825] font-editorial tabular-nums tracking-tight">
                        ${product.price.toLocaleString('es-CO')}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[10px] sm:text-xs text-stone-400 line-through tabular-nums">
                          ${product.originalPrice.toLocaleString('es-CO')}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium">
                      por {product.unit}
                    </span>
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    aria-label={`Agregar ${product.name} al carrito`}
                    className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs shrink-0 ${
                      isAdded
                        ? 'bg-[#16a34a] text-white shadow-emerald-500/20'
                        : 'bg-[#F06522] hover:bg-[#d94f13] text-white hover:shadow-orange-500/25'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={13} className="stroke-[3]" />
                        <span>¡Agregado!</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} className="stroke-[2.5]" />
                        <span>Agregar</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProductCatalog;
