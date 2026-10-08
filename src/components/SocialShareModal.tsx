import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
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
  Sparkles,
  Smartphone,
  LayoutGrid,
  Layers,
  Tag,
} from 'lucide-react';
import { AbDesaiATProduct, formatRs } from '../data/luggageCatalog';
import { ProductImage, loadCorsSafeCanvasImage } from './ProductImage';
import {
  ALL_DISPLAY_SERIES_ORDER,
  getCompleteSeriesLineup,
} from '../data/productSpecs';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: AbDesaiATProduct | null;
  allProducts: AbDesaiATProduct[];
  onSelectProduct: (product: AbDesaiATProduct) => void;
}

type CardAspect = 'story' | 'square';
type StatusTemplateMode = 'store-showcase' | 'series-lineup' | 'single-product';

const TOP_SHOWCASE_IDS = [56981, 56513, 47808, 41100];

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  product,
  allProducts,
  onSelectProduct,
}) => {
  const [templateMode, setTemplateMode] = useState<StatusTemplateMode>(
    product ? 'single-product' : 'store-showcase'
  );
  const [aspect, setAspect] = useState<CardAspect>('story');
  const [selectedSeries, setSelectedSeries] = useState<string>('Jamaica');
  const [ctaLabel, setCtaLabel] = useState('WHATSAPP +230 5979 7960 TO ORDER');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setTemplateMode('single-product');
        setSelectedSeries(product.series);
      } else {
        setTemplateMode('store-showcase');
      }
      setAspect('story');
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const activeProduct =
    product ||
    allProducts.find((p) => p.id === 56981) ||
    allProducts.find((p) => p.id === 56583) ||
    allProducts[0];

  const showcaseProducts = TOP_SHOWCASE_IDS.map((id) =>
    allProducts.find((p) => p.id === id)
  ).filter((p): p is AbDesaiATProduct => Boolean(p));

  const seriesLineup = getCompleteSeriesLineup(selectedSeries, allProducts);

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://abdesai.mu';

  const shareUrl =
    templateMode === 'single-product' && activeProduct
      ? `${baseUrl}?product=${encodeURIComponent(activeProduct.slug)}`
      : baseUrl;

  const previewImg = activeProduct.image;
  const cardHeadline = activeProduct.name.replace(/^AMERICAN TOURISTER\s+/i, '');
  const cardPrice = formatRs(activeProduct.priceRs);
  const cardOldPrice =
    activeProduct.regularPriceRs &&
    activeProduct.regularPriceRs > activeProduct.priceRs
      ? formatRs(activeProduct.regularPriceRs)
      : undefined;

  const cardPromo =
    activeProduct.promoBadge ||
    'Confirm Availability Before Payment · Home Delivery Up to 10 Days';

  // Ready-to-paste WhatsApp Status Caption
  const whatsappStatusCaption =
    templateMode === 'store-showcase'
      ? `🧳 *A.B. DESAI MAURITIUS — OFFICIAL AMERICAN TOURISTER STORE*\n🔥 Jamaica 3× Medium Set: Rs 11,400 · Cabin+XL: Rs 9,000 · Skytrac 2nd at 50% OFF · Bricklane Cabin 50% OFF!\n📍 Port-Louis · Tribeca · Trianon · Bagatelle · Cascavelle · Rose-Belle\n📲 WhatsApp: +230 5979 7960 (Confirm availability before payment · Delivery up to 10 days)\n🛒 Browse Full Shop: ${baseUrl}`
      : templateMode === 'series-lineup'
      ? `🧳 *AMERICAN TOURISTER ${selectedSeries.toUpperCase()} COLLECTION — A.B. DESAI*\n${seriesLineup.rows
          .slice(0, 4)
          .map((r) => `• ${r.sizeLabel}: *${formatRs(r.priceRs)}*`)
          .join('\n')}\n📲 WhatsApp: +230 5979 7960 · Shop Online: ${baseUrl}`
      : `🧳 *${cardHeadline}* — *${cardPrice}*${
          cardOldPrice ? ` (Was ${cardOldPrice})` : ''
        }\n✨ ${cardPromo}\n📲 WhatsApp: +230 5979 7960 · Order Here: ${shareUrl}`;

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

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(whatsappStatusCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2400);
    } catch {
      const input = document.createElement('input');
      input.value = whatsappStatusCaption;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2400);
    }
  };

  const loadQrCanvasImage = async (targetUrl: string): Promise<HTMLImageElement | null> => {
    try {
      const dataUrl = await QRCode.toDataURL(targetUrl, {
        width: 240,
        margin: 1,
        color: { dark: '#0F2942', light: '#FFFFFF' },
      });
      return await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      });
    } catch {
      return null;
    }
  };

  // Renders a crisp 1080x1920 (WhatsApp Status 9:16) or 1080x1080 PNG
  const generateCardBlob = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = 1080;
    const height = aspect === 'story' ? 1920 : 1080;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Background
    ctx.fillStyle = '#F9F9F8';
    ctx.fillRect(0, 0, width, height);

    // 2. Top Brand Header Bar
    const headerH = aspect === 'story' ? 148 : 96;
    ctx.fillStyle = '#0F2942';
    ctx.fillRect(0, 0, width, headerH);

    ctx.fillStyle = '#FFD166';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'OFFICIAL MAURITIUS DISTRIBUTOR · A.B. DESAI',
      48,
      aspect === 'story' ? 54 : 38
    );

    ctx.fillStyle = '#FFFFFF';
    ctx.font =
      aspect === 'story'
        ? '900 42px "Plus Jakarta Sans", sans-serif'
        : '800 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'AMERICAN TOURISTER MAURITIUS',
      48,
      aspect === 'story' ? 108 : 76
    );

    ctx.fillStyle = '#FFD166';
    ctx.font = '800 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('abdesai.mu', width - 48, aspect === 'story' ? 106 : 74);
    ctx.textAlign = 'left';

    // Red Promo Sub-strip
    const stripY = headerH;
    const stripH = aspect === 'story' ? 68 : 48;
    ctx.fillStyle = '#B81D24';
    ctx.fillRect(0, stripY, width, stripH);
    ctx.fillStyle = '#FFFFFF';
    ctx.font =
      aspect === 'story'
        ? '800 25px "Plus Jakarta Sans", sans-serif'
        : '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      templateMode === 'store-showcase'
        ? 'OFFICIAL STORE SHOWCASE · ALL PROMOS & BUNDLES LIVE'
        : templateMode === 'series-lineup'
        ? `${selectedSeries.toUpperCase()} COLLECTION · ALL SIZES & PRICES`
        : cardPromo.toUpperCase(),
      width / 2,
      stripY + (aspect === 'story' ? 43 : 31)
    );
    ctx.textAlign = 'left';

    const bodyTop = stripY + stripH;
    const footerH = aspect === 'story' ? 360 : 240;
    const bodyHeight = height - bodyTop - footerH;

    if (templateMode === 'store-showcase') {
      // 2x2 Grid of Top 4 Store Promos
      const pad = 28;
      const gap = 22;
      const cellW = (width - pad * 2 - gap) / 2;
      const cellH = (bodyHeight - pad * 2 - gap) / 2;

      const loadedImgs = await Promise.all(
        showcaseProducts.slice(0, 4).map((p) => loadCorsSafeCanvasImage(p.image))
      );

      showcaseProducts.slice(0, 4).forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cx = pad + col * (cellW + gap);
        const cy = bodyTop + pad + row * (cellH + gap);

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(cx, cy, cellW, cellH, 18);
        ctx.fill();
        ctx.strokeStyle = '#0F2942';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Top Promo Tag inside card
        ctx.fillStyle = '#B81D24';
        ctx.beginPath();
        ctx.roundRect(cx + 14, cy + 14, cellW - 28, 42, 8);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 19px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        const shortPromo = (item.promoBadge || item.series)
          .toUpperCase()
          .slice(0, 28);
        ctx.fillText(shortPromo, cx + cellW / 2, cy + 41);
        ctx.textAlign = 'left';

        // Product Image
        const imgBoxY = cy + 64;
        const imgBoxH = cellH - (aspect === 'story' ? 215 : 150);
        const img = loadedImgs[idx];
        if (img) {
          const iW = img.naturalWidth || img.width || 1;
          const iH = img.naturalHeight || img.height || 1;
          const sc = Math.min((cellW - 40) / iW, (imgBoxH - 16) / iH);
          const dW = iW * sc;
          const dH = iH * sc;
          ctx.drawImage(
            img,
            cx + (cellW - dW) / 2,
            imgBoxY + (imgBoxH - dH) / 2,
            dW,
            dH
          );
        }

        // Bottom Name & Price inside cell
        const infoY = cy + cellH - (aspect === 'story' ? 132 : 84);
        ctx.fillStyle = '#141413';
        ctx.font =
          aspect === 'story'
            ? '800 24px "Plus Jakarta Sans", sans-serif'
            : '800 18px "Plus Jakarta Sans", sans-serif';
        const cleanTitle = item.name
          .replace(/^AMERICAN TOURISTER\s+/i, '')
          .slice(0, 24);
        ctx.fillText(cleanTitle, cx + 18, infoY);

        ctx.fillStyle = '#B81D24';
        ctx.font =
          aspect === 'story'
            ? '900 40px "JetBrains Mono", monospace'
            : '900 26px "JetBrains Mono", monospace';
        ctx.fillText(
          formatRs(item.priceRs),
          cx + 18,
          infoY + (aspect === 'story' ? 50 : 32)
        );

        if (item.regularPriceRs && item.regularPriceRs > item.priceRs) {
          ctx.fillStyle = '#65645E';
          ctx.font =
            aspect === 'story'
              ? '700 21px "JetBrains Mono", monospace'
              : '700 15px "JetBrains Mono", monospace';
          ctx.fillText(
            `Was ${formatRs(item.regularPriceRs)}`,
            cx + 18,
            infoY + (aspect === 'story' ? 80 : 52)
          );
        }
      });
    } else if (templateMode === 'series-lineup') {
      // Complete Series Lineup Status Card
      const rows = seriesLineup.rows.slice(0, 4);
      const pad = 32;
      const gap = 18;
      const rowH = (bodyHeight - pad * 2 - gap * (rows.length - 1)) / rows.length;

      const rowImgs = await Promise.all(
        rows.map((r) =>
          loadCorsSafeCanvasImage(r.image, seriesLineup.fallbackImage)
        )
      );

      rows.forEach((r, idx) => {
        const ry = bodyTop + pad + idx * (rowH + gap);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(pad, ry, width - pad * 2, rowH, 16);
        ctx.fill();
        ctx.strokeStyle = '#0F2942';
        ctx.lineWidth = 3;
        ctx.stroke();

        const img = rowImgs[idx];
        const imgBoxW = aspect === 'story' ? 220 : 140;
        if (img) {
          const iW = img.naturalWidth || img.width || 1;
          const iH = img.naturalHeight || img.height || 1;
          const sc = Math.min((imgBoxW - 24) / iW, (rowH - 24) / iH);
          const dW = iW * sc;
          const dH = iH * sc;
          ctx.drawImage(
            img,
            pad + (imgBoxW - dW) / 2,
            ry + (rowH - dH) / 2,
            dW,
            dH
          );
        }

        const textX = pad + imgBoxW + 16;
        ctx.fillStyle = '#0F2942';
        ctx.font =
          aspect === 'story'
            ? '900 34px "Plus Jakarta Sans", sans-serif'
            : '900 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(
          r.sizeLabel.toUpperCase(),
          textX,
          ry + (aspect === 'story' ? 68 : 40)
        );

        ctx.fillStyle = '#65645E';
        ctx.font =
          aspect === 'story'
            ? '700 24px "JetBrains Mono", monospace'
            : '700 16px "JetBrains Mono", monospace';
        ctx.fillText(
          `${r.dimensionsCm} · ${r.volumeLitres} · ${r.weightKg}`,
          textX,
          ry + (aspect === 'story' ? 116 : 68)
        );

        if (r.subPriceBadge && aspect === 'story') {
          ctx.fillStyle = '#B81D24';
          ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(r.subPriceBadge.toUpperCase(), textX, ry + 162);
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = '#B81D24';
        ctx.font =
          aspect === 'story'
            ? '900 46px "JetBrains Mono", monospace'
            : '900 28px "JetBrains Mono", monospace';
        ctx.fillText(
          formatRs(r.priceRs),
          width - pad - 24,
          ry + (aspect === 'story' ? 92 : 55)
        );
        if (r.regularPriceRs && r.regularPriceRs > r.priceRs) {
          ctx.fillStyle = '#65645E';
          ctx.font =
            aspect === 'story'
              ? '700 24px "JetBrains Mono", monospace'
              : '700 16px "JetBrains Mono", monospace';
          ctx.fillText(
            `Was ${formatRs(r.regularPriceRs)}`,
            width - pad - 24,
            ry + (aspect === 'story' ? 136 : 82)
          );
        }
        ctx.textAlign = 'left';
      });
    } else {
      // Single Product Spotlight
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, bodyTop, width, bodyHeight);

      const img = await loadCorsSafeCanvasImage(previewImg);
      if (img) {
        const pad = 48;
        const maxW = width - pad * 2;
        const maxH = bodyHeight - (aspect === 'story' ? 240 : 140);
        const imgW = img.naturalWidth || img.width || 1;
        const imgH = img.naturalHeight || img.height || 1;
        const scale = Math.min(maxW / imgW, maxH / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const drawX = (width - drawW) / 2;
        const drawY = bodyTop + 24 + (maxH - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      }

      // Product Name & Price Banner at bottom of white area
      const prodStripY = bodyTop + bodyHeight - (aspect === 'story' ? 190 : 120);
      ctx.fillStyle = '#FFFDF7';
      ctx.fillRect(36, prodStripY, width - 72, aspect === 'story' ? 170 : 108);
      ctx.strokeStyle = '#0F2942';
      ctx.lineWidth = 3;
      ctx.strokeRect(36, prodStripY, width - 72, aspect === 'story' ? 170 : 108);

      ctx.fillStyle = '#141413';
      ctx.font =
        aspect === 'story'
          ? '800 34px "Plus Jakarta Sans", sans-serif'
          : '800 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        cardHeadline.slice(0, 34),
        60,
        prodStripY + (aspect === 'story' ? 62 : 42)
      );

      ctx.fillStyle = '#B81D24';
      ctx.font =
        aspect === 'story'
          ? '900 54px "JetBrains Mono", monospace'
          : '900 36px "JetBrains Mono", monospace';
      ctx.fillText(
        cardPrice,
        60,
        prodStripY + (aspect === 'story' ? 134 : 88)
      );

      if (cardOldPrice) {
        const pw = ctx.measureText(cardPrice).width;
        ctx.fillStyle = '#65645E';
        ctx.font =
          aspect === 'story'
            ? '700 30px "JetBrains Mono", monospace'
            : '700 22px "JetBrains Mono", monospace';
        ctx.fillText(
          `Was ${cardOldPrice}`,
          60 + pw + 24,
          prodStripY + (aspect === 'story' ? 130 : 86)
        );
      }
    }

    // 4. Bottom Dark Luxury Panel with Embedded CTA + QR Code + WhatsApp + Policies
    const panelTop = height - footerH;
    ctx.fillStyle = '#141413';
    ctx.fillRect(0, panelTop, width, footerH);

    const qrImg = await loadQrCanvasImage(shareUrl);
    const qrSize = aspect === 'story' ? 180 : 130;
    const qrX = width - 48 - qrSize;
    const qrY = panelTop + 28;

    if (qrImg) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(qrX, qrY, qrSize, qrSize, 12);
      ctx.fill();
      ctx.drawImage(qrImg, qrX + 8, qrY + 8, qrSize - 16, qrSize - 16);
    }

    const leftAvailW = qrImg ? width - qrSize - 116 : width - 96;

    // Embedded Call-To-Action Button
    const btnX = 48;
    const btnY = panelTop + 28;
    const btnH = aspect === 'story' ? 88 : 66;
    ctx.fillStyle = '#1B5E3A';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, leftAvailW, btnH, 14);
    ctx.fill();
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font =
      aspect === 'story'
        ? '800 28px "Plus Jakarta Sans", sans-serif'
        : '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${ctaLabel}  →`,
      btnX + leftAvailW / 2,
      btnY + (aspect === 'story' ? 54 : 41)
    );
    ctx.textAlign = 'left';

    // Policy & Contact lines
    ctx.fillStyle = '#FFD166';
    ctx.font =
      aspect === 'story'
        ? '800 23px "Plus Jakarta Sans", sans-serif'
        : '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'CONFIRM AVAILABILITY BEFORE PAYMENT · DELIVERY UP TO 10 DAYS',
      48,
      btnY + btnH + (aspect === 'story' ? 48 : 34)
    );

    ctx.fillStyle = '#FFFFFF';
    ctx.font =
      aspect === 'story'
        ? '700 24px "JetBrains Mono", monospace'
        : '700 18px "JetBrains Mono", monospace';
    ctx.fillText(
      'WhatsApp: +230 5979 7960 · Shop: abdesai.mu',
      48,
      btnY + btnH + (aspect === 'story' ? 90 : 64)
    );

    if (aspect === 'story') {
      ctx.fillStyle = '#A09F99';
      ctx.font = '700 21px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'SHOWROOMS: PORT-LOUIS · TRIBECA · TRIANON · BAGATELLE · CASCAVELLE · ROSE-BELLE',
        width / 2,
        height - 38
      );
      ctx.textAlign = 'left';
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  };

  const getDownloadFilename = () => {
    if (templateMode === 'store-showcase') {
      return `abdesai-whatsapp-status-shop-showcase-${aspect}.png`;
    }
    if (templateMode === 'series-lineup') {
      return `abdesai-whatsapp-status-${selectedSeries.toLowerCase()}-${aspect}.png`;
    }
    return `${activeProduct.slug}-whatsapp-status-${aspect}.png`;
  };

  const handleDownloadCardImage = async () => {
    setIsGeneratingImg(true);
    try {
      const blob = await generateCardBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getDownloadFilename();
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
        const file = new File([blob], getDownloadFilename(), {
          type: 'image/png',
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'A.B. Desai Mauritius — American Tourister Shop',
            text: whatsappStatusCaption,
          });
          return;
        }
        await navigator.share({
          title: 'A.B. Desai Mauritius — American Tourister Shop',
          text: whatsappStatusCaption,
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

  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(
    whatsappStatusCaption
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

      <div className="bg-[#F9F9F8] border border-black/10 rounded-xl max-w-5xl w-full overflow-hidden shadow-xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#1B5E3A] text-white rounded-md">
                <Smartphone className="w-3 h-3" />
                <span>9:16 WHATSAPP STATUS READY</span>
              </span>
              <h2
                id="social-share-title"
                className="text-xl font-semibold text-[#141413]"
              >
                WhatsApp Status & Store Poster Studio
              </h2>
            </div>
            <p className="text-xs text-[#65645E] mt-0.5">
              Post the entire shop, a complete series price card, or a single promo directly to your WhatsApp Status, Instagram Story, or Facebook
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

        {/* Top Mode Tabs: Full Shop Showcase vs Complete Series vs Single Item */}
        <div className="px-6 py-3 bg-[#EFECE6] border-b border-black/8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTemplateMode('store-showcase')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                templateMode === 'store-showcase'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'bg-white text-[#141413] hover:bg-white/80'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>1. Full Shop Showcase (4 Top Deals)</span>
            </button>
            <button
              type="button"
              onClick={() => setTemplateMode('series-lineup')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                templateMode === 'series-lineup'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'bg-white text-[#141413] hover:bg-white/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Complete Series Lineup Status</span>
            </button>
            <button
              type="button"
              onClick={() => setTemplateMode('single-product')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                templateMode === 'single-product'
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'bg-white text-[#141413] hover:bg-white/80'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>3. Single Product / Promo Card</span>
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-black/10">
            <button
              type="button"
              onClick={() => setAspect('story')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                aspect === 'story'
                  ? 'bg-[#1B5E3A] text-white'
                  : 'text-[#65645E] hover:text-[#141413]'
              }`}
            >
              9:16 WhatsApp Status
            </button>
            <button
              type="button"
              onClick={() => setAspect('square')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                aspect === 'square'
                  ? 'bg-[#0F2942] text-white'
                  : 'text-[#65645E] hover:text-[#141413]'
              }`}
            >
              1:1 Square Post
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
          {/* Left Column: Live Visual Status Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[340px] bg-white text-[#141413] rounded-2xl overflow-hidden border-2 border-[#0F2942] flex flex-col justify-between shadow-lg">
              {/* Top Strip */}
              <div className="bg-[#0F2942] text-white px-3.5 py-2.5">
                <div className="text-[9px] font-bold text-[#FFD166] tracking-wider uppercase">
                  OFFICIAL MAURITIUS DISTRIBUTOR · A.B. DESAI
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs font-black tracking-tight">
                    AMERICAN TOURISTER
                  </span>
                  <span className="text-[11px] font-mono-tabular font-bold text-[#FFD166]">
                    abdesai.mu
                  </span>
                </div>
              </div>

              {/* Red Sub-banner */}
              <div className="bg-[#B81D24] text-white px-3 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-wide truncate">
                {templateMode === 'store-showcase'
                  ? 'OFFICIAL STORE SHOWCASE · ALL PROMOS & BUNDLES LIVE'
                  : templateMode === 'series-lineup'
                  ? `${selectedSeries.toUpperCase()} COLLECTION · ALL SIZES & PRICES`
                  : cardPromo}
              </div>

              {/* Dynamic Middle Content */}
              {templateMode === 'store-showcase' && (
                <div className="p-2.5 bg-[#F9F9F8] grid grid-cols-2 gap-2">
                  {showcaseProducts.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg border border-[#0F2942]/30 p-2 flex flex-col justify-between"
                    >
                      <span className="bg-[#B81D24] text-white text-[9px] font-bold px-1.5 py-0.5 rounded text-center truncate">
                        {item.promoBadge || item.series}
                      </span>
                      <div className="h-20 flex items-center justify-center my-1">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          series={item.series}
                          title={item.name}
                          eager
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[#141413] truncate">
                          {item.name.replace(/^AMERICAN TOURISTER\s+/i, '')}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono-tabular text-xs font-black text-[#B81D24]">
                            {formatRs(item.priceRs)}
                          </span>
                          {item.regularPriceRs &&
                            item.regularPriceRs > item.priceRs && (
                              <span className="font-mono-tabular text-[9px] text-[#65645E] line-through">
                                {formatRs(item.regularPriceRs)}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {templateMode === 'series-lineup' && (
                <div className="p-2.5 bg-[#F9F9F8] space-y-1.5">
                  {seriesLineup.rows.slice(0, 4).map((r) => (
                    <div
                      key={r.sizeClass}
                      className="bg-white rounded-lg border border-[#0F2942]/30 px-2.5 py-1.5 flex items-center justify-between gap-2"
                    >
                      <div className="w-10 h-11 shrink-0 flex items-center justify-center">
                        <ProductImage
                          src={r.image || seriesLineup.fallbackImage}
                          alt={`${selectedSeries} ${r.sizeLabel}`}
                          series={selectedSeries}
                          title={r.sizeLabel}
                          eager
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-black text-[#0F2942] uppercase truncate">
                          {r.sizeLabel}
                        </div>
                        <div className="text-[9px] font-mono-tabular text-[#65645E] truncate">
                          {r.dimensionsCm} · {r.volumeLitres}
                        </div>
                        {r.subPriceBadge && (
                          <div className="text-[9px] font-bold text-[#B81D24] truncate">
                            {r.subPriceBadge}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono-tabular text-xs font-black text-[#B81D24]">
                          {formatRs(r.priceRs)}
                        </div>
                        {r.regularPriceRs && r.regularPriceRs > r.priceRs && (
                          <div className="font-mono-tabular text-[9px] text-[#65645E] line-through">
                            Was {formatRs(r.regularPriceRs)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {templateMode === 'single-product' && (
                <div className="bg-white p-3 flex flex-col items-center">
                  <div className="h-44 w-full flex items-center justify-center">
                    <ProductImage
                      src={previewImg}
                      alt={cardHeadline}
                      series={activeProduct.series}
                      title={cardHeadline}
                      eager
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="w-full mt-2 p-2.5 rounded-lg bg-[#FFFDF7] border border-[#0F2942]">
                    <div className="text-xs font-bold text-[#141413] truncate">
                      {cardHeadline}
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-mono-tabular text-lg font-black text-[#B81D24]">
                        {cardPrice}
                      </span>
                      {cardOldPrice && (
                        <span className="font-mono-tabular text-xs text-[#65645E] line-through">
                          Was {cardOldPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Dark Panel */}
              <div className="p-3 bg-[#141413] text-white space-y-2">
                <div className="w-full py-2 px-3 rounded-lg bg-[#1B5E3A] border border-[#FFD166] text-white text-[11px] font-bold flex items-center justify-center gap-1.5">
                  <span>{ctaLabel}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#FFD166]" />
                </div>
                <div className="text-[9px] font-bold text-[#FFD166] text-center uppercase">
                  Confirm Availability Before Payment · Delivery Up to 10 Days
                </div>
                <div className="text-[10px] font-mono-tabular text-center text-white/90">
                  WhatsApp: +230 5979 7960 · abdesai.mu
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Controls + Step-by-Step WhatsApp Status Guide */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            {/* How to Post the Shop on WhatsApp Status Box */}
            <div className="p-4 rounded-xl bg-[#EBF5EE] border border-[#1B5E3A]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1B5E3A]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  How to Put Your Shop on WhatsApp Status (2 Ways):
                </span>
              </div>
              <ol className="text-xs text-[#141413] space-y-1.5 list-decimal list-inside">
                <li>
                  <strong>Photo Status + Caption:</strong> Click{' '}
                  <strong>Download 9:16 Status Poster</strong> (or{' '}
                  <strong>Share Status Poster + Caption</strong> on phone), open
                  WhatsApp → <strong>Updates (Status)</strong> → select the
                  poster image and paste the <strong>Status Caption</strong>{' '}
                  below so customers see your prices & link!
                </li>
                <li>
                  <strong>Clickable Link Status:</strong> Click{' '}
                  <strong>Copy Shop Link</strong> below, open WhatsApp Status →
                  tap the <strong>Text (Pencil) icon</strong> → paste the link.
                  WhatsApp automatically generates a clickable shop preview card!
                </li>
              </ol>
            </div>

            <div className="space-y-3.5">
              {/* Dynamic Selector based on mode */}
              {templateMode === 'series-lineup' && (
                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Choose Series to Feature on WhatsApp Status
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_DISPLAY_SERIES_ORDER.map((sName) => (
                      <button
                        key={sName}
                        type="button"
                        onClick={() => setSelectedSeries(sName)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          selectedSeries === sName
                            ? 'bg-[#0F2942] text-white border-[#0F2942]'
                            : 'bg-white text-[#141413] border-black/15 hover:bg-[#EFECE6]'
                        }`}
                      >
                        {sName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {templateMode === 'single-product' && (
                <div>
                  <label
                    htmlFor="share-product-select"
                    className="block text-xs font-semibold text-[#141413] mb-1.5"
                  >
                    Select Product or Promo to Feature ({allProducts.length}{' '}
                    Verified Items)
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
                        {p.regularPriceRs
                          ? ` (Was ${formatRs(p.regularPriceRs)})`
                          : ''}{' '}
                        — {p.name.replace(/^AMERICAN TOURISTER\s+/i, '')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* CTA Button Text Selector */}
              <div>
                <span className="block text-xs font-semibold text-[#141413] mb-1.5">
                  Choose Embedded Banner Call-to-Action
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'WHATSAPP +230 5979 7960 TO ORDER',
                    'SHOP ONLINE AT ABDESAI.MU',
                    'VISIT OUR 6 ISLAND SHOWROOMS',
                    'CLAIM PROMO OFFER TODAY',
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

              {/* Ready-to-Paste WhatsApp Status Caption + Shop Link */}
              <div className="p-3.5 rounded-xl bg-white border border-black/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#141413]">
                    Ready-to-Paste WhatsApp Status Caption & Link
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#EFECE6] text-[#141413] rounded-md hover:bg-[#E2DDD3] transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Shop Link Only</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCaption}
                      className="px-3 py-1 text-[11px] font-semibold bg-[#1B5E3A] text-white rounded-md hover:bg-[#14492D] transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      {copiedCaption ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Caption Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Status Caption + Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={whatsappStatusCaption}
                  className="w-full p-2.5 text-[11px] font-mono-tabular bg-[#F9F9F8] border border-black/12 rounded-lg text-[#141413] resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-black/8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isGeneratingImg}
                  onClick={handleDownloadCardImage}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold bg-[#1B5E3A] text-white rounded-lg hover:bg-[#14492D] transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isGeneratingImg
                      ? 'Generating HD Poster...'
                      : `Download ${aspect === 'story' ? '9:16 Status Poster' : '1:1 Square Poster'}`}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingImg}
                  onClick={handleShareImageWithLink}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold bg-[#0F2942] text-white rounded-lg hover:bg-[#091A2B] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Share2 className="w-4 h-4" />
                  <span>
                    {isGeneratingImg
                      ? 'Preparing Share...'
                      : 'Share Status Poster + Caption (Mobile)'}
                  </span>
                </button>

                <a
                  href={whatsappShareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white border border-[#1B5E3A] text-[#1B5E3A] rounded-lg hover:bg-[#EBF5EE] transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Shop Link / Status Text on WhatsApp</span>
                </a>

                <a
                  href={facebookShareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#1877F2] text-white rounded-lg hover:bg-[#1464CC] transition-colors whitespace-nowrap"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Share Shop on Facebook</span>
                </a>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-[#65645E]">
                <span>
                  Includes Scannable Shop QR Code · +230 5979 7960 · 6 Showrooms
                </span>
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

