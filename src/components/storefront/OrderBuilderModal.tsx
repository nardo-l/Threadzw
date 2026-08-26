import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Minus, MessageCircle, Plus, Ruler, X } from 'lucide-react';
import { ProductImage } from '../ui/ShopImage';
import { toast } from 'sonner';

export interface OrderSelection {
  color: string;
  size: string;
  quantity: number;
}

interface OrderBuilderModalProps {
  isOpen: boolean;
  product: any;
  shop: any;
  coloursList: string[];
  sizesList: string[];
  initialColor: string;
  initialSize: string;
  isSizeOutOfStock: (size: string) => boolean;
  onClose: () => void;
  onConfirm: (selection: OrderSelection) => void;
}

const formatPrice = (value: number) => {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue) ? `${numericValue}` : numericValue.toFixed(2);
};

const colourSwatches: Record<string, string> = {
  black: '#09090b',
  white: '#ffffff',
  cream: '#f1ead7',
  beige: '#d8c4a8',
  brown: '#7c4a2d',
  tan: '#c19a6b',
  red: '#dc2626',
  burgundy: '#7f1d1d',
  orange: '#ea580c',
  yellow: '#eab308',
  green: '#166534',
  'forest green': '#163b2a',
  blue: '#2563eb',
  'royal blue': '#1d4ed8',
  navy: '#172554',
  purple: '#7e22ce',
  pink: '#ec4899',
  grey: '#71717a',
  gray: '#71717a'
};

const getColourSwatch = (colour: string) => {
  const normalized = colour.trim().toLowerCase();
  return colourSwatches[normalized] || 'var(--store-accent-strong)';
};

