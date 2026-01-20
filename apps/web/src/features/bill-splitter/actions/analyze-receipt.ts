'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { RawItem } from "../types";

// Definimos un tipo de respuesta seguro para no romper el cliente
type ActionResponse =
    | { success: true; data: RawItem[] }
    | { success: false; error: string };

export async function analyzeReceiptAction(formData: FormData): Promise<ActionResponse> {
    console.log("🔹 [Server] v3.5 DEBUG: Iniciando análisis...");

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("❌ [Server] FATAL: GEMINI_API_KEY no encontrada.");
            return { success: false, error: "CONFIG_ERROR: API Key no configurada en Vercel." };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: "UPLOAD_ERROR: No se recibió archivo." };
        }

        console.log(`🔹 [Server] Procesando archivo: ${file.name} (${file.size} bytes)`);

        // Conversión a Base64
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analiza este recibo.
    Devuelve SOLO un JSON array válido con items y precios.
    Ejemplo: [{"name": "Coca Cola", "price": 2.50}]
    Ignora totales.`;

        console.log("🔹 [Server] Enviando a Google Gemini...");

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
        console.log("🔹 [Server] Respuesta recibida (length):", text.length);

        // Limpieza
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Intento de parseo
        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            console.error("❌ [Server] JSON Invalido:", text);
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
        // Devolvemos el mensaje exacto del error para verlo en pantalla
        return { success: false, error: `GOOGLE_ERROR: ${error.message}` };
    }
}