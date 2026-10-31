// Yangi buyurtma haqida egasiga Telegram'da xabar yuboradi.
// Faqat BOT_TOKEN va ADMIN_CHAT_ID Vercel'da sozlangan bo'lsagina ishlaydi.
export async function POST(req) {
  const token = process.env.BOT_TOKEN;
  const chat = process.env.ADMIN_CHAT_ID;
  if (!token || !chat) {
    console.error("notify: BOT_TOKEN yoki ADMIN_CHAT_ID sozlanmagan");
    return Response.json({ ok: false, skipped: true });
  }

  let b;
  try {
    b = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const clip = (s, n) => String(s ?? '').slice(0, n);
  const items = (Array.isArray(b.items) ? b.items : [])
    .slice(0, 30)
    .map((i) => `• ${clip(i.name, 60)} ${Number(i.ml) || ''}ml × ${Number(i.qty) || 1}`)
    .join('\n');

  const text =
    `🛍 Yangi buyurtma\n\n` +
    `👤 ${clip(b.name, 80)}\n📞 ${clip(b.phone, 30)}\n📍 ${clip(b.address, 200)}\n` +
    (b.comment ? `💬 ${clip(b.comment, 200)}\n` : '') +
    (b.tg ? `✈️ Telegram: ${clip(b.tg, 40)}\n` : '') +
    `\n${items}\n\n💰 Jami: ${Math.round(Number(b.total) || 0)} SAR`;

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat.trim(), text }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      // Tokenni logga yozmaymiz, faqat Telegram javobini
      console.error('notify: Telegram xatosi', r.status, j.description || '');
      return Response.json({ ok: false, status: r.status, error: j.description || '' });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error('notify: tarmoq xatosi', e?.message);
    return Response.json({ ok: false, error: 'network' });
  }
}
