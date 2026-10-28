'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Check, Droplets, Heart, Minus, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Truck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fmt } from '../lib/format';
import Bottle from '../components/Bottle';
import ProductCard from '../components/ProductCard';

const CATS = ['Hammasi', 'Sevimlilar', 'Erkaklar', 'Ayollar', 'Uniseks', 'Arab attarlari'];
const CART_KEY = 'atr_cart_v1';
const FAV_KEY = 'atr_fav_v1';

const page = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

const inputCls =
  'w-full rounded-2xl border border-ink-600 bg-ink-800 px-4 py-3.5 text-sand-100 outline-none transition focus:border-gold-500';
const primaryBtn =
  'flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 px-5 py-4 text-base font-bold text-ink-950 shadow-[0_8px_30px_-8px_rgba(201,164,92,0.6)] disabled:opacity-60';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [cat, setCat] = useState('Hammasi');
  const [q, setQ] = useState('');
  const [view, setView] = useState('home'); // home | product | cart | checkout | done
  const [sel, setSel] = useState(null);
  const [ml, setMl] = useState(null);
  const [cart, setCart] = useState([]);
  const [favs, setFavs] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', comment: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [isTg, setIsTg] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [toast, setToast] = useState('');

  const actionRef = useRef(() => {});
  const backRef = useRef(() => {});
  const catalogRef = useRef(null);

  // ---- Telegram WebApp ----
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initData) return;
    setIsTg(true);
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.('#0d0a07');
      tg.setBackgroundColor?.('#0d0a07');
    } catch {}
    const u = tg.initDataUnsafe?.user;
    if (u) {
      const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
      setForm((f) => ({ ...f, name: f.name || full }));
    }
    const onMain = () => actionRef.current();
    const onBack = () => backRef.current();
    tg.MainButton.onClick(onMain);
    tg.BackButton.onClick(onBack);
    return () => {
      tg.MainButton.offClick(onMain);
      tg.BackButton.offClick(onBack);
    };
  }, []);

  // ---- Mahsulotlar ----
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true });
      if (error) setLoadErr("Mahsulotlarni yuklab bo'lmadi. Internetni tekshiring.");
      else setProducts(data || []);
      setLoading(false);
    })();
  }, []);

  // ---- Savat va sevimlilar (localStorage) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setCart(JSON.parse(raw));
      const fr = localStorage.getItem(FAV_KEY);
      if (fr) setFavs(JSON.parse(fr));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);
  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    } catch {}
  }, [favs]);

  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + c.qty * c.price, 0);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === 'Hammasi' || (cat === 'Sevimlilar' ? favs.includes(p.id) : p.category === cat)) &&
        (!s || p.name.toLowerCase().includes(s) || (p.brand || '').toLowerCase().includes(s))
    );
  }, [products, cat, q, favs]);

  const featured = products.slice(0, 5);
  const showFeatured = cat === 'Hammasi' && !q.trim() && featured.length > 0;

  const go = (v) => {
    setErr('');
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(''), 1800);
  };

  const toggleFav = (id) =>
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const openProduct = (p) => {
    setSel(p);
    setMl(p.variants?.[0]?.ml ?? null);
    go('product');
  };

  const addToCart = () => {
    const v = sel?.variants.find((x) => x.ml === ml);
    if (!v) return;
    setCart((c) => {
      const i = c.findIndex((x) => x.id === sel.id && x.ml === ml);
      if (i >= 0) return c.map((x, k) => (k === i ? { ...x, qty: Math.min(x.qty + 1, 50) } : x));
      return [...c, { id: sel.id, name: sel.name, brand: sel.brand, ml, price: Number(v.price), qty: 1 }];
    });
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
    flash('Savatga qo‘shildi');
    go('home');
  };

  const changeQty = (id, mlv, d) =>
    setCart((c) =>
      c
        .map((x) => (x.id === id && x.ml === mlv ? { ...x, qty: x.qty + d } : x))
        .filter((x) => x.qty > 0 && x.qty <= 50)
    );

  const submit = useCallback(async () => {
    if (busy) return;
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setErr("Ism, telefon va manzilni to'ldiring");
      return;
    }
    if (form.phone.replace(/\D/g, '').length < 9) {
      setErr("Telefon raqami noto'g'ri");
      return;
    }
    setBusy(true);
    setErr('');
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const { data, error } = await supabase.rpc('create_order', {
      p_name: form.name,
      p_phone: form.phone,
      p_address: form.address,
      p_comment: form.comment,
      p_tg: tgUser?.id ?? null,
      p_items: cart.map((c) => ({ product_id: c.id, ml: c.ml, qty: c.qty })),
    });
    setBusy(false);
    if (error) {
      setErr(error.message || "Buyurtma yuborilmadi. Qayta urinib ko'ring.");
      return;
    }
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, total, items: cart, tg: tgUser?.username || tgUser?.id || null }),
    }).catch(() => {});
    setOrderNo(String(data).slice(0, 8).toUpperCase());
    setCart([]);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
    go('done');
  }, [busy, form, cart, total]);

  // ---- MainButton / BackButton holati ----
  useEffect(() => {
    backRef.current = () => {
      if (view === 'checkout') go('cart');
      else go('home');
    };
    actionRef.current = () => {
      if (view === 'product') addToCart();
      else if (view === 'cart') go('checkout');
      else if (view === 'checkout') submit();
      else if (view === 'done') go('home');
      else if (view === 'home' && cart.length) go('cart');
    };
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initData) return;
    if (view === 'home') tg.BackButton.hide();
    else tg.BackButton.show();

    const mb = tg.MainButton;
    const cfg = {
      home: cart.length ? { text: `Savat • ${fmt(total)}`, on: true } : null,
      product: sel && ml ? { text: 'Savatga qo‘shish', on: true } : null,
      cart: cart.length ? { text: `Buyurtma berish • ${fmt(total)}`, on: true } : null,
      checkout: { text: busy ? 'Yuborilmoqda...' : `Tasdiqlash • ${fmt(total)}`, on: !busy },
      done: { text: 'Bosh sahifaga', on: true },
    }[view];
    if (!cfg) mb.hide();
    else {
      mb.setParams({ text: cfg.text, color: '#c9a45c', text_color: '#1a130b', is_active: cfg.on });
      mb.show();
    }
  });

  // ================= UI qismlari =================
  const BackLink = ({ label, to }) => (
    <button onClick={() => go(to)} className="flex items-center gap-2 py-4 text-gold-300">
      <ArrowLeft size={18} /> {label}
    </button>
  );

  let content = null;
  let bar = null;

  if (view === 'product' && sel) {
    const cur = sel.variants.find((v) => v.ml === ml);
    const notes = [
      ['Yuqori nota', sel.notes_top, 'bg-gold-300'],
      ['Yurak nota', sel.notes_heart, 'bg-gold-500'],
      ['Baza nota', sel.notes_base, 'bg-gold-600'],
    ].filter((n) => n[1]);
    content = (
      <div>
        <BackLink label="Orqaga" to="home" />
        <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-[28px] border border-ink-600/70 bg-[radial-gradient(circle_at_50%_25%,#4a361d,#15100a_70%)]">
          <div className="absolute h-48 w-48 rounded-full bg-gold-500/20 blur-3xl" />
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16 }}
            className="relative h-56"
          >
            <Bottle name={sel.name} image={sel.image_url} />
          </motion.div>
          <button
            onClick={() => toggleFav(sel.id)}
            aria-label="Sevimli"
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-ink-950/60 backdrop-blur"
          >
            <Heart size={18} className={favs.includes(sel.id) ? 'fill-gold-400 text-gold-400' : 'text-sand-100/80'} />
          </button>
        </div>

        <div className="mt-5 text-[11px] uppercase tracking-[0.2em] text-sand-400">{sel.brand} &middot; {sel.category}</div>
        <h2 className="gold-text mt-1 font-display text-4xl font-semibold leading-none">{sel.name}</h2>
        <p className="mt-3 text-sand-400">{sel.description}</p>

        <div className="mt-6 text-sm uppercase tracking-widest text-sand-400">Hajmni tanlang</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {sel.variants.map((v) => {
            const on = v.ml === ml;
            return (
              <button
                key={v.ml}
                onClick={() => setMl(v.ml)}
                className={
                  'relative rounded-2xl border px-4 py-3 text-center transition ' +
                  (on ? 'border-gold-500' : 'border-ink-600 bg-ink-800')
                }
              >
                {on && (
                  <motion.span
                    layoutId="size-pill"
                    className="absolute inset-0 rounded-2xl bg-gold-500/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative block font-semibold">{v.ml} ml</span>
                <span className="relative block text-xs text-gold-300">{fmt(v.price)}</span>
              </button>
            );
          })}
        </div>

        {notes.length > 0 && (
          <div className="mt-6 rounded-3xl border border-ink-600/70 bg-ink-800 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm uppercase tracking-widest text-sand-400">
              <Sparkles size={15} className="text-gold-400" /> Hid piramidasi
            </div>
            <div className="space-y-3">
              {notes.map(([label, val, dot]) => (
                <div key={label} className="flex items-start gap-3">
                  <span className={'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ' + dot} />
                  <div>
                    <div className="text-xs text-sand-400">{label}</div>
                    <div className="text-sand-100">{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
    if (!isTg) {
      bar = (
        <button onClick={addToCart} className={primaryBtn}>
          <ShoppingBag size={18} /> Savatga qo&lsquo;shish {cur ? '• ' + fmt(cur.price) : ''}
        </button>
      );
    }
  } else if (view === 'cart') {
    content = (
      <div>
        <BackLink label="Do&lsquo;konga qaytish" to="home" />
        <h2 className="mb-4 font-display text-4xl font-semibold text-sand-100">Savat</h2>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-sand-400">
            <ShoppingBag size={44} className="text-ink-600" />
            Savat bo&lsquo;sh
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {cart.map((c) => (
                <motion.div
                  key={c.id + c.ml}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                  className="mb-3 flex items-center gap-3 rounded-3xl border border-ink-600/70 bg-ink-800 p-3"
                >
                  <div className="flex h-16 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink-900">
                    <div className="h-12"><Bottle name={c.name} /></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-xl leading-tight">{c.name}</div>
                    <div className="text-sm text-sand-400">{c.ml} ml &middot; {fmt(c.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(c.id, c.ml, -1)} className="grid h-8 w-8 place-items-center rounded-xl border border-ink-600 bg-ink-700" aria-label="Kamaytirish">
                      <Minus size={15} />
                    </button>
                    <span className="w-5 text-center font-semibold">{c.qty}</span>
                    <button onClick={() => changeQty(c.id, c.ml, 1)} className="grid h-8 w-8 place-items-center rounded-xl border border-ink-600 bg-ink-700" aria-label="Ko'paytirish">
                      <Plus size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="mt-4 flex items-center justify-between rounded-3xl border border-gold-500/30 bg-gold-500/10 px-5 py-4 text-lg">
              <span>Jami</span>
              <b className="text-gold-300">{fmt(total)}</b>
            </div>
          </>
        )}
      </div>
    );
    if (!isTg && cart.length > 0) {
      bar = <button onClick={() => go('checkout')} className={primaryBtn}>Buyurtma berish</button>;
    }
  } else if (view === 'checkout') {
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    content = (
      <div>
        <BackLink label="Savatga qaytish" to="cart" />
        <h2 className="mb-4 font-display text-4xl font-semibold text-sand-100">Buyurtma</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm text-sand-400">Ismingiz *</span>
            <input className={inputCls} value={form.name} onChange={set('name')} autoComplete="name" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-sand-400">Telefon raqami *</span>
            <input className={inputCls} type="tel" inputMode="tel" placeholder="+998 90 123 45 67" value={form.phone} onChange={set('phone')} autoComplete="tel" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-sand-400">Shahar va manzil *</span>
            <textarea className={inputCls + ' min-h-[88px]'} value={form.address} onChange={set('address')} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-sand-400">Izoh (ixtiyoriy)</span>
            <input className={inputCls} value={form.comment} onChange={set('comment')} />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-3xl border border-gold-500/30 bg-gold-500/10 px-5 py-4">
          <span className="text-sm text-sand-400">To&lsquo;lov: naqd, yetkazilganda</span>
          <b className="text-lg text-gold-300">{fmt(total)}</b>
        </div>
        {err && <div className="mt-3 rounded-2xl border border-red-900 bg-red-950/60 px-4 py-3 text-red-300">{err}</div>}
      </div>
    );
    if (!isTg) {
      bar = (
        <button onClick={submit} disabled={busy} className={primaryBtn}>
          {busy ? 'Yuborilmoqda...' : 'Buyurtmani tasdiqlash'}
        </button>
      );
    }
  } else if (view === 'done') {
    content = (
      <div className="flex flex-col items-center px-4 pt-24 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950"
        >
          <Check size={48} strokeWidth={3} />
        </motion.div>
        <h2 className="gold-text mt-6 font-display text-4xl font-semibold">Buyurtma qabul qilindi</h2>
        <p className="mt-3 text-sand-400">
          Raqam: <b className="text-gold-300">#{orderNo}</b>
          <br />Tez orada siz bilan bog&lsquo;lanamiz.
        </p>
      </div>
    );
    if (!isTg) bar = <button onClick={() => go('home')} className={primaryBtn}>Bosh sahifa</button>;
  } else {
    // ---- Bosh sahifa ----
    content = (
      <div>
        <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between bg-ink-950/80 px-4 py-3.5 backdrop-blur-xl">
          <div>
            <div className="gold-text font-display text-3xl font-semibold leading-none">Atr</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-sand-400">Original attarlar</div>
          </div>
          <button onClick={() => go('cart')} aria-label="Savat" className="relative grid h-11 w-11 place-items-center rounded-2xl border border-ink-600 bg-ink-800 text-gold-300">
            <ShoppingBag size={20} />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold-500 px-1 text-[11px] font-bold text-ink-950"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className="relative mt-2 overflow-hidden rounded-[28px] border border-ink-600/70 bg-[radial-gradient(120%_120%_at_85%_10%,#6b4a1c_0%,#2a1c0d_45%,#120d08_100%)] p-6">
          <div className="relative z-10 max-w-[62%]">
            <div className="text-[11px] uppercase tracking-[0.3em] text-gold-300">Yangi kolleksiya</div>
            <h1 className="mt-2 font-display text-[40px] font-semibold leading-[0.95] text-sand-100">
              Sizning <span className="gold-text">hidingiz</span>
            </h1>
            <p className="mt-3 text-sm text-sand-400">Tanlangan va original attarlar. Butun mamlakat bo&lsquo;ylab yetkazamiz.</p>
            <button
              onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="mt-5 rounded-full border border-gold-500/60 bg-gold-500/10 px-5 py-2.5 text-sm font-semibold text-gold-300"
            >
              Ko&lsquo;rish
            </button>
          </div>
          <div className="absolute -right-2 bottom-2 h-44 animate-float drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]">
            <Bottle name="Atr" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-sand-400">
          {[[Truck, 'Tez yetkazish'], [ShieldCheck, '100% original'], [Droplets, 'Naqd to‘lov']].map(([Icon, t]) => (
            <div key={t} className="flex flex-col items-center gap-1.5 rounded-2xl border border-ink-600/60 bg-ink-800/70 py-3">
              <Icon size={18} className="text-gold-400" />
              {t}
            </div>
          ))}
        </div>

        <div className="relative mt-5">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sand-400" />
          <input
            className={inputCls + ' pl-11'}
            placeholder="Atr yoki brend qidirish..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 py-1">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={'relative shrink-0 rounded-full border px-4 py-2 text-sm ' + (cat === c ? 'border-transparent font-semibold text-ink-950' : 'border-ink-600 bg-ink-800 text-sand-400')}
            >
              {cat === c && (
                <motion.span
                  layoutId="cat-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-400 to-gold-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{c}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl bg-ink-800" />
            ))}
          </div>
        ) : loadErr ? (
          <div className="mt-4 rounded-2xl border border-red-900 bg-red-950/60 px-4 py-3 text-red-300">{loadErr}</div>
        ) : (
          <>
            {showFeatured && (
              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2 font-display text-2xl text-sand-100">
                  <Sparkles size={18} className="text-gold-400" /> Tanlanganlar
                </div>
                <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
                  {featured.map((p, i) => (
                    <ProductCard key={p.id} p={p} index={i} wide fav={favs.includes(p.id)} onFav={toggleFav} onOpen={openProduct} />
                  ))}
                </div>
              </div>
            )}
            <div ref={catalogRef} className="scroll-mt-20 pt-5">
              <div className="mb-2 font-display text-2xl text-sand-100">
                {cat === 'Hammasi' ? 'Hamma attarlar' : cat}
              </div>
              {filtered.length === 0 ? (
                <div className="py-14 text-center text-sand-400">Hech narsa topilmadi</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((p, i) => (
                    <ProductCard key={p.id} p={p} index={i} fav={favs.includes(p.id)} onFav={toggleFav} onOpen={openProduct} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );

    if (count > 0 && !isTg) {
      bar = (
        <motion.button
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => go('cart')}
          className={primaryBtn + ' justify-between'}
        >
          <span className="flex items-center gap-2"><ShoppingBag size={18} /> Savat &middot; {count} ta</span>
          <span>{fmt(total)}</span>
        </motion.button>
      );
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={view} variants={page} initial="initial" animate="animate" exit="exit">
          {content}
        </motion.div>
      </AnimatePresence>

      {bar && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-6">
          <div className="mx-auto max-w-[448px]">{bar}</div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gold-500/40 bg-ink-800 px-4 py-2.5 text-sm text-gold-300 shadow-xl"
          >
            <Check size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
