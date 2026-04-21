import Anthropic from 'npm:@anthropic-ai/sdk@0.27'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const client = new Anthropic()

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, contexto } = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      contexto?: string
    }

    const system = `Sos el asistente de Zonify, un sistema de gestión para distribuidoras mayoristas.
Tu rol es ayudar al usuario con preguntas sobre el sistema: pedidos, stock, cobros, preventistas, zonas y reportes.
Respondé siempre en español rioplatense. Sé claro, conciso y práctico.
Si no sabés algo específico de los datos de la empresa, decilo y sugerí cómo encontrarlo en el sistema.
${contexto ? `\nContexto de la empresa: ${contexto}` : ''}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    return new Response(JSON.stringify({ respuesta: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
