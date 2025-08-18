
import 'https://deno.land/x/xhr@0.1.0/mod.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'npm:openai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { LocationForecast } from '../../../src/types/weather.types';
import {
  transformWeatherData,
  getConditionFromSymbol,
  getWindDirection,
  getÅrstid,
  type WeatherData,
} from './utils.ts'
import { corsHeaders } from '../common/cors.ts';

const WEATHER_LAT = parseFloat(Deno.env.get('WEATHER_LAT') ?? '59.8726')
const WEATHER_LON = parseFloat(Deno.env.get('WEATHER_LON') ?? '8.6475')
const WEATHER_DATASET = Deno.env.get('WEATHER_DATASET') ?? 'compact'
const CONTACT_EMAIL = Deno.env.get('CONTACT_EMAIL') ?? 'contact@gaustablikk.no'
const SEARCH_API_KEY = Deno.env.get('SEARCH_API_KEY')
const SEARCH_API_URL = Deno.env.get('SEARCH_API_URL') ?? 'https://api.bing.microsoft.com/v7.0/search'

let weatherCache: { data: WeatherData | null; timestamp: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface WebSearchResult {
  name: string;
  url: string;
  snippet: string;
}

interface HistoryMessage {
  role: string;
  content: string;
}

async function fetchSunTimes(date: string): Promise<{ sunrise: string; sunset: string } | null> {
  try {
    const url = `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${WEATHER_LAT}&lon=${WEATHER_LON}&date=${date}&offset=+00:00`;
    const res = await fetch(url, {
      headers: { 'User-Agent': `Gaustablikk-Hytte-App/1.0 (${CONTACT_EMAIL})` },
    });
    if (!res.ok) {
      console.error('Failed to fetch sun times', res.status);
      return null;
    }
    const data = await res.json();
    const first = data?.location?.time?.[0];
    const sunrise = first?.sunrise?.time;
    const sunset = first?.sunset?.time;
    if (!sunrise || !sunset) return null;
    return { sunrise, sunset };
  } catch (e) {
    console.error('Error fetching sun times:', e);
    return null;
  }
}

async function fetchWeatherData(): Promise<WeatherData | null> {
  try {
    const now = Date.now();
    if (weatherCache && now - weatherCache.timestamp < CACHE_TTL_MS) {
      return weatherCache.data;
    }

    const YR_API_BASE =
      `https://api.met.no/weatherapi/locationforecast/2.0/${WEATHER_DATASET}`;

    const response = await fetch(
      `${YR_API_BASE}?lat=${WEATHER_LAT}&lon=${WEATHER_LON}`,
      {
        headers: {
          'User-Agent': `Gaustablikk-Hytte-App/1.0 (${CONTACT_EMAIL})`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch weather data:', response.status);
      return null;
    }

    const data: LocationForecast = await response.json();
    const transformed = transformWeatherData(data);

    const sunTimes = await fetchSunTimes(transformed.lastUpdated.split('T')[0]);
    if (sunTimes) {
      transformed.sunrise = sunTimes.sunrise;
      transformed.sunset = sunTimes.sunset;
    }

    weatherCache = { data: transformed, timestamp: now };
    return transformed;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

// Function to extract detailed description from AI reply
function extractDetailedDescriptionFromReply(reply: string): string | null {
  if (!reply) return null;
  
  // Look for patterns that indicate detailed item descriptions
  const lines = reply.split('\n');
  let description = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Look for lines that describe the item in detail
    if (line.includes('ser ut som') || line.includes('beskrive') || line.includes('identifiser') || 
        line.includes('gjenstanden') || line.includes('dette er') || line.includes('ser jeg')) {
      // Take this line and potentially the next few lines as description
      description = line;
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.includes('?') && nextLine.length > 10) {
          description += ' ' + nextLine;
        } else {
          break;
        }
      }
      break;
    }
  }
  
  // If no specific pattern found, use the first substantial sentence
  if (!description) {
    const sentences = reply.split('.').filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      description = sentences[0].trim() + '.';
    }
  }
  
  return description || null;
}

// Helper function to generate multiple search queries
function generateSearchQueries(originalQuery: string, currentTime: string): string[] {
  const queries = [originalQuery];
  
  // Synonym mapping for better search results
  const synonyms = {
    'gressklipper': ['kantklipper', 'gressklipping', 'plenklipper', 'hageutstyr', 'have', 'gress'],
    'kantklipper': ['gressklipper', 'kantklipping', 'gressklipping', 'hageutstyr', 'have'],
    'ryobi': ['batteri', 'elektrisk', 'klipper', 'verktøy'],
    'hageutstyr': ['gressklipper', 'kantklipper', 'have', 'gress', 'verktøy'],
    'gressklipping': ['gressklipper', 'kantklipper', 'klipping', 'have'],
    'klippere': ['klipper', 'gressklipper', 'kantklipper'],
    'slå gress': ['gressklipper', 'gressklipping', 'klipping', 'have'],
    'plen': ['gress', 'gressklipper', 'gressklipping', 'have'],
    'have': ['hageutstyr', 'gress', 'gressklipper', 'kantklipper'],
    'verktøy': ['utstyr', 'redskap', 'maskin'],
    'elektrisk': ['batteri', 'strøm', 'lading'],
    'batteri': ['elektrisk', 'lading', 'strøm', 'ryobi'],
    'oppbevaring': ['garasje', 'bod', 'lagring', 'plassering'],
    'garasje': ['oppbevaring', 'bod', 'lagring'],
    'vedlikehold': ['service', 'reparasjon', 'skjøtsel'],
    // Snø og vinterbegreper
    'snømåking': ['snøfjerning', 'snøfreser', 'snøskuffe', 'snøplog', 'snørydding', 'brøyting', 'vinter', 'snø'],
    'snøfjerning': ['snømåking', 'snøfreser', 'snøskuffe', 'snøplog', 'snørydding', 'brøyting', 'vinter', 'snø'],
    'snøfreser': ['snømåking', 'snøfjerning', 'snøskuffe', 'brøyting', 'vintermaskiner', 'snøutstyr', 'snø'],
    'snøskuffe': ['snømåking', 'snøfjerning', 'snøfreser', 'snørydding', 'snøutstyr', 'vinter', 'snø'],
    'snøplog': ['snømåking', 'snøfjerning', 'snøfreser', 'brøyting', 'snørydding', 'snø'],
    'snørydding': ['snømåking', 'snøfjerning', 'snøfreser', 'snøskuffe', 'brøyting', 'vinter', 'snø'],
    'brøyting': ['snømåking', 'snøfjerning', 'snøfreser', 'snørydding', 'vinter', 'snø'],
    'vintermaskiner': ['snøfreser', 'snøskuffe', 'snøutstyr', 'vinterutstyr', 'snømåking'],
    'snøutstyr': ['snøfreser', 'snøskuffe', 'vintermaskiner', 'vinterutstyr', 'snømåking'],
    'vinterutstyr': ['snøutstyr', 'vintermaskiner', 'snøfreser', 'snøskuffe', 'vinter'],
    'vinter': ['snø', 'snøfjerning', 'snømåking', 'vinterutstyr', 'frost', 'kulde'],
    'snø': ['snøfjerning', 'snømåking', 'snøfreser', 'snøskuffe', 'vinter', 'hvit', 'nedbør']
  };
  
  // Handle temporal references
  const timeReferences = {
    'i går': ['nylig', 'sist', 'forrige dag'],
    'igår': ['nylig', 'sist', 'forrige dag'],
    'yesterday': ['recent', 'latest', 'previous'],
    'nylig': ['i dag', 'sist'],
    'sist': ['forrige', 'nylig', 'igår'],
    'i dag': ['nå', 'dagens'],
    'idag': ['nå', 'dagens']
  };

  // Add synonym-based queries
  const queryLower = originalQuery.toLowerCase();
  for (const [term, relatedTerms] of Object.entries(synonyms)) {
    if (queryLower.includes(term)) {
      // Add queries with each related term
      for (const related of relatedTerms) {
        queries.push(related);
        // Also try replacing the original term with the related term
        const replacedQuery = queryLower.replace(term, related);
        queries.push(replacedQuery);
      }
    }
  }

  // Replace temporal references with alternatives
  for (const [temporal, alternatives] of Object.entries(timeReferences)) {
    if (originalQuery.toLowerCase().includes(temporal)) {
      for (const alt of alternatives) {
        const newQuery = originalQuery.toLowerCase().replace(temporal, alt);
        queries.push(newQuery);
      }
      // Also try without the temporal reference
      const withoutTemporal = originalQuery.toLowerCase().replace(temporal, '').trim();
      if (withoutTemporal.length > 0) {
        queries.push(withoutTemporal);
      }
    }
  }

  // Extract main topics and create focused queries
  const mainTopics = extractSearchTerms(originalQuery);
  for (const topic of mainTopics) {
    if (topic.length > 3) {
      queries.push(topic);
      // Also add synonyms for individual terms
      if (synonyms[topic]) {
        queries.push(...synonyms[topic]);
      }
    }
  }

  // Remove duplicates and empty strings
  return [...new Set(queries.filter(q => q.trim().length > 0))];
}

// Helper function to extract key search terms
function extractSearchTerms(query: string): string[] {
  // Common Norwegian stop words to filter out
  const stopWords = ['og', 'i', 'på', 'er', 'til', 'av', 'for', 'med', 'det', 'en', 'et', 'som', 'den', 'de', 'har', 'ikke', 'kan', 'skal', 'vil', 'å', 'om', 'fra', 'ved', 'var', 'blir', 'hvis', 'når', 'hvor', 'hvorfor', 'hvordan', 'hva', 'hvem'];
  
  const words = query.toLowerCase()
    .replace(/[^\wæøå\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  return words;
}

async function fetchWebResults(query: string) {
  if (!SEARCH_API_KEY) {
    console.log('SEARCH_API_KEY not set, skipping web search');
    return [];
  }
  try {
    const url = `${SEARCH_API_URL}?q=${encodeURIComponent(query)}&count=3`;
    const res = await fetch(url, {
      headers: { 'Ocp-Apim-Subscription-Key': SEARCH_API_KEY }
    });
    if (!res.ok) {
      console.error('Web search error', await res.text());
      return [];
    }
    const data = await res.json();
    return data.webPages?.value?.map((item: WebSearchResult) => ({
      title: item.name,
      url: item.url,
      snippet: item.snippet
    })) ?? [];
  } catch (err) {
    console.error('Error performing web search:', err);
    return [];
  }
}

serve(async (req) => {
  console.log('AI Helper Function started successfully');
  
  // Declare variables that will be used throughout the function
  let allRelevantDocs = [];
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not set in Supabase secrets');
      return new Response(JSON.stringify({ error: 'OpenAI API-nøkkel er ikke konfigurert. Vennligst kontakt administrator.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const openai = new OpenAI({ apiKey: openAIApiKey });
    
    const { history, image } = await req.json();
    if (!history || !Array.isArray(history) || history.length === 0) {
      return new Response(JSON.stringify({ error: 'History is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create Supabase client with user token when provided, otherwise fall back
    // to service role for internal lookups
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY')
    const authHeader = req.headers.get('Authorization')

    const supabaseClient = authHeader
      ? createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
      : createClient(supabaseUrl, serviceKey!)

    // Get user profile and family for personalization
    let userContext = "";
    if (authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          // Fetch user profile
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('first_name, last_name, gender, birth_date')
            .eq('id', user.id)
            .single();

          // Fetch family members
          const { data: familyMembers } = await supabaseClient
            .from('family_members')
            .select('name, nickname, role, birth_date, is_user, linked_user_id')
            .eq('user_id', user.id);

          if (profile) {
            const age = profile.birth_date 
              ? Math.floor((new Date().getTime() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : null;

            // Determine user's role in family
            let userRole = 'bruker';
            let familyContext = '';
            
            if (familyMembers && familyMembers.length > 0) {
              // Find current user in family members
              const currentUserMember = familyMembers.find(member => 
                member.linked_user_id === user.id || member.is_user
              );
              
              if (currentUserMember?.role) {
                userRole = currentUserMember.role === 'parent' ? 'forelder' : 
                          currentUserMember.role === 'child' ? 'barn' : 
                          currentUserMember.role;
              }

              // Build family context
              const parents = familyMembers.filter(member => member.role === 'parent');
              const children = familyMembers.filter(member => member.role === 'child');
              const others = familyMembers.filter(member => member.role === 'other' || !member.role);

              familyContext = `
**FAMILIEKONTEKST:**
- Din rolle i familien: ${userRole}
${parents.length > 0 ? `- Foreldre: ${parents.map(p => p.nickname || p.name).join(', ')}` : ''}
${children.length > 0 ? `- Barn: ${children.map(c => c.nickname || c.name).join(', ')}` : ''}
${others.length > 0 ? `- Andre: ${others.map(o => o.nickname || o.name).join(', ')}` : ''}
              `.trim();
            }
            
            userContext = `
**BRUKERINFORMASJON:**
- Navn: ${profile.first_name || ''} ${profile.last_name || ''}
- Kjønn: ${profile.gender || 'Ikke oppgitt'}
- Alder: ${age ? `${age} år` : 'Ikke oppgitt'}
- Rolle i familien: ${userRole}

${familyContext}

**PERSONALISERING REGLER:**
1. **Kjønnsspesifikke råd:** Når du gir råd om klær, utstyr eller aktiviteter, tilpass til brukerens kjønn og alder
2. **Familieroller:** Forstå brukerens posisjon i familien - ikke foreslå "mors klær" til en sønn eller "fars utstyr" til en datter
3. **Alderstilpassede råd:** Gi råd som passer brukerens alder og aktivitetsnivå
4. **Smart familieforståelse:** Når du anbefaler ting, tenk på hvem i familien som ville brukt det
5. **Personlige anbefalinger:** Basert på brukerens profil, gi spesifikke og relevante forslag

**EKSEMPLER PÅ RIKTIG PERSONALISERING:**
- Hvis bruker er mann, anbefal herreklær og herrestørrelser
- Hvis bruker er barn, anbefal barneklær og aktiviteter tilpasset alder
- Hvis bruker er forelder, gi råd som passer en voksen med familieansvar
- Aldri bland familiemedlemmers klær eller utstyr i anbefalinger
            `.trim();
          }
        }
      } catch (error) {
        console.error('Error fetching user profile and family:', error);
      }
    }

    // Get current date and time information
    const now = new Date();
    const norskTid = new Intl.DateTimeFormat('no-NO', {
      timeZone: 'Europe/Oslo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const årstid = getÅrstid(now.getMonth());
    const månedsnavn = now.toLocaleDateString('no-NO', { month: 'long' });

    // Get weather data
    let weatherContext = "Værdata er for øyeblikket ikke tilgjengelig.";
    try {
      const weatherData = await fetchWeatherData();
      if (weatherData) {
        weatherContext = `
**Nåværende værforhold for ${weatherData.location}:**
- Temperatur: ${weatherData.current.temperature}°C
- Forhold: ${weatherData.current.condition}
- Fuktighet: ${weatherData.current.humidity}%
- Vind: ${weatherData.current.windSpeed} m/s fra ${weatherData.current.windDirection}
- Soloppgang: ${weatherData.sunrise ? new Date(weatherData.sunrise).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) : 'Ukjent'}
- Solnedgang: ${weatherData.sunset ? new Date(weatherData.sunset).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }) : 'Ukjent'}

**Værprognose for de neste dagene:**
${weatherData.forecast.map(day => `
- **${day.day}** (${day.date}): ${day.temperature.min}°-${day.temperature.max}°C, ${day.condition}
  Nedbør: ${day.precipitation}mm, Vind: ${day.windSpeed} m/s
`).join('')}

*Værdata sist oppdatert: ${new Date(weatherData.lastUpdated).toLocaleString('no-NO')}*
        `.trim();
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }

    // Get the latest user message to search for relevant documents
    const latestUserMessage = history[history.length - 1];
    const userQuery = latestUserMessage?.content || '';

    // Optional web search for additional context
    let searchContext = '';
    try {
      const results = await fetchWebResults(userQuery);
      if (results.length > 0) {
        searchContext = `\n**Nettresultater:**\n${results.map(r => `- ${r.title} (${r.url})\n  ${r.snippet}`).join('\n')}`;
      }
    } catch (error) {
      console.error('Error fetching web results:', error);
    }

    // Enhanced document search with multiple strategies
    let documentContext = "Ingen relevante dokumenter funnet.";
    try {
      // Generate multiple search queries for better results
      const searchQueries = generateSearchQueries(userQuery, norskTid);

      // Search with each query
      for (const query of searchQueries) {
        const { data: docs, error: docsError } = await supabaseClient
          .rpc('search_cabin_documents', { search_query: query })
          .limit(5);

        if (!docsError && docs && docs.length > 0) {
          // Add unique documents to our collection
          for (const doc of docs) {
            if (!allRelevantDocs.find(d => d.id === doc.id)) {
              allRelevantDocs.push(doc);
            }
          }
        }
      }

      // If still no results, try broader searches with individual terms
      if (allRelevantDocs.length === 0) {
        // Try searching with just individual keywords
        const keywords = extractSearchTerms(userQuery);
        for (const keyword of keywords) {
          const { data: keywordDocs, error: keywordError } = await supabaseClient
            .from('cabin_documents')
            .select('*')
            .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%,summary.ilike.%${keyword}%,tags.cs.{${keyword}}`)
            .limit(3);

          if (!keywordError && keywordDocs) {
            for (const doc of keywordDocs) {
              if (!allRelevantDocs.find(d => d.id === doc.id)) {
                allRelevantDocs.push(doc);
              }
            }
          }
        }
      }

      // If still no results, try a more general search approach
      if (allRelevantDocs.length === 0) {
        const { data: generalDocs, error: generalError } = await supabaseClient
          .from('cabin_documents')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!generalError && generalDocs) {
          // Filter by content relevance manually
          allRelevantDocs = generalDocs.filter(doc => {
            const searchTerms = extractSearchTerms(userQuery);
            const docText = `${doc.title} ${doc.category} ${doc.content || ''} ${doc.summary || ''} ${(doc.tags || []).join(' ')}`.toLowerCase();
            return searchTerms.some(term => docText.includes(term.toLowerCase()));
          });
        }
      }

      // Enrich documents with image descriptions
      for (const doc of allRelevantDocs) {
        const { data: images, error: imageError } = await supabaseClient
          .from('document_images')
          .select('description')
          .eq('document_id', doc.id)
          .not('description', 'is', null);

        if (!imageError && images && images.length > 0) {
          const imageDescriptions = images
            .filter(img => img.description)
            .map(img => img.description)
            .join('. ');
          
          if (imageDescriptions) {
            doc.image_descriptions = imageDescriptions;
          }
        }
      }

      if (allRelevantDocs.length > 0) {
        // Sort by relevance and take top 4
        const topDocs = allRelevantDocs.slice(0, 4);
        
        documentContext = `
**Relevante hytte-dokumenter:**
${topDocs.map(doc => {
  let docText = `**${doc.title}** (${doc.category})\n`;
  if (doc.summary) {
    docText += `Sammendrag: ${doc.summary}\n`;
  }
  if (doc.content) {
    // Limit content to first 2000 characters to avoid overwhelming the AI context
    const contentPreview = doc.content.length > 2000 
      ? doc.content.substring(0, 2000) + '...' 
      : doc.content;
    docText += `Innhold: ${contentPreview}\n`;
  }
  if (doc.image_descriptions) {
    docText += `Bildebeskrivelser: ${doc.image_descriptions}\n`;
  }
  if (doc.file_url) {
    docText += `[Se dokumentet](${doc.file_url})\n`;
  }
  return docText + '---';
}).join('\n')}
        `.trim();
      }
    } catch (error) {
      console.error('Error in document search:', error);
    }

    // Fetch comprehensive inventory data with images and family member info
    const { data: inventoryItems, error: inventoryError } = await supabaseClient
      .from('inventory_items')
      .select(`
        id,
        name,
        description,
        brand,
        color,
        location,
        shelf,
        size,
        owner,
        notes,
        category,
        subcategory,
        primary_location,
        created_at,
        family_member_id,
        item_images ( image_url ),
        family_members ( id, name, nickname )
      `)
      .order('created_at', { ascending: false })
      .limit(200);
      
    if (inventoryError) {
        console.error('Error fetching inventory for AI helper:', inventoryError);
    }

    // Categories and subcategories for AI context
    const categoryData = {
      'Klær': ['Skjørt', 'Kjole', 'Bukse', 'Shorts', 'Sokker', 'Undertøy', 'Topp', 'Genser', 'Jakke', 'Sko', 'Tilbehør'],
      'Sport': ['Langrennski', 'Langrennstaver', 'Alpint', 'Alpinstaver', 'Skisko', 'Bindinger', 'Hjelm', 'Briller', 'Hansker', 'Sportsbag', 'Annet sportsutstyr'],
      'Elektronikk': ['Telefon', 'Nettbrett', 'Laptop', 'Kamera', 'Høretelefoner', 'Ladere', 'Kabler', 'Annen elektronikk'],
      'Verktøy': ['Håndverktøy', 'Elektrisk verktøy', 'Måleverktøy', 'Hagearbeid', 'Annet verktøy'],
      'Bøker': ['Romaner', 'Fagbøker', 'Magasiner', 'Tegneserier', 'Annet lesestoff'],
      'Husstand': ['Kjøkkenutstyr', 'Rengjøring', 'Tekstiler', 'Dekorasjon', 'Annet husstand'],
      'Annet': []
    };

    // Get inventory context - only show search-relevant items
    let inventoryContext = "";
    if (inventoryItems && inventoryItems.length > 0) {
      console.log(`Found ${inventoryItems.length} inventory items`);
      
      // For now, just show a summary count by category (no detailed items)
      const categoryGroups: { [key: string]: number } = {};
      inventoryItems.forEach(item => {
        const category = item.category || 'Annet';
        categoryGroups[category] = (categoryGroups[category] || 0) + 1;
      });

      const categorySummary = Object.entries(categoryGroups)
        .map(([category, count]) => `${category}: ${count}`)
        .join(', ');

      inventoryContext = `Inventar (${inventoryItems.length} items): ${categorySummary}`;
    } else {
      inventoryContext = "Ingen inventar.";
    }

    // Slim system prompt - only role, format, and rules
    const systemPrompt = `Du er en hjelpsom AI-assistent for en hytte-app. 

ROLLE:
- Hjelp brukere med hytteadministrasjon, inventar, vær og aktiviteter
- Vær vennlig, praktisk og handlingsorientert
- Skriv på norsk

FORMAT:
- Gi korte, konkrete svar
- Foreslå relevante handlinger når mulig
- Hvis du får et bilde, analyser det og foreslå handlinger

FOKUSOMRÅDER:
1. Bookinger og sjekklister
2. Inventarstyring  
3. Værbaserte aktivitetsforslag
4. Dokumenthjelp
5. Vinkjeller

Bruk konteksten som følger for å gi personlige, relevante svar.`;

    // Process documents from the earlier search
    let processedDocumentContext = "";
    if (allRelevantDocs && allRelevantDocs.length > 0) {
      console.log(`Found ${allRelevantDocs.length} relevant documents`);
      
      // Limit to max 2 documents and 500 chars each
      const limitedDocs = allRelevantDocs.slice(0, 2);
      processedDocumentContext = `Dokumenter:
${limitedDocs.map((doc, index) => {
        const preview = doc.summary || (doc.content ? doc.content.substring(0, 500) : '');
        return `${index + 1}. ${doc.title}: ${preview}${preview.length > 500 ? '...' : ''}`;
      }).join('\n')}`;
    } else {
      processedDocumentContext = "Ingen dokumenter funnet.";
    }

    // Get user profile info
    let profile: any = null;
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        profile = profileData;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }

    // Get weather data
    const weatherData = await fetchWeatherData();

    // Context as separate message - only when relevant
    const contextMessage = [];
    if (weatherData || documentContext !== "Ingen dokumenter funnet." || inventoryContext !== "Ingen inventar.") {
      const contextParts = [];
      
      if (weatherData) {
        contextParts.push(`Vær: ${weatherData.current.condition} ${weatherData.current.temperature}°C`);
      }
      
      if (processedDocumentContext !== "Ingen dokumenter funnet.") {
        contextParts.push(processedDocumentContext);
      }
      
      if (inventoryContext !== "Ingen inventar.") {
        contextParts.push(inventoryContext);
      }
      
      if (profile?.first_name) {
        contextParts.push(`Bruker: ${profile.first_name} ${profile.last_name || ''}`);
      }
      
      if (contextParts.length > 0) {
        contextMessage.push({
          role: 'user' as const,
          content: `Kontekst:\n${contextParts.join('\n')}`
        });
      }
    }

    // Prepare messages with optional image
    const messages = [
      { role: 'system', content: systemPrompt },
      ...contextMessage,
      ...history.map((msg: HistoryMessage) => {
        if (msg.role === 'user' && image && msg === history[history.length - 1]) {
          // Add image to the last user message
          return {
            role: 'user',
            content: [
              { type: 'text', text: msg.content },
              { type: 'image_url', image_url: { url: image } }
            ]
          };
        }
        return msg;
      }),
    ];

    console.log('Sending request to OpenAI:', {
      model: image ? 'gpt-5-2025-08-07' : 'gpt-5-mini-2025-08-07',
      messageCount: messages.length,
      hasImage: !!image,
      totalInputLength: messages.reduce((sum, msg) => sum + (typeof msg.content === 'string' ? msg.content.length : 0), 0)
    });

    const completion = await openai.chat.completions.create({
      model: image ? 'gpt-5-2025-08-07' : 'gpt-5-mini-2025-08-07',
      messages: messages,
      max_completion_tokens: 8000, // Increased from 1500 to handle GPT-5 reasoning tokens
    });

    console.log('OpenAI response received:', {
      hasContent: !!completion.choices[0]?.message?.content,
      contentLength: completion.choices[0]?.message?.content?.length || 0,
      finishReason: completion.choices[0]?.finish_reason,
      hasRefusal: !!completion.choices[0]?.message?.refusal,
      usage: completion.usage
    });

    // Check for refusal (policy rejection)
    if (completion.choices[0]?.message?.refusal) {
      console.error('OpenAI refusal:', completion.choices[0].message.refusal);
      return new Response(JSON.stringify({ 
        error: 'AI-hjelperen kan ikke behandle denne forespørselen på grunn av sikkerhetshensyn. Prøv å omformulere.',
        details: 'OpenAI policy refusal'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let reply = completion.choices[0].message.content;

    // Check for empty response
    if (!reply || reply.trim() === '') {
      console.error('Empty response from OpenAI:', {
        finishReason: completion.choices[0]?.finish_reason,
        usage: completion.usage
      });
      return new Response(JSON.stringify({ 
        error: 'AI-hjelperen ga ikke noe svar. Dette kan skyldes for kompleks forespørsel. Prøv å forenkle.',
        details: `Finish reason: ${completion.choices[0]?.finish_reason}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Post-process AI response to remove problematic statements and improve personalization
    if (reply) {
      // Remove "cannot analyze images" statements
      reply = reply
        .replace(/(?:beklager|dessverre).*?(?:kan ikke|klarer ikke).*?(?:se|analysere|beskrive).*?bild.*?[.!]/gi, '')
        .replace(/jeg kan ikke se bildet/gi, '')
        .replace(/som en AI.*?kan jeg ikke.*?bild.*?[.!]/gi, '')
        .replace(/(?:jeg|ai).*?(?:kan ikke|mangler evne).*?(?:se|analysere).*?[.!]/gi, '')
        .replace(/kan ikke.*?hjelpe.*?med.*?bildeanalyse/gi, '')
        .replace(/kan dessverre ikke.*?se.*?bilde/gi, '');

      // Remove generic family recommendations that ignore user's role/gender
      reply = reply
        .replace(/dette kan være.*?nyttig.*?for.*?familien/gi, '')
        .replace(/alle i familien.*?kan.*?bruke/gi, '')
        .replace(/passer.*?for.*?hele.*?familien/gi, '');

      // Clean up formatting
      reply = reply
        .replace(/\s+/g, ' ')
        .replace(/\s+\./g, '.')
        .replace(/\s+,/g, ',')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
    }

    // Analyze the conversation for action suggestions
    let contextualActions: any[] = [];
    let inventoryAnalysisData: any = null;
    
    // If image is provided, analyze it for inventory suggestions
    if (image) {
      try {
        const { data: inventoryResult, error: inventoryError } = await supabaseClient.functions.invoke('inventory-ai', {
          body: { image },
        });

        if (!inventoryError && inventoryResult?.result && inventoryResult?.suggestedActions) {
          contextualActions = inventoryResult.suggestedActions;
          
          // Use the detailed description from our AI response instead of the short one from inventory-ai
          const detailedDescription = extractDetailedDescriptionFromReply(reply);
          inventoryAnalysisData = {
            ...inventoryResult.result,
            description: detailedDescription || inventoryResult.result.description
          };
        }
      } catch (error) {
        console.error('Error analyzing image for inventory:', error);
      }
    } else if (history.length > 0) {
      // Analyze conversation context for actions if no image
      try {
        const latestUserMessage = history[history.length - 1];
        if (latestUserMessage.role === 'user') {
          const { data: actionData, error: actionError } = await supabaseClient.functions.invoke(
            'suggest-actions',
            {
              body: {
                userMessage: latestUserMessage.content,
                context: history.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')
              }
            }
          );
          
          if (!actionError && actionData?.suggestedActions) {
            contextualActions = actionData.suggestedActions;
          }
        }
      } catch (error) {
        console.error('Error analyzing context for actions:', error);
      }
    }

    return new Response(JSON.stringify({ 
      reply, 
      suggestedActions: contextualActions.length > 0 ? contextualActions : undefined,
      inventoryAnalysis: inventoryAnalysisData,
      actionData: inventoryAnalysisData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      error: error.message || 'En ukjent feil oppstod i AI-hjelperen',
      details: error.name || 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
