import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openAIApiKey = process.env.OPENAI_API_KEY!

if (!supabaseUrl || !supabaseServiceKey || !openAIApiKey) {
  console.error('Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openAIApiKey })

async function generateEmbedding(text: string) {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return res.data[0].embedding
}

async function processTable(table: 'cabin_documents' | 'inventory_items', textColumn: string) {
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${textColumn}`)
    .is('vector', null)

  if (error) {
    console.error(`Error fetching ${table}:`, error)
    return
  }

  for (const row of data) {
    try {
      const embedding = await generateEmbedding(row[textColumn])
      await supabase.from(table).update({ vector: embedding }).eq('id', row.id)
      console.log(`Updated embedding for ${table} id ${row.id}`)
    } catch (err) {
      console.error('Embedding error:', err)
    }
  }
}

async function run() {
  await processTable('cabin_documents', 'content')
  await processTable('inventory_items', 'description')
}

run()
