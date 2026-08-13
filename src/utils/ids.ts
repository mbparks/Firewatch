export const makeId = (prefix = 'id') => `${prefix}-${crypto.randomUUID()}`;

export const makeReportId = (node = 'FW') => {
  let hash = 0;
  for (const ch of node) hash = ((hash * 31) + ch.charCodeAt(0)) & 0xff;
  const prefix = hash.toString(16).padStart(2,'0').toUpperCase();
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
  return `${prefix}${random}`;
};
