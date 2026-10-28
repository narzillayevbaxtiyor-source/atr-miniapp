'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { fmt } from '../../lib/format';

const STATUSES = ['yangi', "yo'lda", 'yetkazildi', 'bekor'];
const EMPTY = {
  id: '', name: '', brand: '', category: 'Uniseks', description: '', image_url: '',
  notes_top: '', notes_heart: '', notes_base: '', variantsText: '50:0', active: true,
};

const parseVariants = (t) =>
  t.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
    const [ml, price] = s.split(':').map((x) => Number(x.trim()));
    return { ml, price };
  }).filter((v) => v.ml > 0 && v.price >= 0);

export default function Admin() {
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (password) => {
    const [o, p] = await Promise.all([
      supabase.rpc('admin_list_orders', { pw: password }),
      supabase.rpc('admin_list_products', { pw: password }),
    ]);
    if (o.error || p.error) { setMsg((o.error || p.error).message); return false; }
    setOrders(o.data || []);
    setProducts(p.data || []);
    return true;
  }, []);

  const login = async (e) => {
    e?.preventDefault();
    setBusy(true); setMsg('');
    const { data, error } = await supabase.rpc('admin_check', { pw });
    if (error || !data) { setMsg("Parol noto'g'ri"); setBusy(false); return; }
    try { sessionStorage.setItem('atr_admin', pw); } catch {}
    setAuthed(true);
    await load(pw);
    setBusy(false);
  };

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('atr_admin');
      if (saved) { setPw(saved); supabase.rpc('admin_check', { pw: saved }).then(({ data }) => {
        if (data) { setAuthed(true); load(saved); }
      }); }
    } catch {}
  }, [load]);

  const setStatus = async (id, status) => {
    const { error } = await supabase.rpc('admin_set_order_status', { pw, p_id: id, p_status: status });
    if (error) setMsg(error.message); else load(pw);
  };

  const editProduct = (p) =>
    setForm({
      ...EMPTY, ...p,
      image_url: p.image_url || '',
      variantsText: (p.variants || []).map((v) => `${v.ml}:${v.price}`).join(', '),
    });

  const saveProduct = async () => {
    const variants = parseVariants(form.variantsText);
    if (!form.name.trim() || variants.length === 0) {
      setMsg("Nom va hajm:narx kiriting (masalan 50:450000, 100:800000)");
      return;
    }
    setBusy(true); setMsg('');
    const { error } = await supabase.rpc('admin_upsert_product', {
      pw,
      p: {
        id: form.id || null, name: form.name, brand: form.brand, category: form.category,
        description: form.description, image_url: form.image_url, notes_top: form.notes_top,
        notes_heart: form.notes_heart, notes_base: form.notes_base, variants, active: form.active,
      },
    });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setForm(null);
    load(pw);
  };

  const removeProduct = async (p) => {
    if (!confirm(`"${p.name}" o'chirilsinmi?`)) return;
    const { error } = await supabase.rpc('admin_delete_product', { pw, p_id: p.id });
    if (error) setMsg(error.message); else load(pw);
  };

  if (!authed) {
    return (
      <form onSubmit={login} style={{ paddingTop: 60 }}>
        <h2 style={{ fontSize: 32, marginBottom: 16 }}>Admin</h2>
        <div className="field">
          <label>Parol</label>
          <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        </div>
        {msg && <div className="error">{msg}</div>}
        <button className="btn" disabled={busy}>Kirish</button>
      </form>
    );
  }

  const f = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div>
      <h2 style={{ fontSize: 30, padding: '18px 0 0' }}>Admin panel</h2>
      <div className="tabs">
        <button className={tab === 'orders' ? 'on' : ''} onClick={() => setTab('orders')}>
          Buyurtmalar ({orders.length})
        </button>
        <button className={tab === 'products' ? 'on' : ''} onClick={() => setTab('products')}>
          Mahsulotlar ({products.length})
        </button>
      </div>
      {msg && <div className="error">{msg}</div>}

      {tab === 'orders' && (
        <>
          <button className="btn ghost small" style={{ marginBottom: 10 }} onClick={() => load(pw)}>Yangilash</button>
          {orders.length === 0 && <div className="empty">Hali buyurtma yo&lsquo;q</div>}
          {orders.map((o) => (
            <div className="order" key={o.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b>{o.customer_name}</b>
                <span className="status">{o.status}</span>
              </div>
              <div>
                <a href={`tel:${o.phone}`} style={{ color: 'var(--gold2)' }}>{o.phone}</a> &middot; {o.address}
              </div>
              {o.comment && <div style={{ color: 'var(--muted)' }}>{o.comment}</div>}
              <div className="items">
                {(o.items || []).map((i) => `${i.product_name} ${i.ml}ml × ${i.qty}`).join(' • ')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ color: 'var(--gold2)' }}>{fmt(o.total)}</b>
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                {new Date(o.created_at).toLocaleString('uz-UZ')}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'products' && (
        <>
          {!form && (
            <button className="btn small" style={{ marginBottom: 12 }} onClick={() => setForm({ ...EMPTY })}>
              + Yangi mahsulot
            </button>
          )}
          {form && (
            <div className="admin-form">
              <input className="input" placeholder="Nomi *" value={form.name} onChange={f('name')} />
              <input className="input" placeholder="Brend" value={form.brand} onChange={f('brand')} />
              <select className="input" value={form.category} onChange={f('category')}>
                {['Erkaklar', 'Ayollar', 'Uniseks', 'Arab attarlari'].map((c) => <option key={c}>{c}</option>)}
              </select>
              <textarea className="input" placeholder="Tavsif" value={form.description} onChange={f('description')} />
              <input className="input" placeholder="Rasm havolasi (ixtiyoriy)" value={form.image_url} onChange={f('image_url')} />
              <input className="input" placeholder="Yuqori nota" value={form.notes_top} onChange={f('notes_top')} />
              <input className="input" placeholder="Yurak nota" value={form.notes_heart} onChange={f('notes_heart')} />
              <input className="input" placeholder="Baza nota" value={form.notes_base} onChange={f('notes_base')} />
              <input className="input" placeholder="Hajm:narx, masalan 50:450000, 100:800000" value={form.variantsText} onChange={f('variantsText')} />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} />
                Do&lsquo;konda ko&lsquo;rinsin
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn small" disabled={busy} onClick={saveProduct}>Saqlash</button>
                <button className="btn ghost small" onClick={() => setForm(null)}>Bekor</button>
              </div>
            </div>
          )}
          {products.map((p) => (
            <div className="row" key={p.id} style={{ opacity: p.active ? 1 : 0.5 }}>
              <div className="info">
                <b>{p.name}</b>
                <span>{p.brand} &middot; {p.category} &middot; {(p.variants || []).map((v) => `${v.ml}ml`).join(', ')}</span>
              </div>
              <button className="btn ghost small" onClick={() => { editProduct(p); window.scrollTo({ top: 0 }); }}>Tahrir</button>
              <button className="btn danger small" onClick={() => removeProduct(p)}>&times;</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
