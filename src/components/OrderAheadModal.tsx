// ============================================================
// OrderAheadModal.tsx
// Full-screen bottom-sheet order modal. Features:
// · inputMode="email" / "tel" for perfect mobile keyboards
// · Idempotent double-submit guard (disabled + spinner after tap)
// · Cart quantity stepper with haptic-style press animation
// · Satisfying checkmark success screen with confetti burst
// · Deposit info, error states, special requests
// ============================================================

import {
  useState, useCallback, useEffect, useRef, useLayoutEffect,
} from 'react';
import { MENU_BY_CURRENCY } from '../hooks/useMatchdayEngine';
import type { Pub, Match, Lead, MenuItem, CartItem } from '../types';

// ─── Helpers ─────────────────────────────────────────────────

function fmtCurrency(amount: number, currency: 'USD' | 'MXN' | 'CAD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Confetti burst (pure CSS, no deps) ──────────────────────

const CONFETTI_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#f43f5e', '#a855f7', '#22d3ee'];

function ConfettiBurst() {
  const pieces = Array.from({ length: 20 }).map((_, i) => ({
    i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: (Math.random() - 0.5) * 260,
    y: -(Math.random() * 200 + 80),
    rot: Math.random() * 720 - 360,
    size: Math.random() * 6 + 5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {pieces.map((p) => (
        <div
          key={p.i}
          className="absolute rounded-sm"
          style={{
            width: p.size, height: p.size,
            backgroundColor: p.color,
            animation: `confettiFly 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
            animationDelay: `${p.i * 25}ms`,
            '--tx': `${p.x}px`,
            '--ty': `${p.y}px`,
            '--rot': `${p.rot}deg`,
          } as React.CSSProperties}
        />
      ))}
      <style>{`
        @keyframes confettiFly {
          from { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          to   { opacity: 0; transform: translate(var(--tx), var(--ty)) rotate(var(--rot)); }
        }
      `}</style>
    </div>
  );
}

// ─── Animated checkmark SVG ──────────────────────────────────

function AnimatedCheck() {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <ConfettiBurst />
      <div
        className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center"
        style={{ animation: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      >
        <svg
          width="36" height="28" viewBox="0 0 36 28" fill="none"
          style={{ animation: 'drawCheck 0.4s ease-out 0.2s both' }}
        >
          <path
            d="M2 14L12 24L34 2"
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="50"
            strokeDashoffset="0"
          />
        </svg>
      </div>
      <style>{`
        @keyframes popIn {
          from { transform: scale(0.4); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 50; }
          to   { stroke-dashoffset: 0;  }
        }
      `}</style>
    </div>
  );
}

// ─── Success screen ──────────────────────────────────────────

function SuccessScreen({
  pub, match, email, partySize, cartTotal, cartCount, currency, onClose,
}: {
  pub: Pub; match: Match | null; email: string; partySize: number;
  cartTotal: number; cartCount: number; currency: 'USD' | 'MXN' | 'CAD';
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-10 px-6 text-center relative overflow-hidden">
      <AnimatedCheck />

      <h2
        className="text-2xl font-black text-zinc-100 mt-5 mb-1"
        style={{ animation: 'fadeUp 0.4s ease 0.3s both' }}
      >
        You're locked in! ⚽
      </h2>
      <p
        className="text-zinc-400 text-sm mb-1"
        style={{ animation: 'fadeUp 0.4s ease 0.4s both' }}
      >
        Reservation at <span className="text-zinc-200 font-semibold">{pub.name}</span>
      </p>
      {match && (
        <p
          className="text-zinc-500 text-xs mb-6"
          style={{ animation: 'fadeUp 0.4s ease 0.45s both' }}
        >
          {match.homeTeam.flag} {match.homeTeam.code} vs {match.awayTeam.flag} {match.awayTeam.code}
          {' · '}{match.phaseLabel}
        </p>
      )}

      {/* Confirmation card */}
      <div
        className="bg-emerald-500/8 border border-emerald-500/25 rounded-2xl px-6 py-5 w-full mb-6 text-left"
        style={{ animation: 'fadeUp 0.4s ease 0.5s both' }}
      >
        <p className="text-emerald-400 text-[10px] font-black tracking-widest uppercase mb-2">
          Confirmation sent to
        </p>
        <p className="text-zinc-200 font-bold text-base mb-3">{email}</p>
        <div className="flex gap-4 text-xs text-zinc-400 border-t border-zinc-800 pt-3">
          <span>🧑‍🤝‍🧑 Party of {partySize}</span>
          {cartCount > 0 && (
            <span>🍺 {cartCount} item{cartCount !== 1 ? 's' : ''} pre-ordered</span>
          )}
          {cartTotal > 0 && (
            <span className="font-semibold text-zinc-300 ml-auto">
              {fmtCurrency(cartTotal, currency)}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-zinc-800 text-zinc-300 font-bold py-4 rounded-2xl active:scale-[0.97] transition-transform touch-manipulation text-base border border-zinc-700"
        style={{
          WebkitTapHighlightColor: 'transparent',
          animation: 'fadeUp 0.4s ease 0.6s both',
        }}
      >
        Done — See you there! 👋
      </button>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Cart stepper ─────────────────────────────────────────────

function CartStepper({
  item, quantity, onAdd, onRemove,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const [addPressed, setAddPressed] = useState(false);
  const [removePressed, setRemovePressed] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-zinc-700/60 bg-zinc-800/40 transition-all duration-150"
      style={{ borderColor: quantity > 0 ? 'rgba(16,185,129,0.25)' : undefined }}
    >
      <span className="text-xl flex-shrink-0">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-zinc-200 truncate">{item.name}</span>
          {item.popular && (
            <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
              HOT
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 truncate">{item.description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-bold text-zinc-400">
          {fmtCurrency(item.price, item.currency)}
        </span>
        {quantity === 0 ? (
          <button
            onPointerDown={() => setAddPressed(true)}
            onPointerUp={() => setAddPressed(false)}
            onPointerLeave={() => setAddPressed(false)}
            onClick={onAdd}
            className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-lg font-bold flex items-center justify-center touch-manipulation"
            style={{
              WebkitTapHighlightColor: 'transparent',
              transform: addPressed ? 'scale(0.85)' : 'scale(1)',
              transition: 'transform 0.1s ease',
            }}
          >
            +
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onPointerDown={() => setRemovePressed(true)}
              onPointerUp={() => setRemovePressed(false)}
              onPointerLeave={() => setRemovePressed(false)}
              onClick={onRemove}
              className="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-300 flex items-center justify-center font-bold touch-manipulation"
              style={{
                WebkitTapHighlightColor: 'transparent',
                transform: removePressed ? 'scale(0.85)' : 'scale(1)',
                transition: 'transform 0.1s ease',
              }}
            >
              −
            </button>
            <span className="text-sm font-black text-zinc-100 w-5 text-center tabular-nums">
              {quantity}
            </span>
            <button
              onPointerDown={() => setAddPressed(true)}
              onPointerUp={() => setAddPressed(false)}
              onPointerLeave={() => setAddPressed(false)}
              onClick={onAdd}
              className="w-7 h-7 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold touch-manipulation"
              style={{
                WebkitTapHighlightColor: 'transparent',
                transform: addPressed ? 'scale(0.85)' : 'scale(1)',
                transition: 'transform 0.1s ease',
              }}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────

function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-zinc-500 tracking-widest uppercase mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p
          className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1"
          style={{ animation: 'shakeIn 0.25s ease' }}
        >
          ⚠ {error}
        </p>
      )}
      <style>{`@keyframes shakeIn { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }`}</style>
    </div>
  );
}

// ─── Input classnames ─────────────────────────────────────────

function inputCls(hasError: boolean): string {
  return [
    'w-full bg-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-xl',
    'px-4 py-3.5 text-base outline-none transition-all duration-200 border',
    hasError
      ? 'border-red-500/60 focus:border-red-400'
      : 'border-zinc-700 focus:border-emerald-500/70 focus:bg-zinc-800/80',
  ].join(' ');
}

// ─── Types ───────────────────────────────────────────────────

type FormState = {
  name: string;
  email: string;
  phone: string;
  partySize: number;
  specialRequests: string;
};
type FormErrors = Partial<Record<keyof FormState, string>>;

interface Props {
  pub: Pub;
  match: Match | null;
  onClose: () => void;
  onSubmit: (lead: Omit<Lead, 'id' | 'createdAt' | 'status'>) => void;
}

// ─── Main modal ───────────────────────────────────────────────

export function OrderAheadModal({ pub, match, onClose, onSubmit }: Props) {
  const menu = MENU_BY_CURRENCY[pub.currency];
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState<FormState>({
    name: '', email: '', phone: '', partySize: 2, specialRequests: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submitRef = useRef(false); // extra guard against double-submit

  const cartTotal = cart.reduce((s, ci) => s + ci.menuItem.price * ci.quantity, 0);
  const cartCount = cart.reduce((s, ci) => s + ci.quantity, 0);

  // Lock body scroll while modal is open
  useLayoutEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Cart helpers ─────────────────────────────────────────

  const addItem = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) return prev.map((ci) => ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((item: MenuItem) => {
    setCart((prev) =>
      prev.map((ci) => ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity - 1 } : ci)
          .filter((ci) => ci.quantity > 0)
    );
  }, []);

  function getQty(id: string): number {
    return cart.find((ci) => ci.menuItem.id === id)?.quantity ?? 0;
  }

  // ── Validation ───────────────────────────────────────────

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'Your name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = 'Enter a valid email address';
    if (form.phone && !/^[\d\s+\-().]{7,}$/.test(form.phone))
      errs.phone = 'Enter a valid phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit (idempotent) ──────────────────────────────────

  async function handleSubmit() {
    if (!validate()) return;
    if (submitRef.current || submitting) return; // double-submit guard
    submitRef.current = true;
    setSubmitting(true);

    // Simulate async (replace with real API call)
    await new Promise((r) => setTimeout(r, 700));

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      cityId: pub.city,
      pubId: pub.id,
      matchId: match?.id ?? 'no-match',
      partySize: form.partySize,
      cart,
      specialRequests: form.specialRequests.trim(),
      totalAmount: cartTotal + (pub.depositAmount ?? 0),
      currency: pub.currency,
    });

    setSubmitting(false);
    setSubmitted(true);
  }

  // ── Success state ────────────────────────────────────────

  if (submitted) {
    return (
      <ModalBackdrop onClose={onClose}>
        <SuccessScreen
          pub={pub} match={match}
          email={form.email} partySize={form.partySize}
          cartTotal={cartTotal} cartCount={cartCount}
          currency={pub.currency}
          onClose={onClose}
        />
      </ModalBackdrop>
    );
  }

  // ── Form state ───────────────────────────────────────────

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex flex-col" style={{ maxHeight: '92dvh' }}>
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-zinc-100 leading-tight">{pub.name}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{pub.neighborhood} · {pub.address.split(',').slice(-2, -1)}</p>
            {match && (
              <p className="text-xs text-zinc-600 mt-0.5">
                {match.homeTeam.flag} {match.homeTeam.code} vs {match.awayTeam.flag} {match.awayTeam.code}
                {' · '}{match.phaseLabel}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center active:scale-90 transition-transform touch-manipulation ml-3 mt-0.5"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div
          className="overflow-y-auto overscroll-contain flex-1 px-5 space-y-6 pb-4"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingTop: 20 }}
        >
          {/* Party size */}
          <div>
            <p className="text-[11px] font-black text-zinc-500 tracking-widest uppercase mb-3">
              How many in your party?
            </p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map((n) => {
                const active = form.partySize === n;
                return (
                  <button
                    key={n}
                    onClick={() => setForm((f) => ({ ...f, partySize: n }))}
                    className="w-12 h-12 rounded-xl text-sm font-bold transition-all active:scale-90 touch-manipulation"
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                      backgroundColor: active ? 'rgb(16,185,129)' : 'rgb(39,39,42)',
                      color: active ? 'rgb(9,9,11)' : 'rgb(161,161,170)',
                      boxShadow: active ? '0 4px 16px rgba(16,185,129,0.3)' : 'none',
                      transform: active ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pre-order menu */}
          <div>
            <p className="text-[11px] font-black text-zinc-500 tracking-widest uppercase mb-3">
              Pre-Order (Optional)
            </p>
            <div className="space-y-2">
              {menu.map((item) => (
                <CartStepper
                  key={item.id}
                  item={item}
                  quantity={getQty(item.id)}
                  onAdd={() => addItem(item)}
                  onRemove={() => removeItem(item)}
                />
              ))}
            </div>
          </div>

          {/* Your details */}
          <div className="space-y-3">
            <p className="text-[11px] font-black text-zinc-500 tracking-widest uppercase">Your Details</p>

            <Field label="Full Name" error={errors.name}>
              <input
                type="text"
                autoComplete="name"
                placeholder="Alex Rivera"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((x) => ({ ...x, name: undefined })); }}
                className={inputCls(!!errors.name)}
              />
            </Field>

            <Field label="Email Address" error={errors.email}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="alex@email.com"
                value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setErrors((x) => ({ ...x, email: undefined })); }}
                className={inputCls(!!errors.email)}
              />
            </Field>

            <Field label="Phone (optional)" error={errors.phone}>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); setErrors((x) => ({ ...x, phone: undefined })); }}
                className={inputCls(!!errors.phone)}
              />
            </Field>

            <Field label="Special Requests">
              <textarea
                inputMode="text"
                autoComplete="off"
                rows={2}
                placeholder="Dietary needs, seating preference, accessibility..."
                value={form.specialRequests}
                onChange={(e) => setForm((f) => ({ ...f, specialRequests: e.target.value }))}
                className={[inputCls(false), 'resize-none'].join(' ')}
              />
            </Field>
          </div>

          {/* Deposit notice */}
          {pub.depositRequired && pub.depositAmount && (
            <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="text-amber-400 flex-shrink-0">⚡</span>
              <p className="text-amber-300/80 text-xs leading-snug">
                A {fmtCurrency(pub.depositAmount, pub.currency)} deposit is required to fully secure your reservation.
                This is collected by the venue on arrival — not charged now.
              </p>
            </div>
          )}

          <div className="h-2" />
        </div>

        {/* Sticky submit footer */}
        <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-950 px-5 py-4 pb-safe">
          {cartCount > 0 && (
            <div className="flex justify-between text-xs mb-2 px-0.5">
              <span className="text-zinc-500">
                {cartCount} item{cartCount !== 1 ? 's' : ''} pre-ordered
              </span>
              <span className="text-zinc-300 font-bold">{fmtCurrency(cartTotal, pub.currency)}</span>
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={[
              'w-full font-black text-base py-4 rounded-2xl transition-all touch-manipulation',
              submitting
                ? 'bg-emerald-700 text-emerald-300 cursor-not-allowed'
                : 'bg-emerald-500 text-zinc-950 active:scale-[0.97] active:bg-emerald-400 shadow-xl shadow-emerald-500/25',
            ].join(' ')}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-emerald-300 border-t-transparent animate-spin" />
                Securing your spot…
              </span>
            ) : pub.depositRequired
              ? `Confirm Reservation${cartCount > 0 ? ` · ${fmtCurrency(cartTotal, pub.currency)}` : ''}`
              : `Reserve My Spot${cartCount > 0 ? ` · ${fmtCurrency(cartTotal, pub.currency)}` : ' — Free'}`}
          </button>
          <p className="text-center text-[10px] text-zinc-600 mt-2">
            No payment required now · Confirmation sent to your email
          </p>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ─── Backdrop ─────────────────────────────────────────────────

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full bg-zinc-950 rounded-t-3xl border border-zinc-800/80 overflow-hidden"
        style={{
          maxWidth: 480,
          animation: 'modalSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
      `}</style>
    </div>
  );
}
