// @ts-nocheck
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30; // 30 seconds max duration for the function

// Configuración del proveedor de OpenRouter usando @ai-sdk/openai
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages, context, customSystemPrompt, sessionId } = await req.json();

  const finalSystemPrompt = customSystemPrompt 
    ? `${customSystemPrompt}\n\n[MASTER CONTEXT]: Trabajas para "Titanium OS", el Sistema Operativo de la Hospitalidad B2B2C. Eres un experto en restaurantes, detectando mermas y costos ocultos. TÁCTICA DE VENTA: En el momento de mayor interés del usuario, ofrece enviarle un caso de estudio o reporte de valor y pide EXCLUSIVAMENTE su número de WhatsApp (NUNCA pidas correo). Cuando te den Nombre, Restaurante y WhatsApp, usa la tool submitLead.`
    : `Eres un asistente de IA genérico. El contexto es: ${context}. Por favor, ayuda al usuario.`;

  const result = streamText({
    model: openrouter('anthropic/claude-3.5-sonnet'), // Default to Claude 3.5 Sonnet on OpenRouter
    system: finalSystemPrompt,
    messages,
    tools: {
      submitLead: tool({
        description: 'Guarda los datos cualificados del prospecto (lead) en el sistema CRM VendeMas una vez que el usuario ha proporcionado su nombre, el nombre de su restaurante y su WhatsApp.',
        parameters: z.object({
          name: z.string().describe('El nombre completo de la persona interesada.'),
          restaurantName: z.string().describe('El nombre del restaurante.'),
          whatsapp: z.string().describe('El número de WhatsApp de contacto.'),
        }),
        execute: async ({ name, restaurantName, whatsapp }) => {
          try {
            // 1. Guardar en CRM
            const response = await fetch('https://crm.tresapps.app/api/leads', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.VENDEMAS_API_KEY}`,
              },
              body: JSON.stringify({ name, restaurantName, phone: whatsapp }),
            });

            // 2. Actualizar Supabase con el WhatsApp
            if (sessionId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
              await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/chat_sessions?session_uuid=eq.${sessionId}`, {
                method: 'PATCH',
                headers: {
                  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lead_whatsapp: whatsapp })
              });
            }

            if (!response.ok) {
              console.error('Error al guardar el lead en VendeMas CRM:', await response.text());
              return { success: false, message: 'Hubo un problema al registrar la información, pero notificaremos al equipo internamente.' };
            }

            return { success: true, message: 'Lead registrado exitosamente en el CRM y WhatsApp sincronizado.' };
          } catch (error) {
            console.error('Error de red al guardar el lead:', error);
            return { success: false, message: 'Error de conexión al registrar el lead.' };
          }
        },
      }),
      transferToAdvisor: tool({
        description: 'Transfiere la conversación a otro asesor experto si el usuario necesita ayuda específica. Sofía para marketing/experiencia/reservas, Martín para finanzas/operaciones/costos, Alex para éxito general.',
        parameters: z.object({
          targetAdvisor: z.enum(['Alex', 'Martín', 'Sofía']).describe('El nombre del asesor al que se transferirá la charla.'),
        }),
        execute: async ({ targetAdvisor }) => {
          return { success: true, message: `Conversación transferida a ${targetAdvisor}. El nuevo asesor continuará desde aquí.` };
        }
      })
    },
    maxSteps: 5, // Allow multiple steps so the model can use tools and respond
  });

  return result.toDataStreamResponse();
}
