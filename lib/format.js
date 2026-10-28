export const fmt = (n) =>
  new Intl.NumberFormat('uz-UZ').format(Math.round(Number(n) || 0)).replace(/,/g, ' ') + " so'm";

export const minPrice = (p) => {
  const prices = (p.variants || []).map((v) => Number(v.price)).filter((x) => x > 0);
  return prices.length ? Math.min(...prices) : 0;
};
