export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const hasMinPassword = (v) => v && v.length >= 8;
