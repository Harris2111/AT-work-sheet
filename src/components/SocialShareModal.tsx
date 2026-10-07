import React, { useState, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Facebook,
  Download,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import { AbDesaiATProduct, formatRs } from '../data/luggageCatalog';
import { ProductImage, getProxiedImageUrl } from './ProductImage';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: AbDesaiATProduct | null;
  allProducts: AbDesaiATProduct[];
  onSelectProduct: (product: AbDesaiATProduct) => void;
}

type CardAspect = 'square' | 'story';

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  product,
  allProducts,
  onSelectProduct,
}) => {
  const [aspect, setAspect] = useState<CardAspect>('square');
  const [ctaLabel, setCtaLabel] = useState('SHOP NOW AT ABDESAI.MU');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  // Always resolve to an actual verified product so the image and price match 100%
  const activeProduct =
    product ||
    allProducts.find((p) => p.id === 56583) ||
    allProducts[0];

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://abdesai.mu';

  // Clean shareable URL that renders rich OpenGraph image card + opens directly to the product
  const shareUrl = activeProduct
    ? `${baseUrl}?product=${encodeURIComponent(activeProduct.slug)}`
    : baseUrl;

  const previewImg = activeProduct.image;

  const cardHeadline = activeProduct.name.replace(/^AMERICAN TOURISTER\s+/i, '');

  const cardPrice = formatRs(activeProduct.priceRs);
  const cardOldPrice =
    activeProduct.regularPriceRs && activeProduct.regularPriceRs > activeProduct.priceRs
      ? formatRs(activeProduct.regularPriceRs)
      : undefined;

  const cardPromo =
    activeProduct.promoBadge || 'Confirm Availability Before Payment · Home Delivery Up to 10 Days';

  // Short, punchy 1-line CTA + link (NO long text blocks)
  const punchyShareMessage = `${cardHeadline} (${cardPrice}) — Shop Now: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  // Renders a crisp PNG image with the product photo, price, and embedded CTA button
  const generateCardBlob = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = 1080;
    const height = aspect === 'story' ? 1920 : 1080;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 2. Top Header Bar
    ctx.fillStyle = '#0F2942';
    ctx.fillRect(0, 0, width, 96);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('A.B. DESAI MAURITIUS · AMERICAN TOURISTER', 48, 60);

    ctx.fillStyle = '#D4B886';
    ctx.font = '600 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('abdesai.mu', width - 48, 60);
    ctx.textAlign = 'left';

    // 3. Load Product Image via CORS-safe proxy
    const proxyUrl = getProxiedImageUrl(previewImg);
    const imgAreaTop = 110;
    const imgAreaHeight = aspect === 'story' ? 1050 : 540;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load error'));
        img.src = proxyUrl;
      });

      const pad = 40;
      const maxW = width - pad * 2;
      const maxH = imgAreaHeight - pad * 2;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = (width - drawW) / 2;
      const drawY = imgAreaTop + (imgAreaHeight - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } catch {
      ctx.fillStyle = '#F4F2ED';
      ctx.fillRect(60, imgAreaTop + 20, width - 120, imgAreaHeight - 40);
    }

    // 4. Bottom Dark Luxury Panel with Embedded CTA Button
    const panelTop = imgAreaTop + imgAreaHeight;
    const panelHeight = height - panelTop;
    ctx.fillStyle = '#141413';
    ctx.fillRect(0, panelTop, width, panelHeight);

    // Promo Kicker
    ctx.fillStyle = '#D4B886';
    ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(cardPromo.toUpperCase(), 56, panelTop + 68);

    // Title (Wrap up to 2 lines)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 44px "Cormorant Garamond", Georgia, serif';
    const words = cardHeadline.split(' ');
    let line1 = '';
    let line2 = '';
    for (const w of words) {
      const test = line1 ? `${line1} ${w}` : w;
      if (ctx.measureText(test).width < width - 112) {
        line1 = test;
      } else {
        line2 = line2 ? `${line2} ${w}` : w;
      }
    }
    ctx.fillText(line1, 56, panelTop + 130);
    if (line2) {
      if (ctx.measureText(line2).width > width - 112) {
        line2 = line2.slice(0, 42) + '...';
      }
      ctx.fillText(line2, 56, panelTop + 184);
    }

    // Price Block
    const priceY = line2 ? panelTop + 260 : panelTop + 215;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 58px "JetBrains Mono", monospace';
    ctx.fillText(cardPrice, 56, priceY);

    if (cardOldPrice) {
      const currentPriceWidth = ctx.measureText(cardPrice).width;
      ctx.fillStyle = '#8E8D87';
      ctx.font = '400 34px "JetBrains Mono", monospace';
      const oldX = 56 + currentPriceWidth + 24;
      ctx.fillText(`Was ${cardOldPrice}`, oldX, priceY - 6);
      const oldW = ctx.measureText(`Was ${cardOldPrice}`).width;
      ctx.strokeStyle = '#8E8D87';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(oldX, priceY - 18);
      ctx.lineTo(oldX + oldW, priceY - 18);
      ctx.stroke();
    }

    // Embedded Call-To-Action Button inside the Image
    const btnY = height - (aspect === 'story' ? 210 : 145);
    const btnH = 92;
    const btnX = 56;
    const btnW = width - 112;

    ctx.fillStyle = '#0F2942';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 16);
    ctx.fill();

    ctx.strokeStyle = '#D4B886';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 30px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${ctaLabel}  →`, width / 2, btnY + 57);
    ctx.textAlign = 'left';

    if (aspect === 'story') {
      ctx.fillStyle = '#A09F99';
      ctx.font = '400 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Port-Louis · Tribeca · Trianon · Bagatelle · Cascavelle · Rose-Belle · +230 5979 7960',
        width / 2,
        height - 56
      );
      ctx.textAlign = 'left';
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  };

  const handleDownloadCardImage = async () => {
    setIsGeneratingImg(true);
    try {
      const blob = await generateCardBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeProduct.slug}-card.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleShareImageWithLink = async () => {
    setIsGeneratingImg(true);
    try {
      const blob = await generateCardBlob();
      if (blob && navigator.share) {
        const file = new File(
          [blob],
          `${activeProduct.slug}.png`,
          { type: 'image/png' }
        );
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: cardHeadline,
            text: `${ctaLabel}: ${shareUrl}`,
            url: shareUrl,
          });
          return;
        }
        await navigator.share({
          title: cardHeadline,
          text: `${ctaLabel}: ${shareUrl}`,
          url: shareUrl,
        });
        return;
      }
      await handleDownloadCardImage();
    } catch {
      // user cancelled share sheet
    } finally {
      setIsGeneratingImg(false);
    }
  };

  // Clean, short WhatsApp & Facebook share URLs (renders image link preview card + clickable CTA link)
  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(
    punchyShareMessage
  )}`;
  const facebookShareHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    shareUrl
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-share-title"
    >
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-[#F9F9F8] border border-black/10 rounded-xl max-w-4xl w-full overflow-hidden shadow-xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 bg-white">
          <div>
            <h2 id="social-share-title" className="text-xl font-semibold text-[#141413]">
              Visual CTA Card & Link Share
            </h2>
            <p className="text-xs text-[#65645E] mt-0.5">
              Share an image card with an embedded Call-to-Action button & direct clickable link (no long text)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#65645E] hover:text-[#141413] hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close social share modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-center">
          {/* Left Column: Clickable Visual Card with Embedded CTA Button */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-xs font-semibold text-[#65645E]">
                Interactive Visual Card Preview
              </span>
              <div className="flex items-center gap-1 p-1 bg-[#EFECE6] rounded-lg">
                <button
                  type="button"
                  onClick={() => setAspect('square')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    aspect === 'square'
                      ? 'bg-white text-[#141413] shadow-xs'
                      : 'text-[#65645E] hover:text-[#141413]'
                  }`}
                >
                  1:1 Square Card
                </button>
                <button
                  type="button"
                  onClick={() => setAspect('story')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    aspect === 'story'
                      ? 'bg-white text-[#141413] shadow-xs'
                      : 'text-[#65645E] hover:text-[#141413]'
                  }`}
                >
                  9:16 Story Card
                </button>
              </div>
            </div>

            {/* Entire Card is a Clickable CTA Link */}
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`group w-full bg-white text-[#141413] rounded-xl overflow-hidden border border-black/15 flex flex-col justify-between shadow-md hover:shadow-xl transition-all ${
                aspect === 'story' ? 'max-w-[300px] min-h-[470px]' : 'max-w-[380px] min-h-[390px]'
              }`}
              title="Click to open direct product link"
            >
              {/* Top Strip */}
              <div className="bg-[#0F2942] text-white px-4 py-2 flex items-center justify-between text-[11px]">
                <span className="font-semibold tracking-wide">
                  A.B. DESAI · AMERICAN TOURISTER
                </span>
                <span className="font-mono-tabular text-[#D4B886]">abdesai.mu</span>
              </div>

              {/* ProductImage Area */}
              <div className="relative h-52 w-full bg-white p-4 flex items-center justify-center border-b border-black/6">
                <ProductImage
                  src={previewImg}
                  alt={cardHeadline}
                  series={activeProduct.series}
                  title={cardHeadline}
                  className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </div>

              {/* Bottom Panel with Price + Embedded CTA Button */}
              <div className="p-4 bg-[#141413] text-white flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-[#D4B886] uppercase tracking-wider truncate">
                    {cardPromo}
                  </p>
                  <h3 className="font-display text-xl font-semibold text-white mt-0.5 line-clamp-1 leading-snug">
                    {cardHeadline}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono-tabular text-xl font-semibold text-white">
                      {cardPrice}
                    </span>
                    {cardOldPrice && (
                      <span className="font-mono-tabular text-xs text-white/50 line-through">
                        Was {cardOldPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Embedded Call to Action Button inside the Card */}
                <div className="w-full py-2.5 px-4 rounded-lg bg-[#0F2942] border border-[#D4B886]/60 text-white text-xs font-semibold flex items-center justify-center gap-1.5 group-hover:bg-[#163B5E] transition-colors">
                  <span>{ctaLabel}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#D4B886]" />
                </div>
              </div>
            </a>
          </div>

          {/* Right Column: Clean CTA Customizer + Instant Image & Link Sharing */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Select Product / Promo to Feature on the Card */}
              <div>
                <label
                  htmlFor="share-product-select"
                  className="block text-xs font-semibold text-[#141413] mb-1.5"
                >
                  Select Product or Promo to Share (193 Verified Items)
                </label>
                <select
                  id="share-product-select"
                  value={activeProduct.id}
                  onChange={(e) => {
                    const found = allProducts.find(
                      (p) => p.id === Number(e.target.value)
                    );
                    if (found) onSelectProduct(found);
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-black/15 rounded-lg text-[#141413] focus:outline-none focus:border-[#0F2942]"
                >
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatRs(p.priceRs)}
                      {p.regularPriceRs ? ` (Was ${formatRs(p.regularPriceRs)})` : ''} —{' '}
                      {p.name.replace(/^AMERICAN TOURISTER\s+/i, '')}
                    </option>
                  ))}
                </select>
              </div>

              {/* CTA Button Text Selector */}
              <div>
                <span className="block text-xs font-semibold text-[#141413] mb-2">
                  Choose Embedded Call-to-Action Button Label
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'SHOP NOW AT ABDESAI.MU',
                    'ORDER ON WHATSAPP',
                    'CLAIM PROMO OFFER',
                    'VIEW IN SHOWROOM',
                  ].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setCtaLabel(label)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition-colors cursor-pointer truncate ${
                        ctaLabel === label
                          ? 'border-[#0F2942] bg-[#0F2942] text-white'
                          : 'border-black/12 bg-white text-[#141413] hover:bg-[#EFECE6]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean Shareable Link (Renders Image + CTA Link Preview automatically) */}
              <div className="p-4 rounded-xl bg-white border border-black/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#141413]">
                    Shareable CTA Link (Auto-displays Product Image Card)
                  </span>
                  <span className="text-[11px] text-emerald-800 font-semibold">
                    OpenGraph Image Enabled
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2.5 text-xs font-mono-tabular bg-[#F9F9F8] border border-black/12 rounded-lg text-[#141413] truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 text-xs font-semibold bg-[#0F2942] text-white rounded-lg hover:bg-[#091A2B] transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#65645E]">
                  Paste this link on WhatsApp, Facebook, or Messenger — it automatically generates a clickable product image card without long text.
                </p>
              </div>
            </div>

            {/* Action Buttons: Share Image Card or Direct Link */}
            <div className="space-y-2.5 pt-2 border-t border-black/8">
              <span className="block text-xs font-semibold text-[#65645E]">
                Share Image Card & CTA Link Instantly
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isGeneratingImg}
                  onClick={handleShareImageWithLink}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold bg-[#0F2942] text-white rounded-lg hover:bg-[#091A2B] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Share2 className="w-4 h-4" />
                  <span>
                    {isGeneratingImg ? 'Preparing Image...' : 'Share Image + CTA Link'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingImg}
                  onClick={handleDownloadCardImage}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold bg-white border border-black/15 text-[#141413] rounded-lg hover:bg-[#EFECE6] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-[#0F2942]" />
                  <span>Download PNG Card</span>
                </button>

                <a
                  href={whatsappShareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Link Card</span>
                </a>

                <a
                  href={facebookShareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold bg-[#1877F2] text-white rounded-lg hover:bg-[#1464CC] transition-colors whitespace-nowrap"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook Link Card</span>
                </a>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-[#65645E]">
                <span>Official Product ID #{activeProduct.id}</span>
                <a
                  href={activeProduct.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#0F2942] font-semibold hover:underline"
                >
                  <span>Verify on abdesai.mu</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
