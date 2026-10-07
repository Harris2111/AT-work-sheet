import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  MapPin,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { AbDesaiATProduct, formatRs } from '../data/luggageCatalog';
import { ProductImage } from './ProductImage';

interface ProductDetailModalProps {
  product: AbDesaiATProduct | null;
  relatedSeriesProducts: AbDesaiATProduct[];
  onSelectProduct: (product: AbDesaiATProduct) => void;
  onClose: () => void;
  onAddToCart: (product: AbDesaiATProduct) => void;
  onOpenShare: (product: AbDesaiATProduct) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  relatedSeriesProducts,
  onSelectProduct,
  onClose,
  onAddToCart,
  onOpenShare,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setAddedFeedback(false);
  }, [product]);

  if (!product) return null;

  const validGallery = (product.gallery || []).filter(
    (g) => typeof g === 'string' && g.trim().length > 0
  );
  const images =
    validGallery.length > 0
      ? validGallery
      : product.image
        ? [product.image]
        : [];

  const savings =
    product.regularPriceRs && product.regularPriceRs > product.priceRs
      ? product.regularPriceRs - product.priceRs
      : 0;

  const handleAdd = () => {
    onAddToCart(product);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1600);
  };

  const whatsappDirectOrderUrl = `https://wa.me/23054988887?text=${encodeURIComponent(
    `Hello AB Desai Mauritius, I would like to order:\n• ${product.name}\n• SKU: ${product.sku}\n• Price: ${formatRs(
      product.priceRs
    )}${product.promoBadge ? `\n• Promo: ${product.promoBadge}` : ''}\n• Link: ${product.permalink}`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-modal-title"
    >
      <div className="bg-[#F9F9F8] border border-black/10 rounded-xl max-w-5xl w-full overflow-hidden shadow-2xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-black/8">
          <div className="flex items-center gap-2 text-xs text-[#65645E]">
            <span className="font-semibold text-[#141413]">American Tourister</span>
            <span aria-hidden="true">·</span>
            <span>{product.series} Series</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">SKU: {product.sku}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenShare(product)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F2942] bg-[#EFECE6] hover:bg-[#E2DDD3] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on Social Media</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#65645E] hover:text-[#141413] hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Close product details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Sticky Gallery with Exact abdesai.mu Product Photos */}
          <div className="lg:col-span-6 p-6 bg-white border-b lg:border-b-0 lg:border-r border-black/8 flex flex-col justify-between">
            <div>
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white border border-black/8 p-4 flex items-center justify-center">
                <ProductImage
                  src={images[activeImageIndex] || product.image}
                  alt={product.name}
                  series={product.series}
                  title={product.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {images.length > 1 && (
                <div className="flex items-center gap-2.5 mt-4 overflow-x-auto pb-1">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-md overflow-hidden border bg-white p-1 shrink-0 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#0F2942] ring-2 ring-[#0F2942]/20'
                          : 'border-black/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <ProductImage
                        src={imgUrl}
                        alt={`${product.name} view ${idx + 1}`}
                        series={product.series}
                        title={product.series}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-black/8 flex items-center justify-between text-xs text-[#65645E]">
              <span>Product ID #{product.id} on abdesai.mu</span>
              <a
                href={product.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#0F2942] font-semibold hover:underline"
              >
                <span>Open Live abdesai.mu Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Purchase Module */}
          <div className="lg:col-span-6 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#65645E]">
                  <span>American Tourister</span>
                  <span aria-hidden="true">·</span>
                  <span>{product.sizeCategory}</span>
                  <span aria-hidden="true">·</span>
                  <span>3-Year Global Warranty</span>
                </div>
                <h2
                  id="pdp-modal-title"
                  className="font-display text-2xl sm:text-3xl font-semibold text-[#141413] mt-1 leading-snug"
                >
                  {product.name}
                </h2>
              </div>

              {/* Price & Promo Box */}
              <div className="p-4 rounded-lg bg-white border border-black/8 space-y-2">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono-tabular text-2xl font-semibold text-[#141413]">
                      {formatRs(product.priceRs)}
                    </span>
                    {product.regularPriceRs && (
                      <span className="font-mono-tabular text-sm text-[#65645E] line-through">
                        {formatRs(product.regularPriceRs)}
                      </span>
                    )}
                    {savings > 0 && (
                      <span className="text-xs font-semibold text-[#8C6D3F]">
                        Save {formatRs(savings)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      product.inStock ? 'text-emerald-800' : 'text-amber-800'
                    }`}
                  >
                    {product.inStock ? 'In Stock · AB Desai Mauritius' : 'Out of Stock Online'}
                  </span>
                </div>

                {product.promoBadge && (
                  <p className="text-xs font-semibold text-[#0F2942] pt-2 border-t border-black/6">
                    Active Promotion: {product.promoBadge}
                  </p>
                )}
              </div>

              {/* Specifications from abdesai.mu */}
              <div>
                <h4 className="text-xs font-semibold text-[#141413] mb-1.5">
                  Official Specifications & Description
                </h4>
                <p className="text-xs text-[#65645E] leading-relaxed bg-white p-3.5 rounded-lg border border-black/8">
                  {product.specsText}
                </p>
              </div>

              {/* Other Options in the Same Series */}
              {relatedSeriesProducts.length > 1 && (
                <div>
                  <span className="block text-xs font-semibold text-[#141413] mb-2">
                    Other {product.series} Colours, Sizes & Offers on abdesai.mu ({relatedSeriesProducts.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {relatedSeriesProducts.map((rel) => {
                      const isCurrent = rel.id === product.id;
                      return (
                        <button
                          key={rel.id}
                          type="button"
                          onClick={() => onSelectProduct(rel)}
                          className={`p-2 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            isCurrent
                              ? 'border-[#0F2942] bg-[#0F2942] text-white'
                              : 'border-black/10 bg-white text-[#141413] hover:border-black/30'
                          }`}
                        >
                          {rel.image ? (
                            <img
                              src={rel.image}
                              alt={rel.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded object-contain bg-white shrink-0"
                            />
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-semibold truncate">
                              {rel.name.replace(/^AMERICAN TOURISTER\s+/i, '')}
                            </div>
                            <div
                              className={`text-[11px] font-mono-tabular ${
                                isCurrent ? 'text-white/85' : 'text-[#65645E]'
                              }`}
                            >
                              {formatRs(rel.priceRs)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Actions */}
            <div className="pt-4 border-t border-black/8 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={handleAdd}
                  className={`flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    product.inStock
                      ? 'bg-[#0F2942] text-white hover:bg-[#091A2B] cursor-pointer'
                      : 'bg-black/15 text-[#65645E] cursor-not-allowed'
                  }`}
                >
                  {addedFeedback ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Travel Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {product.inStock
                          ? `Add to Bag · ${formatRs(product.priceRs)}`
                          : 'Currently Out of Stock'}
                      </span>
                    </>
                  )}
                </button>

                <a
                  href={whatsappDirectOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Order on WhatsApp (+230 5498 8887)</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#65645E] pt-1">
                <span className="inline-flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#0F2942]" />
                  <span>Free Mauritian Delivery from Rs 3,000</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F2942]" />
                  <span>3-Year Global Warranty</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0F2942]" />
                  <span>Port-Louis · Tribeca · Trianon · Bagatelle · Cascavelle · Rose-Belle</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
