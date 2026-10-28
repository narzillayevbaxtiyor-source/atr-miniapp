'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Bottle from './Bottle';
import { fmt, minPrice } from '../lib/format';

export default function ProductCard({ p, index = 0, fav, onFav, onOpen, wide = false }) {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(p)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(p)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: 'easeOut' }}
      whileTap={{ scale: 0.97 }}
      className={
        'group relative cursor-pointer select-none overflow-hidden rounded-3xl border border-ink-600/70 bg-ink-800 p-2.5 text-left ' +
        (wide ? 'w-44 shrink-0 snap-start' : '')
      }
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_30%,#3a2c1b,#17110b_75%)]">
        <div className="h-32 transition-transform duration-500 group-hover:scale-105">
          <Bottle name={p.name} image={p.image_url} />
        </div>
        <button
          type="button"
          aria-label="Sevimli"
          onClick={(e) => {
            e.stopPropagation();
            onFav(p.id);
          }}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink-950/60 backdrop-blur"
        >
          <Heart size={16} className={fav ? 'fill-gold-400 text-gold-400' : 'text-sand-100/80'} />
        </button>
        <span className="absolute left-2 top-2 rounded-full bg-ink-950/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold-300 backdrop-blur">
          {p.category}
        </span>
      </div>
      <div className="px-1 pb-1 pt-2.5">
        <div className="text-[11px] uppercase tracking-[0.15em] text-sand-400">{p.brand}</div>
        <div className="font-display text-xl leading-tight text-sand-100">{p.name}</div>
        <div className="mt-1 text-sm font-semibold text-gold-300">{fmt(minPrice(p))}dan</div>
      </div>
    </motion.div>
  );
}
