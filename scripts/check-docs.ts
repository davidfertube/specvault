#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📚 Indexed Documents:\n');
  if (data.length === 0) {
    console.log('No documents found.');
  } else {
    // Show first doc to see schema
    console.log('Schema:', Object.keys(data[0]));
    data.forEach((doc, i) => {
      const docName = doc.filename || doc.name || doc.title || 'Unknown';
      const statusIcon = doc.status === 'indexed' ? '✅' : doc.status === 'processing' ? '⏳' : '❓';
      console.log(`${i + 1}. ${statusIcon} ${docName} [${doc.status}]`);
    });
    console.log(`\nTotal: ${data.length} documents`);
  }
}

main();
