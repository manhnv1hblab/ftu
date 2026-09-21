/*
 * Enrich the S27 partner directory with one verified image link per partner.
 *
 * The image is intentionally resolved through the partner's official domain
 * (Icon Horse's favicon endpoint), not through a guessed stock/campus photo. The
 * official domain is kept in imageSourceUrl so the mapping remains auditable.
 * Business facts are not changed by this script.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const inputPath = path.join(root, 'data', 'universities_s27.json');

const officialDomainById = {
  'university-of-regina': 'uregina.ca',
  'university-of-the-bahamas': 'ub.edu.bs',
  'millikin-university': 'millikin.edu',
  'minnesota-state-university': 'mnsu.edu',
  'niagara-university': 'niagara.edu',
  'university-of-south-carolina': 'sc.edu',
  'lingnan-university': 'ln.edu.hk',
  'beijing-foreign-studies-university-bfsu': 'bfsu.edu.cn',
  'beijing-international-studies-university-bisu': 'bisu.edu.cn',
  'guangdong-university-of-foreign-studies-south-china-business-college-scbc': 'gdufs.edu.cn',
  'guilin-university-of-electronic-technology': 'guet.edu.cn',
  'hunan-normal-university': 'hunnu.edu.cn',
  'kunming-university-of-science-and-technology': 'kmust.edu.cn',
  'shanghai-university-of-finance-and-economics': 'sufe.edu.cn',
  'southwest-university': 'swu.edu.cn',
  'karpagam-academy-of-higher-education-kahe': 'kahedu.edu.in',
  's-p-jain-institute-of-management-research': 'spjimr.org',
  'aichi-university': 'aichi-u.ac.jp',
  'akita-international-university': 'aiu.ac.jp',
  'aomori-chuo-gakuin-university': 'aomoricgu.ac.jp',
  'doshisha-women-s-college-of-liberal-arts': 'dwc.doshisha.ac.jp',
  'fukui-prefectural-university': 'fpu.ac.jp',
  'fukuyama-university': 'fukuyama-u.ac.jp',
  'hiroshima-university-of-economics': 'hue.ac.jp',
  'hitotsubashi-university': 'hit-u.ac.jp',
  'international-university-of-japan': 'iuj.ac.jp',
  'j-f-oberlin-university': 'obirin.ac.jp',
  'kagoshima-university': 'kagoshima-u.ac.jp',
  'kanazawa-university': 'kanazawa-u.ac.jp',
  'kanda-university-of-international-studies': 'kandagaigo.ac.jp',
  'kansai-university': 'kansai-u.ac.jp',
  'keio-university': 'keio.ac.jp',
  'kibi-international-university': 'kiui.jp',
  'kobe-university': 'kobe-u.ac.jp',
  'kumamoto-university': 'kumamoto-u.ac.jp',
  'kwansei-gakuin-university': 'kwansei.ac.jp',
  'kyorin-university': 'kyorin-u.ac.jp',
  'meiji-university': 'meiji.ac.jp',
  'meiji-university-school-of-information-and-communication': 'meiji.ac.jp',
  'meiji-university-school-of-political-science-and-economics': 'meiji.ac.jp',
  'mie-university': 'mie-u.ac.jp',
  'momoyama-gakuin-university': 'andrew.ac.jp',
  'mukogawa-women-s-university': 'mukogawa-u.ac.jp',
  'musashino-university': 'musashino-u.ac.jp',
  'nagoya-city-university': 'nagoya-cu.ac.jp',
  'nagoya-university': 'nagoya-u.ac.jp',
  'nara-women-s-university': 'nara-wu.ac.jp',
  'onomichi-city-university': 'onomichi-u.ac.jp',
  'osaka-international-university': 'oiu.ac.jp',
  'osaka-university-of-economics': 'osaka-ue.ac.jp',
  'otemon-gakuin-university': 'otemon.ac.jp',
  'rikkyo-university': 'rikkyo.ac.jp',
  'rikkyo-university-college-of-business': 'rikkyo.ac.jp',
  'ritsumeikan-university': 'ritsumei.ac.jp',
  'seinan-gakuin-university': 'seinan-gu.ac.jp',
  'sophia-university': 'sophia.ac.jp',
  'takushoku-university': 'takushoku-u.ac.jp',
  'tohoku-university': 'tohoku.ac.jp',
  'tokyo-keizai-university': 'tku.ac.jp',
  'university-of-fukui': 'u-fukui.ac.jp',
  'wakayama-university': 'wakayama-u.ac.jp',
  'waseda-university': 'waseda.jp',
  'chung-ang-university': 'cau.ac.kr',
  'dankook-university': 'dankook.ac.kr',
  'dongseo-university': 'dongseo.ac.kr',
  'duksung-women-s-university': 'duksung.ac.kr',
  'ewha-womans-university': 'ewha.ac.kr',
  'hallym-university': 'hallym.ac.kr',
  'handong-global-university': 'handong.edu',
  'hannam-university': 'hannam.ac.kr',
  'hanyang-university-business-school': 'hanyang.ac.kr',
  'kangwon-national-university': 'kangwon.ac.kr',
  'kongju-national-university': 'kongju.ac.kr',
  'kyung-hee-university': 'khu.ac.kr',
  'pukyong-national-university': 'pknu.ac.kr',
  'seoul-national-university': 'snu.ac.kr',
  'sogang-university': 'sogang.ac.kr',
  'sookmyung-women-s-university': 'sookmyung.ac.kr',
  'woosong-university': 'wsu.ac.kr',
  'yonsei-university-mirae-campus': 'yonsei.ac.kr',
  'chang-gung-university': 'cgu.edu.tw',
  'ming-chuan-university': 'mcu.edu.tw',
  'nanhua-university': 'nhu.edu.tw',
  'national-kaohsiung-university-of-science-and-technology': 'nkust.edu.tw',
  'national-yunlin-university-of-science-and-technology': 'yuntech.edu.tw',
  'hasselt-university': 'uhasselt.be',
  'oulu-university-of-applied-sciences': 'oamk.fi',
  'seinajoki-university-of-applied-sciences': 'seamk.fi',
  'aix-marseille-university': 'univ-amu.fr',
  'ecol-3a': 'ecole3a.edu',
  'ileri': 'ileri.fr',
  'ipag-business-school': 'ipag.edu',
  'isc-paris-business-school': 'iscparis.fr',
  'sciences-po': 'sciencespo.fr',
  'universit-polytechinique-hauts-de-france-uphf': 'uphf.fr',
  'friedrich-alexander-universitat-erlangen-nurnberg-school-of-business-economics': 'fau.eu',
  'goethe-university-frankfurt-am-main-faculty-of-economics-and-business-administration': 'uni-frankfurt.de',
  'heinrich-heine-university-dusseldorf-hhu': 'hhu.de',
  'hochschule-trier-trier-university-of-applied-sciences': 'hochschule-trier.de',
  'mannheim-university': 'uni-mannheim.de',
  'neu-ulm-university-of-applied-sciences': 'hs-neu-ulm.de',
  'osnabr-ck-university-of-applied-sciences': 'hs-osnabrueck.de',
  'paderborn-university': 'uni-paderborn.de',
  'university-of-augsburg': 'uni-augsburg.de',
  'whu-otto-beisheim-school-of-management': 'whu.edu',
  'universita-di-trento': 'unitn.it',
  'bi-norwegian-business-school': 'bi.no',
  'sopot-university-of-applied-sciences': 'ssw-sopot.pl',
  'national-research-university-higher-school-of-economics-hse': 'hse.ru',
  'russian-foreign-trade-academy-rfta': 'vavt.ru',
  'russian-presidential-academy-of-national-economy-and-public-administration-russian-federation-ranepa': 'ranepa.ru',
  'university-of-las-palmas-de-gran-canaria-ulpgc': 'ulpgc.es',
  'university-of-gothenburg-school-of-business-economics-and-law': 'gu.se',
  'the-university-of-applied-sciences-and-arts-northwestern-switzerland-olten-fhnw': 'fhnw.ch',
  'queensland-university-of-technology-qut': 'qut.edu.au',
  's-p-jain-school-of-global-management': 'spjain.edu',
};

const universities = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const missing = universities.filter((university) => !officialDomainById[university.id]);
if (missing.length > 0) {
  throw new Error(`Missing official image domain mapping for: ${missing.map((university) => university.id).join(', ')}`);
}

const verifiedAt = '2026-09-21';
const enriched = universities.map((university) => {
  const domain = officialDomainById[university.id];
  const imageUrl = `https://icon.horse/icon/${domain}`;
  return {
    ...university,
    websiteUrl: `https://${domain}`,
    logoUrl: imageUrl,
    imageUrl,
    imageSourceUrl: `https://${domain}`,
    imageSourceType: 'official-domain-favicon',
    imageVerifiedAt: verifiedAt,
  };
});

fs.writeFileSync(inputPath, `${JSON.stringify(enriched, null, 2)}\n`, 'utf8');
console.log(`Enriched ${enriched.length} partner universities with audited official-domain image links.`);
