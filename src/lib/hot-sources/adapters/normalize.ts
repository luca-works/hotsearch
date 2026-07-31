import * as cheerio from 'cheerio';

export const decodeHtmlText = (value: unknown) => (
  cheerio.load(`<span>${String(value || '')}</span>`, null, false).text().trim()
);

export const woshipmArticleUrl = (type: unknown, id: string | number) => {
  const section = String(type || 'article').replace(/^\/+|\/+$/g, '');
  return `https://www.woshipm.com/${section}/${id}.html`;
};

export const sanitizeHupuDescription = (value: unknown) => {
  const desc = String(value || '').split(/>"?\s*target=/i)[0];
  return cheerio.load(desc, null, false).text().replace(/\s+/g, ' ').trim();
};

export const uniqueBy = <T>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