export const OrderBuilderModal: React.FC<OrderBuilderModalProps> = ({
  isOpen,
  product,
  shop,
  coloursList,
  sizesList,
  initialColor,
  initialSize,
  isSizeOutOfStock,
  onClose,
  onConfirm
}) => {
  const [step, setStep] = useState(1);
  const [selectedColor, setSelectedColor] = useState(initialColor || coloursList[0] || 'Not specified');
  const [selectedSize, setSelectedSize] = useState(initialSize || sizesList[0] || 'Not specified');
  const [quantity, setQuantity] = useState(1);

  const productPrice = Number(product?.price || 0);
  const hasColours = coloursList.length > 0;
  const maxQuantity = useMemo(() => {
    const sizeRows = Array.isArray(product?.sizes) ? product.sizes : [];
    const selectedSizeRow = sizeRows.find((row: any) => {
      const label = typeof row === 'string' ? row : row?.size || row?.size_label;
      return label === selectedSize;
    });
    const sizeQuantity = selectedSizeRow && typeof selectedSizeRow === 'object'
      ? Number(selectedSizeRow.quantity)
      : null;
    const totalStock = Number(product?.total_stock);
    const stock = sizeQuantity && sizeQuantity > 0
      ? sizeQuantity
      : totalStock > 0
        ? totalStock
        : 99;
    return Math.max(1, Math.min(99, stock));
  }, [product?.sizes, product?.total_stock, selectedSize]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelectedColor(initialColor || coloursList[0] || 'Not specified');
    const firstAvailableSize = sizesList.find(size => !isSizeOutOfStock(size));
    const preferredSize = initialSize && !isSizeOutOfStock(initialSize) ? initialSize : firstAvailableSize;
    setSelectedSize(preferredSize || sizesList[0] || 'Not specified');
    setQuantity(1);
  }, [isOpen, initialColor, initialSize, coloursList, sizesList]);

  useEffect(() => {
    setQuantity(current => Math.min(current, maxQuantity));
  }, [maxQuantity]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const subtotal = productPrice * quantity;
  const isCurrentSizeUnavailable = selectedSize !== 'Not specified' && isSizeOutOfStock(selectedSize);
  const canContinue = step !== 2 || !isCurrentSizeUnavailable;

  const handleNext = () => {
    if (step < 3) {
      setStep(current => current + 1);
      return;
    }
    onConfirm({
      color: selectedColor || 'Not specified',
      size: selectedSize || 'Not specified',
      quantity
    });
  };

  const handleBack = () => {
    if (step === 1) onClose();
    else setStep(current => current - 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="order-builder-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Build your order"
        onMouseDown={event => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ y: 36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 36, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          className="w-full max-w-[480px] h-[min(94dvh,780px)] sm:h-[min(90dvh,780px)] bg-white rounded-t-[28px] sm:rounded-[28px] overflow-hidden flex flex-col shadow-2xl"
        >
          <div className="shrink-0 bg-white border-b border-zinc-100 px-5 pt-4 pb-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="w-9 h-9 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-colors"
                aria-label={step === 1 ? 'Close order builder' : 'Go back'}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-black tracking-tight text-zinc-950">Build your order</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-colors"
                aria-label="Close order builder"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-4" aria-label={`Step ${step} of 3`}>
              {[1, 2, 3].map(item => (
                <div
                  key={item}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${item <= step ? 'store-accent-bg' : 'bg-zinc-200'}`}
                />
              ))}
            </div>
            <p className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 mt-2">
              Step {step} of 3
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
              <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-zinc-50 shrink-0">
                <ProductImage product={product} shop={shop} index={0} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm text-zinc-950 truncate">{product?.name}</h3>
                <p className="text-base font-black text-zinc-950 mt-1">${formatPrice(productPrice)} USD</p>
                <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full store-accent-bg" />
                  In stock
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {step === 1 && (
                <motion.section
                  key="colour-step"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-[29px] leading-tight font-black tracking-tight text-zinc-950">Choose a colour</h3>
                    <p className="text-sm text-zinc-500 mt-2">Pick the colour you want before we continue.</p>
                  </div>
                  {hasColours ? (
                    <div className="grid grid-cols-2 gap-3">
                      {coloursList.map(colour => {
                        const isSelected = selectedColor === colour;
                        return (
                          <button
                            type="button"
                            key={colour}
                            onClick={() => setSelectedColor(colour)}
                            className={`min-h-[82px] rounded-2xl border p-3 flex items-center gap-3 text-left transition-all ${
                              isSelected
                                ? 'store-accent-border store-accent-soft-bg shadow-sm'
                                : 'border-zinc-200 bg-white hover:border-zinc-300'
                            }`}
                          >
                            <span
                              className="w-11 h-11 rounded-xl border border-black/10 shrink-0 shadow-inner"
                              style={{ backgroundColor: getColourSwatch(colour) }}
                            />
                            <span className="min-w-0 flex-1 text-sm font-black text-zinc-900 truncate">{colour}</span>
                            {isSelected && <Check className="w-4 h-4 store-accent-text shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border store-accent-soft-border store-accent-soft-bg p-4 text-sm text-zinc-700">
                      This item has no colour options. We’ll send the order without a colour preference.
                    </div>
                  )}
                </motion.section>
              )}

              {step === 2 && (
                <motion.section
                  key="size-step"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-[29px] leading-tight font-black tracking-tight text-zinc-950">Choose a size</h3>
                    <p className="text-sm text-zinc-500 mt-2">Select the fit that works for you.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {sizesList.map(size => {
                      const isUnavailable = isSizeOutOfStock(size);
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          type="button"
                          key={size}
                          disabled={isUnavailable}
                          onClick={() => setSelectedSize(size)}
                          className={`min-h-[66px] rounded-2xl border text-base font-black transition-all ${
                            isSelected
                              ? 'store-accent-bg store-accent-border'
                              : isUnavailable
                                ? 'bg-zinc-100 border-zinc-100 text-zinc-400 line-through cursor-not-allowed'
                                : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.info('Check the product description or ask the shop for sizing help.')}
                    className="inline-flex items-center gap-2 text-sm text-zinc-600 underline underline-offset-4 hover:text-zinc-950"
                  >
                    <Ruler className="w-4 h-4" />
                    Size guide
                  </button>
                </motion.section>
              )}

              {step === 3 && (
                <motion.section
                  key="quantity-step"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-[29px] leading-tight font-black tracking-tight text-zinc-950">How many do you want?</h3>
                    <p className="text-sm text-zinc-500 mt-2">Confirm your quantity and send the order to WhatsApp.</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 p-3 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity(current => Math.max(1, current - 1))}
                      className="w-14 h-14 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-900 disabled:text-zinc-300 disabled:bg-zinc-50 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-4xl font-black text-zinc-950 tabular-nums">{quantity}</span>
                    <button
                      type="button"
                      disabled={quantity >= maxQuantity}
                      onClick={() => setQuantity(current => Math.min(maxQuantity, current + 1))}
                      className="w-14 h-14 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-900 disabled:text-zinc-300 disabled:bg-zinc-50 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 divide-y divide-zinc-100 px-4">
                    <div className="flex items-center justify-between py-3 text-sm"><span className="text-zinc-500">Colour</span><strong className="text-zinc-950">{selectedColor}</strong></div>
                    <div className="flex items-center justify-between py-3 text-sm"><span className="text-zinc-500">Size</span><strong className="text-zinc-950">{selectedSize}</strong></div>
                    <div className="flex items-center justify-between py-3 text-sm"><span className="text-zinc-500">Quantity</span><strong className="text-zinc-950">{quantity}</strong></div>
                    <div className="flex items-center justify-between py-3 text-sm"><span className="text-zinc-500">Subtotal</span><strong className="text-zinc-950">${formatPrice(subtotal)} USD</strong></div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          <div className="shrink-0 border-t border-zinc-100 bg-white px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {step < 3 ? (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{step === 1 ? 'Your choice' : 'Colour'}</p>
                  <p className="text-sm font-black text-zinc-950 truncate">{step === 1 ? selectedColor : selectedColor}</p>
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canContinue}
                  className="flex-[1.65] rounded-2xl store-accent-bg py-3.5 text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full rounded-2xl bg-zinc-950 hover:bg-black text-white py-4 text-sm font-black flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Order on WhatsApp
                </button>
                <p className="text-center text-[11px] text-zinc-500 mt-2">We will open WhatsApp with your order ready to send.</p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
