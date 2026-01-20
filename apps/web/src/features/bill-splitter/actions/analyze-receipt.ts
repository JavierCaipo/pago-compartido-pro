'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { RawItem } from "../types";

type ActionResponse =
    | { success: true; data: RawItem[] }
    | { success: false; error: string };

export async function analyzeReceiptAction(formData: FormData): Promise<ActionResponse> {
    console.log("🔹 [Server] v4.0 FIX: Iniciando análisis con modelo específico...");

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("❌ [Server] FATAL: GEMINI_API_KEY no encontrada.");
            return { success: false, error: "CONFIG_ERROR: API Key no configurada." };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: "UPLOAD_ERROR: No se recibió archivo." };
        }

        // Conversión a Base64
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        const genAI = new GoogleGenerativeAI(apiKey);

        // --- CAMBIO CLAVE: Usamos la versión PINEADA (001) ---
        // Si gemini-1.5-flash falla, usamos gemini-1.5-flash-001 que es la versión estable específica
        const modelName = "gemini-1.5-flash-001";
        const model = genAI.getGenerativeModel({ model: modelName });

        console.log(`🔹 [Server] Usando modelo: ${modelName}`);

        const prompt = `Analiza este recibo/factura.
    Extrae items y precios.
    IMPORTANTE: Devuelve SOLO un JSON válido.
    Formato: [{"name": "Producto", "price": 10.00}]
    Ignora totales.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        let text = response.text();
        console.log("🔹 [Server] Respuesta recibida:", text.substring(0, 50) + "...");

        // Limpieza JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            return { success: false, error: "AI_ERROR: La IA no devolvió un JSON válido." };
        }

        if (!Array.isArray(parsed)) {
            return { success: false, error: "AI_ERROR: La respuesta no es una lista." };
        }

        const cleanData = parsed.map((item: any) => ({
            name: item.name || "Item",
            price: Number(item.price) || 0
        }));

        return { success: true, data: cleanData };

    } catch (error: any) {
        console.error("🔥 [Server CRASH]:", error);

        // Si falla el modelo Flash, devolvemos un error descriptivo
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            return { success: false, error: "MODEL_ERROR: El modelo 'gemini-1.5-flash-001' no está disponible en tu API Key. Verifica Google AI Studio." };
        }

        return { success: false, error: `GOOGLE_ERROR: ${error.message}` };
    }
}