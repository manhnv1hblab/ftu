/*
 * Find a school-specific campus/facility image for every S27 partner.
 *
 * This is an offline enrichment step, not a build-time dependency. It uses
 * Bing Images only to discover a source page and direct image URL, then keeps
 * the source page in the normalized record for auditability. If no reliable
 * campus result is found, the existing official-domain favicon remains as the
 * explicit fallback; the UI never presents that fallback as a campus photo.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'universities_s27.json');
const verifiedAt = '2026-09-21';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const htmlDecode = (value) => String(value || '')
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const stopWords = new Set([
  'the', 'and', 'of', 'university', 'universities', 'school', 'schools',
  'college', 'faculty', 'institute', 'international', 'national', 'applied',
  'sciences', 'business', 'management', 'technology', 'higher', 'education',
  'global', 'for', 'arts', 'studies', 'academy', 'university',
  'china', 'usa', 'canada', 'australia', 'japan', 'korea', 'france', 'germany',
  'india', 'finland', 'belgium', 'norway', 'russia', 'spain', 'sweden',
  'switzerland', 'italy', 'hong', 'kong',
]);

function searchTokens(value) {
  return normalize(value).split(/\s+/).filter((token) => token.length > 2 && !stopWords.has(token));
}

function hostMatchesOfficial(url, officialUrl) {
  try {
    const resultHost = new URL(url).hostname.replace(/^www\./, '');
    const officialHost = new URL(officialUrl).hostname.replace(/^www\./, '');
    return resultHost === officialHost || resultHost.endsWith(`.${officialHost}`) || officialHost.endsWith(`.${resultHost}`);
  } catch {
    return false;
  }
}

function candidateScore(candidate, university) {
  const text = normalize(`${candidate.title} ${candidate.pageUrl}`);
  const tokens = searchTokens(university.name);
  const matched = tokens.filter((token) => text.includes(token)).length;
  const campusWords = /(campus|aerial|entrance|building|facilit|library|hall|gate|grounds|view|architecture|student life)/i;
  const logoWords = /(logo|seal|crest|emblem|wordmark|coat.of.arms|favicon|symbol)/i;
  let score = matched * 2;
  if (hostMatchesOfficial(candidate.pageUrl, university.imageSourceUrl)) score += 10;
  if (campusWords.test(`${candidate.title} ${candidate.imageUrl}`)) score += 5;
  if (logoWords.test(`${candidate.title} ${candidate.imageUrl}`)) score -= 12;
  if (candidate.title.toLowerCase().includes(university.name.toLowerCase().split(/[,(:]/)[0].trim().toLowerCase())) score += 5;
  return score;
}

async function fetchJson(url, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FTUGoGlobal/1.0 (S27 campus image audit)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 429 || response.status >= 500) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      if (!response.ok) return null;
      return await response.json();
    } catch {
      await sleep(700 * (attempt + 1));
    }
  }
  return null;
}

async function probeImage(url) {
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'FTUGoGlobal/1.0 (S27 campus image audit)' },
      signal: AbortSignal.timeout(10000),
    });
    let contentType = response.headers.get('content-type') || '';
    if (response.status === 405 || response.status === 403 || !contentType) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': 'FTUGoGlobal/1.0 (S27 campus image audit)' },
        signal: AbortSignal.timeout(10000),
      });
      contentType = response.headers.get('content-type') || '';
      if (response.body) await response.body.cancel();
    }
    return response.ok && contentType.toLowerCase().startsWith('image/');
  } catch {
    return false;
  }
}

async function findCampusImage(university) {
  const query = `${university.name.replace(/\s+/g, ' ')} campus`;
  const url = `https://www.bing.com/images/search?cc=us&setlang=en&form=HDRSC2&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return null;
  const html = await response.text();
  const candidates = [];
  const matcher = /class="iusc"[^>]*m="([^"]+)"/g;
  let match;
  while ((match = matcher.exec(html)) && candidates.length < 20) {
    try {
      const metadata = JSON.parse(htmlDecode(match[1]));
      if (!metadata.murl || !metadata.purl || !/^https?:\/\//i.test(metadata.murl)) continue;
      const candidate = {
        imageUrl: metadata.murl,
        pageUrl: metadata.purl,
        title: htmlDecode(metadata.t || metadata.desc || ''),
      };
      candidate.score = candidateScore(candidate, university);
      candidates.push(candidate);
    } catch {
      // Ignore malformed result cards and continue with the next search result.
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  for (const candidate of candidates.slice(0, 10)) {
    const isCampusLike = /(campus|aerial|entrance|building|facilit|library|hall|gate|grounds|view|architecture|student life)/i.test(`${candidate.title} ${candidate.imageUrl}`);
    const isLogoLike = /(logo|seal|crest|emblem|wordmark|coat.of.arms|favicon|symbol)/i.test(`${candidate.title} ${candidate.imageUrl}`);
    const hasOfficialSignal = hostMatchesOfficial(candidate.pageUrl, university.websiteUrl);
    const hasSchoolSignal = searchTokens(university.name).filter((token) => normalize(`${candidate.title} ${candidate.pageUrl}`).includes(token)).length >= 2;
    if (isCampusLike && !isLogoLike && (hasOfficialSignal || hasSchoolSignal) && await probeImage(candidate.imageUrl)) {
      return candidate;
    }
  }
  return null;
}

async function main() {
  const universities = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  let campusCount = 0;
  let fallbackCount = 0;

  for (let index = 0; index < universities.length; index += 1) {
    const university = universities[index];
    try {
      const campus = await findCampusImage(university);
      if (campus) {
        university.imageUrl = campus.imageUrl;
        university.logoUrl = university.logoUrl || campus.imageUrl;
        university.imageSourceUrl = campus.pageUrl;
        university.imageSourceType = hostMatchesOfficial(campus.pageUrl, university.websiteUrl)
          ? 'official-campus-image'
          : 'internet-campus-image';
        university.imageVerifiedAt = verifiedAt;
        university.imageSearchTitle = campus.title;
        campusCount += 1;
      } else {
        university.imageUrl = university.logoUrl;
        university.imageSourceUrl = university.websiteUrl;
        university.imageSourceType = 'official-domain-favicon';
        university.imageVerifiedAt = verifiedAt;
        delete university.imageSearchTitle;
        fallbackCount += 1;
      }
    } catch (error) {
      fallbackCount += 1;
      console.warn(`Campus image search failed for ${university.name}: ${error.message}`);
    }
    if ((index + 1) % 10 === 0 || index === universities.length - 1) {
      console.log(`Processed ${index + 1}/${universities.length} · campus=${campusCount} · official identity fallback=${fallbackCount}`);
    }
    await sleep(250);
  }

  fs.writeFileSync(dataPath, `${JSON.stringify(universities, null, 2)}\n`, 'utf8');
  console.log(`Saved campus image enrichment for ${universities.length} universities.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
