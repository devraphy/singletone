// One-time migration: seeds Sanity with `page` docs for Statement and Contact,
// replacing the hardcoded content in those Angular components. Safe to re-run —
// purges prior `page` docs first so it doesn't create duplicates.
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';

const { key: token } = JSON.parse(readFileSync('/tmp/sanity-token.json', 'utf8'));

const client = createClient({
  projectId: 'xdoaimqw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

function paragraph(text, key) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}-span`, text, marks: [] }],
  };
}

const STATEMENT_BODY = [
  paragraph(
    "I photograph people at the point where composure runs out. A portrait, made well, is not a likeness — it's a record of the sitter deciding, for the length of an exposure, not to perform.",
    'lede',
  ),
  paragraph(
    "My sittings run long by design. I ask for stillness far past the point where a face can hold an expression on purpose, and I photograph what's left once it can't. The work moves between series rather than single images — each body of work is a single question asked of a small group of people, over months or years, until the question changes.",
    'body-1',
  ),
  paragraph(
    'Prints are made in limited, numbered editions. I consider the print itself — its size, its paper, its place on a wall — part of the work, not a delivery format for it.',
    'body-2',
  ),
];

const EXHIBITIONS = [
  { year: '2024', title: 'Provisional Selves (solo)', venue: 'Gallery Seolhwa, Seoul' },
  { year: '2023', title: 'Interior Weather (solo)', venue: 'Studio 9, Busan' },
  { year: '2022', title: 'What the Frame Withholds (group)', venue: 'Daegu Photo Biennale' },
  { year: '2021', title: 'The Long Look (solo)', venue: 'Room 402, Seoul' },
  { year: '2020', title: 'New Portraiture (group)', venue: 'Incheon Art Platform' },
];

const CONTACT_LINKS = [
  {
    label: 'Email',
    value: 'singletonepics@gmail.com',
    url: 'mailto:singletonepics@gmail.com',
  },
  {
    label: 'Instagram',
    value: '@singletone_portrait',
    url: 'https://www.instagram.com/singletone_portrait/',
  },
  {
    label: 'Untitled Before',
    value: '@untitled.before',
    url: 'https://www.instagram.com/untitled.before/',
    note: 'A community I host',
  },
];

const PAGES = [
  {
    menuLabel: 'Statement',
    slug: 'statement',
    order: 10,
    body: STATEMENT_BODY,
    exhibitions: EXHIBITIONS,
  },
  {
    menuLabel: 'Contact',
    slug: 'contact',
    order: 20,
    links: CONTACT_LINKS,
    location: 'Based in Seoul, South Korea.',
  },
];

async function purgePrior() {
  const all = await client.fetch(`*[_type == "page"]{_id}`);
  if (all.length) {
    console.log(`Purging ${all.length} previously seeded page docs...`);
    const tx = client.transaction();
    for (const doc of all) tx.delete(doc._id);
    await tx.commit();
  }
}

async function run() {
  await purgePrior();

  for (const p of PAGES) {
    console.log(`Creating page: ${p.menuLabel}`);
    await client.create({
      _type: 'page',
      menuLabel: p.menuLabel,
      slug: { _type: 'slug', current: p.slug },
      order: p.order,
      showInNav: true,
      ...(p.body ? { body: p.body } : {}),
      ...(p.exhibitions
        ? {
            exhibitions: p.exhibitions.map((e, i) => ({
              _key: `ex-${i}`,
              ...e,
            })),
          }
        : {}),
      ...(p.links
        ? {
            links: p.links.map((l, i) => ({
              _key: `link-${i}`,
              ...l,
            })),
          }
        : {}),
      ...(p.location ? { location: p.location } : {}),
    });
  }

  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
