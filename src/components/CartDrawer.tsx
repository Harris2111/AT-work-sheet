import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  CheckCircle2,
  MessageCircle,
  Share2,
} from 'lucide-react';
import {
  AbDesaiATProduct,
  SHOWROOMS,
  formatRs,
} from '../data/luggageCatalog';
import { ProductImage } from './ProductImage';

export interface CartItem {
  key: string;
  product: AbDesaiATProduct;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Plaines Wilhems');
  const [selectedShowroom, setSelectedShowroom] = useState(SHOWROOMS[0].name);
  const [paymentMethod, setPaymentMethod] = useState<'juice' | 'cod' | 'card'>('juice');
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotalRs = items.reduce(
    (sum, item) => sum + item.product.priceRs * item.quantity,
    0
  );
  const freeDeliveryThreshold = 3000;
  const qualifiesFreeDelivery =
    subtotalRs >= freeDeliveryThreshold || deliveryMethod === 'pickup';
  const deliveryFeeRs = items.length === 0 ? 0 : qualifiesFreeDelivery ? 0 : 250;
  const totalRs = subtotalRs + deliveryFeeRs;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) {
      setFormError('Please enter your full name and Mauritian mobile number.');
      return;
    }
    if (deliveryMethod === 'delivery' && !address.trim()) {
      setFormError('Please enter your street delivery address in Mauritius.');
      return;
    }
    setFormError(null);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setConfirmedOrderId(`ABD-${randomNum}`);
  };

  const buildWhatsAppOrderText = () => {
    const lines = [
      `Hello AB Desai Mauritius (abdesai.mu), I would like to place an American Tourister order:`,
      confirmedOrderId ? `Order Reference: #${confirmedOrderId}` : null,
      ...items.map(
        (item, idx) =>
          `${idx + 1}. ${item.product.name} (SKU: ${item.product.sku}) × ${
            item.quantity
          } = ${formatRs(item.product.priceRs * item.quantity)}`
      ),
      `Subtotal: ${formatRs(subtotalRs)}`,
      `Delivery: ${deliveryFeeRs === 0 ? 'FREE' : formatRs(deliveryFeeRs)} (${
        deliveryMethod === 'pickup'
          ? `Pickup: ${selectedShowroom}`
          : `${address}, ${district}`
      })`,
      `Total Payable: ${formatRs(totalRs)}`,
      `Payment: ${
        paymentMethod === 'juice'
          ? 'Juice by MCB'
          : paymentMethod === 'cod'
          ? 'Cash on Delivery'
          : 'Card on Delivery'
      }`,
      `Customer: ${customerName || 'Customer'} (${phone || 'Mauritius'})`,
    ];
    return lines.filter(Boolean).join('\n');
  };

  const whatsappCheckoutUrl = `https://wa.me/23054988887?text=${encodeURIComponent(
    buildWhatsAppOrderText()
  )}`;

  const handleResetAfterOrder = () => {
    setConfirmedOrderId(null);
    onClearCart();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div className="bg-[#F9F9F8] w-full max-w-lg h-full flex flex-col justify-between shadow-2xl border-l border-black/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-black/8">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#0F2942]" />
            <h2 id="cart-drawer-title" className="text-lg font-semibold text-[#141413]">
              Your American Tourister Bag ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#65645E] hover:text-[#141413] hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2.5 bg-[#EFECE6] border-b border-black/6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#141413]">
            <Truck className="w-4 h-4 text-[#0F2942] shrink-0" />
            {subtotalRs >= freeDeliveryThreshold ? (
              <span>
                You qualify for <strong>Free Home Delivery</strong> across Mauritius!
              </span>
            ) : (
              <span>
                Add{' '}
                <strong className="font-mono-tabular">
                  {formatRs(freeDeliveryThreshold - subtotalRs)}
                </strong>{' '}
                more for Free Mauritian Home Delivery (from Rs 3,000)
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {confirmedOrderId ? (
            <div className="bg-white border border-black/10 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="w-7 h-7 shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-[#141413]">
                    Order #{confirmedOrderId} Confirmed — Preparing Shipment
                  </h3>
                  <p className="text-xs text-[#65645E]">
                    Official A.B. Desai Mauritius Dispatch & Showroom Reservation
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#F9F9F8] border border-black/8 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#65645E]">Customer:</span>
                  <span className="font-semibold text-[#141413]">
                    {customerName} · {phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#65645E]">Fulfillment:</span>
                  <span className="font-semibold text-[#141413]">
                    {deliveryMethod === 'pickup'
                      ? `Pickup at ${selectedShowroom}`
                      : `${address}, ${district}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-black/8 flex justify-between text-sm font-semibold">
                  <span>Total Amount:</span>
                  <span className="font-mono-tabular text-[#0F2942]">
                    {formatRs(totalRs)}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <a
                  href={whatsappCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Instant Copy to AB Desai WhatsApp (+230 5498 8887)</span>
                </a>
                <button
                  type="button"
                  onClick={handleResetAfterOrder}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-black/15 text-[#141413] rounded-lg hover:bg-[#EFECE6] transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShoppingBag className="w-10 h-10 text-[#65645E]/50 mx-auto stroke-[1.5]" />
              <h3 className="text-base font-semibold text-[#141413]">
                Your travel bag is currently empty
              </h3>
              <p className="text-xs text-[#65645E] max-w-xs mx-auto">
                Explore American Tourister Skytrac, Senna BOGO, Jamaica Combos, Dashway, or Duncan sets.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="p-3.5 bg-white rounded-lg border border-black/8 flex gap-3.5 items-center"
                  >
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-white border border-black/6 p-1 shrink-0 flex items-center justify-center">
                      <ProductImage
                        src={item.product.image}
                        alt={item.product.name}
                        series={item.product.series}
                        title={item.product.series}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-[#141413] line-clamp-2">
                          {item.product.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.key)}
                          className="text-[#65645E] hover:text-red-700 transition-colors cursor-pointer shrink-0"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#65645E] mt-0.5">
                        {item.product.series} · SKU: {item.product.sku}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="inline-flex items-center border border-black/12 rounded-md bg-[#F9F9F8]">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.key, -1)}
                            className="p-1 text-[#141413] hover:bg-black/5 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-mono-tabular font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.key, 1)}
                            className="p-1 text-[#141413] hover:bg-black/5 cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs font-mono-tabular font-semibold text-[#141413]">
                          {formatRs(item.product.priceRs * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form
                id="checkout-form"
                onSubmit={handlePlaceOrder}
                className="space-y-4 pt-3 border-t border-black/8"
              >
                <h3 className="text-sm font-semibold text-[#141413]">
                  Mauritius Delivery & Showroom Pickup Details
                </h3>

                {formError && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g., Jean-Luc Ramguttee"
                      className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-lg focus:outline-none focus:border-[#0F2942]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1">
                      Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g., 5498 8887"
                      className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-lg focus:outline-none focus:border-[#0F2942]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Fulfillment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#EFECE6] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        deliveryMethod === 'delivery'
                          ? 'bg-white text-[#141413] shadow-xs'
                          : 'text-[#65645E]'
                      }`}
                    >
                      Home Delivery (Mauritius)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        deliveryMethod === 'pickup'
                          ? 'bg-white text-[#141413] shadow-xs'
                          : 'text-[#65645E]'
                      }`}
                    >
                      Showroom Click & Collect
                    </button>
                  </div>
                </div>

                {deliveryMethod === 'delivery' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#141413] mb-1">
                        Street Address & Town *
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Royal Road, Quatre Bornes"
                        className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-lg focus:outline-none focus:border-[#0F2942]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#141413] mb-1">
                        District
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs bg-white border border-black/15 rounded-lg focus:outline-none focus:border-[#0F2942]"
                      >
                        <option>Plaines Wilhems</option>
                        <option>Port Louis</option>
                        <option>Moka</option>
                        <option>Pamplemousses</option>
                        <option>Rivière du Rempart</option>
                        <option>Black River</option>
                        <option>Flacq</option>
                        <option>Grand Port</option>
                        <option>Savanne</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1">
                      Select AB Desai Showroom
                    </label>
                    <select
                      value={selectedShowroom}
                      onChange={(e) => setSelectedShowroom(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-lg focus:outline-none focus:border-[#0F2942]"
                    >
                      {SHOWROOMS.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.address})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Payment Option
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'juice', label: 'Juice by MCB' },
                      { id: 'cod', label: 'Cash on Delivery' },
                      { id: 'card', label: 'Card on Delivery' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setPaymentMethod(opt.id as 'juice' | 'cod' | 'card')
                        }
                        className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap truncate ${
                          paymentMethod === opt.id
                            ? 'border-[#0F2942] bg-[#0F2942] text-white'
                            : 'border-black/12 bg-white text-[#141413]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {items.length > 0 && !confirmedOrderId && (
          <div className="p-6 bg-white border-t border-black/8 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#65645E]">
                <span>Subtotal</span>
                <span className="font-mono-tabular">{formatRs(subtotalRs)}</span>
              </div>
              <div className="flex justify-between text-[#65645E]">
                <span>Mauritius Delivery</span>
                <span className="font-mono-tabular">
                  {deliveryFeeRs === 0 ? 'FREE' : formatRs(deliveryFeeRs)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[#141413] pt-2 border-t border-black/8">
                <span>Total (Incl. VAT)</span>
                <span className="font-mono-tabular text-base">{formatRs(totalRs)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="submit"
                form="checkout-form"
                className="w-full py-3 px-4 text-xs font-semibold bg-[#0F2942] text-white rounded-lg hover:bg-[#091A2B] transition-colors cursor-pointer whitespace-nowrap"
              >
                Confirm Order · {formatRs(totalRs)}
              </button>
              <a
                href={whatsappCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 py-3 px-4 text-xs font-semibold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] transition-colors whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Send Bag to WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
