// One-time migration: seeds Sanity with the current static SERIES data
// (src/app/data/series.data.ts) and the sample images already dropped into
// public/images/<slug>/NN.png. Safe to re-run — it purges prior seeded
// documents first so it doesn't create duplicates.
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const { key: token } = JSON.parse(readFileSync('/tmp/sanity-token.json', 'utf8'));

const client = createClient({
  projectId: 'xdoaimqw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

const SERIES = [
  {
    slug: 'interior-weather',
    title: 'Interior Weather',
    year: '2023–24',
    medium: 'Archival pigment print',
    note: 'Portraits made in the hour before something is decided. The sitter is asked only to stay.',
    plates: [
      { index: 1, title: 'Untitled (Interior Weather, I)', dimensions: '40 × 50 cm', edition: '1/7' },
      { index: 2, title: 'Untitled (Interior Weather, II)', dimensions: '40 × 50 cm', edition: '1/7' },
      { index: 3, title: 'Untitled (Interior Weather, III)', dimensions: '60 × 75 cm', edition: '2/7' },
      { index: 4, title: 'Untitled (Interior Weather, IV)', dimensions: '40 × 50 cm', edition: '1/7' },
      { index: 5, title: 'Untitled (Interior Weather, V)', dimensions: '60 × 75 cm', edition: '3/7' },
    ],
  },
  {
    slug: 'names-we-dont-say',
    title: 'Names We Don’t Say',
    year: '2022',
    medium: 'Gelatin silver print',
    note: 'A study of the face when the name attached to it is withheld from the frame.',
    plates: [
      { index: 1, title: 'Names We Don’t Say, Plate I', dimensions: '30 × 40 cm', edition: '2/10' },
      { index: 2, title: 'Names We Don’t Say, Plate II', dimensions: '30 × 40 cm', edition: '4/10' },
      { index: 3, title: 'Names We Don’t Say, Plate III', dimensions: '50 × 60 cm', edition: '1/10' },
      { index: 4, title: 'Names We Don’t Say, Plate IV', dimensions: '30 × 40 cm', edition: '6/10' },
    ],
  },
  {
    slug: 'the-long-look',
    title: 'The Long Look',
    year: '2021',
    medium: 'Archival pigment print, extended exposure',
    note: 'Each sitting ran past the point of composure. What remains is what the body couldn’t hold.',
    plates: [
      { index: 1, title: 'The Long Look, I', dimensions: '70 × 90 cm', edition: '1/5' },
      { index: 2, title: 'The Long Look, II', dimensions: '70 × 90 cm', edition: '2/5' },
      { index: 3, title: 'The Long Look, III', dimensions: '45 × 55 cm', edition: '1/5' },
    ],
  },
  {
    slug: 'provisional-selves',
    title: 'Provisional Selves',
    year: '2024–ongoing',
    medium: 'Archival pigment print',
    note: 'An open series on identity mid-revision — the same six sitters, returned to yearly.',
    plates: [
      { index: 1, title: 'Provisional Selves, I', dimensions: '40 × 50 cm', edition: 'AP' },
      { index: 2, title: 'Provisional Selves, II', dimensions: '40 × 50 cm', edition: 'AP' },
      { index: 3, title: 'Provisional Selves, III', dimensions: '60 × 75 cm', edition: 'AP' },
      { index: 4, title: 'Provisional Selves, IV', dimensions: '40 × 50 cm', edition: 'AP' },
    ],
  },
];

async function purgePrior() {
  const all = await client.fetch(`*[_type in ["group","series"]]{_id}`);
  if (all.length) {
    console.log(`Purging ${all.length} previously seeded documents...`);
    const tx = client.transaction();
    for (const doc of all) tx.delete(doc._id);
    await tx.commit();
  }
}

async function uploadPlateImage(slug, index) {
  const filePath = path.join(
    repoRoot,
    'public/images',
    slug,
    `${String(index).padStart(2, '0')}.png`,
  );
  const buffer = readFileSync(filePath);
  const asset = await client.assets.upload('image', buffer, {
    filename: `${slug}-${String(index).padStart(2, '0')}.png`,
  });
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
}

async function run() {
  await purgePrior();

  const seriesRefs = [];

  for (const s of SERIES) {
    console.log(`Uploading images + creating series: ${s.title}`);
    const plates = [];
    for (const p of s.plates) {
      const image = await uploadPlateImage(s.slug, p.index);
      plates.push({
        _key: `plate-${p.index}`,
        image,
        title: p.title,
        dimensions: p.dimensions,
        edition: p.edition,
      });
    }

    const doc = await client.create({
      _type: 'series',
      title: s.title,
      slug: { _type: 'slug', current: s.slug },
      year: s.year,
      medium: s.medium,
      note: s.note,
      plates,
    });
    seriesRefs.push(doc._id);
  }

  console.log('Creating root group...');
  await client.create({
    _type: 'group',
    title: 'Projects',
    isRoot: true,
    children: seriesRefs.map((id, i) => ({
      _key: `child-${i}`,
      _type: 'reference',
      _ref: id,
    })),
  });

  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
