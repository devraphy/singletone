// One-time seed: creates a root noteGroup plus a few sample `note` docs for
// the new Notes menu. Safe to re-run — purges prior `noteGroup`/`note` docs
// first so it doesn't create duplicates.
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

const NOTES = [
  {
    title: 'Why the sittings run long',
    date: '2026-07-20',
    excerpt:
      'A short note on why I stopped setting time limits for sittings, and what changed in the work once I did.',
    body: [
      paragraph(
        "Early on I gave every sitting a fixed hour. It felt professional — respectful of people's time. But the work from that period looks like what it is: composed, held, performed.",
        'p1',
      ),
      paragraph(
        "I dropped the clock about two years ago. Sittings now run until the sitter stops managing their face, however long that takes. Some are done in twenty minutes. One ran past four hours. There's no way to predict it, and I've stopped trying to.",
        'p2',
      ),
    ],
  },
  {
    title: 'Print testing for Provisional Selves',
    date: '2026-06-02',
    excerpt: 'Notes from a week of proofing prints at three different papers before committing to an edition.',
    body: [
      paragraph(
        "Tested the Provisional Selves plates on three archival papers this week. The cotton rag holds the shadow detail I wanted, but it flattens the warmer skin tones more than I'd like next to the platinum-toned proofs.",
        'p1',
      ),
      paragraph(
        "Going with the cotton rag anyway — consistency across the whole series matters more than any single plate looking its absolute best. Committing to 40 × 50 cm as the standard size for this one.",
        'p2',
      ),
    ],
  },
  {
    title: 'A note on withheld names',
    date: '2026-04-14',
    excerpt: 'Some background on the decision behind Names We Don’t Say, for anyone who asks.',
    body: [
      paragraph(
        "People ask fairly often why none of the sitters in Names We Don't Say are identified, even in private. It wasn't a concept decided in advance — it came out of the first sitting, where naming the sitter in my notes felt like it was pulling the image back toward a specific story instead of a shared one.",
        'p1',
      ),
      paragraph(
        'So the rule became: no names anywhere in my own records either, not just the wall text. It changes how I look at the contact sheets, too.',
        'p2',
      ),
    ],
  },
];

async function purgePrior() {
  const all = await client.fetch(`*[_type in ["noteGroup","note"]]{_id}`);
  if (all.length) {
    console.log(`Purging ${all.length} previously seeded noteGroup/note docs...`);
    const tx = client.transaction();
    for (const doc of all) tx.delete(doc._id);
    await tx.commit();
  }
}

async function run() {
  await purgePrior();

  const noteRefs = [];

  for (const n of NOTES) {
    console.log(`Creating note: ${n.title}`);
    const doc = await client.create({
      _type: 'note',
      title: n.title,
      slug: { _type: 'slug', current: n.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') },
      date: n.date,
      excerpt: n.excerpt,
      body: n.body,
    });
    noteRefs.push(doc._id);
  }

  console.log('Creating root note group...');
  await client.create({
    _type: 'noteGroup',
    title: 'Notes',
    isRoot: true,
    children: noteRefs.map((id, i) => ({
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
