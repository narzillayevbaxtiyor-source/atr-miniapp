'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fmt, minPrice } from '../lib/format';
import Bottle from '../components/Bottle';

const CATS = ['Hammasi', 'Erkaklar', 'Ayollar', 'Uniseks', 'Arab attarlari'];
const CART_KEY = 'atr_cart_v1';

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
  const [form, setForm] = useState({ name: '', phone: '', address: '', comment: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [isTg, setIsTg] = useState(false);
  const [orderNo, setOrderNo] = useState('');

  const actionRef = useRef(() => {});
  const backRef = useRef(() => {});

  // ---- Telegram WebApp ----
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initData) return;
    setIsTg(true);
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.('#14100c');
      tg.setBackgroundColor?.('#14100c');
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

  // ---- Savat (localStorage) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + c.qty * c.price, 0);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === 'Hammasi' || p.category === cat) &&
        (!s || p.name.toLowerCase().includes(s) || (p.brand || '').toLowerCase().includes(s))
    );
  }, [products, cat, q]);

  const go = (v) => {
    setErr('');
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const openProduct = (p) => {
    setSel(p);
    setMl(p.variants?.[0]?.ml ?? null);
    go('product');
  };

  const addToCart = () => {
    const v = sel.variants.find((x) => x.ml === ml);
    if (!v) return;
    setCart((c) => {
      const i = c.findIndex((x) => x.id === sel.id && x.ml === ml);
      if (i >= 0) return c.map((x, k) => (k === i ? { ...x, qty: Math.min(x.qty + 1, 50) } : x));
      return [...c, { id: sel.id, name: sel.name, brand: sel.brand, ml, price: Number(v.price), qty: 1 }];
    });
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
    go('cart');
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
    // Egasiga Telegram xabari (ixtiyoriy, BOT_TOKEN sozlangan bo'lsa)
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
    };
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initData) return;
    if (view === 'home') tg.BackButton.hide();
    else tg.BackButton.show();

    const mb = tg.MainButton;
    const cfg = {
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

  // ================= UI =================
  const topbar = (
    <div className="top">
      <div className="logo">
        Atr
        <small>Original attarlar</small>
      </div>
      <button className="cart-btn" onClick={() => go('cart')} aria-label="Savat">
        Savat
        {count > 0 && <span className="badge">{count}</span>}
      </button>
    </div>
  );

  const backRow = (label, to) => (
    <div className="back-row">
      <button className="link-back" onClick={() => go(to)}>
        {'←'} {label}
      </button>
    </div>
  );

  if (view === 'product' && sel) {
    const cur = sel.variants.find((v) => v.ml === ml);
    return (
      <div className="detail">
        {backRow('Orqaga', 'home')}
        <div className="detail-img">
          <Bottle name={sel.name} image={sel.image_url} />
        </div>
        <div className="pbrand" style={{ marginTop: 14 }}>{sel.brand}</div>
        <h2>{sel.name}</h2>
        <p className="desc">{sel.description}</p>
        <div className="sizes">
          {sel.variants.map((v) => (
            <button key={v.ml} className={'size' + (v.ml === ml ? ' on' : '')} onClick={() => setMl(v.ml)}>
              <b>{v.ml} ml</b>
              <span>{fmt(v.price)}</span>
            </button>
          ))}
        </div>
        {(sel.notes_top || sel.notes_heart || sel.notes_base) && (
          <div className="notes">
            {sel.notes_top && <div><span>Yuqori nota</span><b>{sel.notes_top}</b></div>}
            {sel.notes_heart && <div><span>Yurak nota</span><b>{sel.notes_heart}</b></div>}
            {sel.notes_base && <div><span>Baza nota</span><b>{sel.notes_base}</b></div>}
          </div>
        )}
        {!isTg && (
          <div className="fixedbar"><div className="inner">
            <button className="btn" onClick={addToCart}>
              Savatga qo&lsquo;shish {cur ? '• ' + fmt(cur.price) : ''}
            </button>
          </div></div>
        )}
      </div>
    );
  }

  if (view === 'cart') {
    return (
      <div>
        {backRow('Do‘konga qaytish', 'home')}
        <h2 style={{ fontSize: 30, marginBottom: 12 }}>Savat</h2>
        {cart.length === 0 ? (
          <div className="empty">Savat bo&lsquo;sh</div>
        ) : (
          <>
            {cart.map((c) => (
              <div className="row" key={c.id + c.ml}>
                <div className="thumb"><Bottle name={c.name} /></div>
                <div className="info">
                  <b>{c.name}</b>
                  <span>{c.ml} ml &middot; {fmt(c.price)}</span>
                </div>
                <div className="qty">
                  <button onClick={() => changeQty(c.id, c.ml, -1)}>&minus;</button>
                  <span>{c.qty}</span>
                  <button onClick={() => changeQty(c.id, c.ml, 1)}>+</button>
                </div>
              </div>
            ))}
            <div className="total"><span>Jami</span><b>{fmt(total)}</b></div>
            {!isTg && (
              <div className="fixedbar"><div className="inner">
                <button className="btn" onClick={() => go('checkout')}>Buyurtma berish</button>
              </div></div>
            )}
          </>
        )}
      </div>
    );
  }

  if (view === 'checkout') {
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    return (
      <div>
        {backRow('Savatga qaytish', 'cart')}
        <h2 style={{ fontSize: 30, marginBottom: 12 }}>Buyurtma</h2>
        <div className="field">
          <label>Ismingiz *</label>
          <input className="input" value={form.name} onChange={set('name')} autoComplete="name" />
        </div>
        <div className="field">
          <label>Telefon raqami *</label>
          <input className="input" type="tel" inputMode="tel" placeholder="+998 90 123 45 67" value={form.phone} onChange={set('phone')} autoComplete="tel" />
        </div>
        <div className="field">
          <label>Shahar va manzil *</label>
          <textarea className="input" value={form.address} onChange={set('address')} />
        </div>
        <div className="field">
          <label>Izoh (ixtiyoriy)</label>
          <input className="input" value={form.comment} onChange={set('comment')} />
        </div>
        <div className="total"><span>To&lsquo;lov: naqd, yetkazilganda</span><b>{fmt(total)}</b></div>
        {err && <div className="error">{err}</div>}
        {!isTg && (
          <div className="fixedbar"><div className="inner">
            <button className="btn" disabled={busy} onClick={submit}>
              {busy ? 'Yuborilmoqda...' : 'Buyurtmani tasdiqlash'}
            </button>
          </div></div>
        )}
      </div>
    );
  }

  if (view === 'done') {
    return (
      <div className="done">
        <div className="tick">{'✓'}</div>
        <h2>Buyurtma qabul qilindi</h2>
        <p style={{ color: 'var(--muted)' }}>
          Raqam: <b style={{ color: 'var(--gold2)' }}>#{orderNo}</b>
          <br />Tez orada siz bilan bog&lsquo;lanamiz.
        </p>
        {!isTg && (
          <button className="btn" style={{ marginTop: 20 }} onClick={() => go('home')}>
            Bosh sahifa
          </button>
        )}
      </div>
    );
  }

  // ---- Bosh sahifa ----
  return (
    <div>
      {topbar}
      <div className="hero">
        <h1>Sizning<br />hidingiz</h1>
        <p>Original va tanlangan attarlar. Yetkazib berish butun mamlakat bo&lsquo;ylab.</p>
        <div className="hero-bottle"><Bottle name="Atr" /></div>
      </div>
      <input className="search" placeholder="Atr yoki brend qidirish..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips">
        {CATS.map((c) => (
          <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="empty">Yuklanmoqda...</div>
      ) : loadErr ? (
        <div className="error">{loadErr}</div>
      ) : filtered.length === 0 ? (
        <div className="empty">Hech narsa topilmadi</div>
      ) : (
        <div className="grid">
          {filtered.map((p, i) => (
            <button key={p.id} className="pcard" style={{ animationDelay: i * 40 + 'ms' }} onClick={() => openProduct(p)}>
              <div className="pimg"><Bottle name={p.name} image={p.image_url} /></div>
              <div className="pbrand">{p.brand}</div>
              <div className="pname">{p.name}</div>
              <div className="pprice">{fmt(minPrice(p))}dan</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
