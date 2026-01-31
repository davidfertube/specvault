#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function checkDocs() {
  // Get all documents
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, filename, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('=== INDEXED DOCUMENTS IN SUPABASE ===');
  console.log('Total documents:', docs?.length || 0);
  console.log('');

  docs?.forEach(doc => {
    console.log(`[${doc.status}] ${doc.filename}`);
  });

  // Check chunk counts
  const { count } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true });

  console.log('');
  console.log(`Total chunks: ${count}`);
}

checkDocs();
