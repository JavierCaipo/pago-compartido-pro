'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const CLEANUP_REGEX = /```json\s*([\s\S]*?)\s*```/;

export async function analyzeReceiptAction(formData: FormData) {
    console.log("🚀 Iniciando análisis inteligente de recibo...");

    const file = formData.get('file') as File;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ Error: No API Key");
        return { success: false, error: 'Configuración del servidor incompleta (Falta API Key).' };
    }

    if (!file) {
        return { success: false, error: 'No se recibió ninguna imagen.' };
    }

    try {
        // 1. Prepara la imagen
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        // 2. Inicializa el cliente del SDK (para generar contenido luego)
        const genAI = new GoogleGenerativeAI(apiKey);

        // --- ESTRATEGIA DE DESCUBRIMIENTO DINÁMICO (CORREGIDA) ---
        console.log("🔍 Consultando modelos disponibles a Google API...");

        // FIX: Usamos fetch directo porque listModels() no siempre está expuesto en el cliente
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!listResponse.ok) {
            throw new Error(`No se pudo conectar con Google para listar modelos (Status: ${listResponse.status})`);
        }

        const data = await listResponse.json();
        const allModels = data.models || [];

        // Filtramos solo los que son "Gemini" y sirven para generar contenido
        // Nota: La API devuelve "generateContent" en supportedGenerationMethods
        const availableModels = allModels.filter((m: any) =>
            m.name.includes("gemini") &&
            m.supportedGenerationMethods &&
            m.supportedGenerationMethods.includes("generateContent")
        );

        if (availableModels.length === 0) {
            throw new Error("Tu API Key es válida, pero Google no devolvió ningún modelo Gemini compatible.");
        }

        // Algoritmo de Prioridad: 
        // 1. Preferimos "flash" (rápido y ligero).
        // 2. Si no hay flash, usamos "pro".
        // 3. Ordenamos para asegurar consistencia.
        const selectedModelInfo = availableModels.sort((a: any, b: any) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();

            // Prioridad a Flash
            const aFlash = aName.includes('flash');
            const bFlash = bName.includes('flash');
            if (aFlash && !bFlash) return -1;
            if (!aFlash && bFlash) return 1;

            // Prioridad a Pro
            const aPro = aName.includes('pro');
            const bPro = bName.includes('pro');
            if (aPro && !bPro) return -1;
            if (!aPro && bPro) return 1;

            return 0;
        })[0];

        // IMPORTANTE: La API devuelve "models/gemini-1.5-flash", el SDK a veces necesita solo "gemini-1.5-flash"
        // o funciona con el nombre completo. Usaremos el nombre completo devuelto por la API.
        const modelName = selectedModelInfo.name.replace('models/', ''); // Limpiamos el prefijo por si acaso

        console.log(`✅ Modelo seleccionado automáticamente: ${modelName}`);

        // 3. Instancia el modelo ganador
        const model = genAI.getGenerativeModel({ model: modelName });

        // 4. El Prompt Maestro
        const prompt = `
      Actúa como un sistema OCR experto en facturas de restaurantes.
      Analiza esta imagen y extrae SOLO los items consumibles (comida y bebida).
      
      Reglas Estrictas:
      1. Ignora propinas, impuestos, subtotales o fechas.
      2. Si hay cantidades (ej: "2x Cerveza"), sepáralos en lineas distintas o pon el precio total.
      3. Traduce nombres genéricos al español si es necesario.
      4. DEBES responder EXCLUSIVAMENTE un JSON válido.
      5. NO añadas texto antes ni después del JSON (nada de \`\`\`json).

      Formato JSON requerido:
      [
        { "name": "Nombre del plato", "price": 10.50 },
        { "name": "Bebida", "price": 5.00 }
      ]
    `;

        // 5. Ejecuta la IA
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || 'image/jpeg',
                },
            },
        ]);

        const response = await result.response;
        let text = response.text();

        console.log("🤖 Respuesta cruda de IA:", text.substring(0, 50) + "...");

        // 6. Limpieza Quirúrgica del JSON
        const match = text.match(CLEANUP_REGEX);
        if (match && match[1]) {
            text = match[1];
        }
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // 7. Parseo Seguro
        const items = JSON.parse(text);

        if (!Array.isArray(items)) {
            throw new Error("La IA no devolvió una lista de items válida.");
        }

        return { success: true, data: items };

    } catch (error: any) {
        console.error("💥 Error en Server Action:", error);

        let userMessage = "No pudimos leer el recibo.";
        if (error.message.includes("API Key")) userMessage = "Error de configuración (API Key).";
        if (error.message.includes("JSON")) userMessage = "Error de formato en la respuesta de IA.";

        return {
            success: false,
            error: `${userMessage} (Detalle: ${error.message})`
        };
    }
}