#!/usr/bin/env tsx
/**
 * Cleanup duplicates and identify missing documents
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Documents we need for testing
const TEST_DOCS = [
  '897102004-ASTM-A790-A790M-24.pdf',
  '877794297-A312-A312M-25.pdf',
  'ASTM A789 Seamless & Welded Duplex Stainless Steel Tubing 2013.pdf',
  'ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf',
  'ASTM A790 Seamless & Welded Duplex Pipe 2014.pdf',
  'ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf',
  'ASTM A872 Centrifugally Cast Duplex Stainless Steel Pipe 2014.pdf',
  'ASTM A1049 Duplex Stainless Steel Forgings For Pressure Vessels R 2015.pdf',
  'API Spec 5CT Purchasing Guidelines 9th Edition 2012-04.pdf',
  'API Spec 6A Wellhead & Xmas Tree Equipment 20th Edition Errata At 2016.pdf',
  'API Spec 16C Choke & Kill Systems 1993.pdf',
];

async function analyze() {
  console.log('=== DOCUMENT ANALYSIS ===\n');

  // Get all documents
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, filename, status, created_at')
    .order('filename', { ascending: true });

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  // Group by filename
  const byFilename = new Map<string, typeof docs>();
  docs?.forEach(doc => {
    const existing = byFilename.get(doc.filename) || [];
    existing.push(doc);
    byFilename.set(doc.filename, existing);
  });

  // Find duplicates to delete
  const toDelete: string[] = [];
  const indexed: string[] = [];

  console.log('📋 DOCUMENTS WITH DUPLICATES:\n');
  byFilename.forEach((entries, filename) => {
    if (entries.length > 1) {
      console.log(`${filename}:`);
      const hasIndexed = entries.some(e => e.status === 'indexed');
      entries.forEach(e => {
        const marker = e.status === 'indexed' ? '✅' : '❌';
        console.log(`  ${marker} [${e.status}] id: ${e.id}`);
        if (e.status !== 'indexed' && hasIndexed) {
          toDelete.push(e.id);
        }
      });
      if (hasIndexed) indexed.push(filename);
    } else if (entries[0].status === 'indexed') {
      indexed.push(filename);
    }
  });

  console.log('\n📦 IDS TO DELETE (duplicates with error/uploading status):');
  console.log(toDelete.join('\n') || 'None');

  console.log('\n✅ INDEXED DOCUMENTS:');
  indexed.forEach(f => console.log(`  - ${f}`));

  console.log('\n❌ MISSING DOCUMENTS (need to upload):');
  TEST_DOCS.forEach(doc => {
    if (!indexed.includes(doc)) {
      const pdfPath = path.join('tests/stress/real-pdfs', doc);
      const exists = fs.existsSync(pdfPath);
      console.log(`  - ${doc} ${exists ? '(file exists)' : '(FILE NOT FOUND)'}`);
    }
  });

  // Count chunks per document
  console.log('\n📊 CHUNKS PER INDEXED DOCUMENT:');
  for (const filename of indexed) {
    const docEntry = docs?.find(d => d.filename === filename && d.status === 'indexed');
    if (docEntry) {
      const { count } = await supabase
        .from('chunks')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', docEntry.id);
      console.log(`  ${filename}: ${count} chunks`);
    }
  }
}

analyze();
