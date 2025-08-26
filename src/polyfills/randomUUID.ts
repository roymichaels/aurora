(() => {
  const g = globalThis as any;

  if (!g.crypto) g.crypto = {};

  if (typeof g.crypto.randomUUID !== 'function') {
    const rng = (n = 16) => {
      if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
        const a = new Uint8Array(n);
        g.crypto.getRandomValues(a);
        return a;
      }
      const a = new Uint8Array(n);
      for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
      return a;
    };

    g.crypto.randomUUID = () => {
      const a = rng(16);
      a[6] = (a[6] & 0x0f) | 0x40;
      a[8] = (a[8] & 0x3f) | 0x80;
      const b = Array.from(a, x => x.toString(16).padStart(2, '0'));
      return `${b[0]}${b[1]}${b[2]}${b[3]}-${b[4]}${b[5]}-${b[6]}${b[7]}-${b[8]}${b[9]}-${b[10]}${b[11]}${b[12]}${b[13]}${b[14]}${b[15]}`;
    };
  }
})();
