'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { RawItem } from "../types";

type ActionResponse =
    | { success: true; data: RawItem[] }
    | { success: false; error: string };

// Lista de modelos a probar en orden de preferencia
const MODELS_TO_TRY = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash-8b"
];

export async function analyzeReceiptAction(formData: FormData): Promise<ActionResponse> {
    console.log("🔹 [Server] v5.0 MODEL HUNTER: Iniciando...");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { success: false, error: "CONFIG_ERROR: API Key no configurada." };
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: "UPLOAD_ERROR: No se recibió archivo." };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const genAI = new GoogleGenerativeAI(apiKey);

        // Iteramos por los modelos hasta que uno funcione
        for (const modelName of MODELS_TO_TRY) {
            console.log(`🔹 [Server] Intentando con modelo: ${modelName}...`);

            try {
                const model = genAI.getGenerativeModel({ model: modelName });

                const prompt = `Analiza este recibo.
        Extrae items y precios en un JSON Array.
        Formato: [{"name": "Item", "price": 10.0}]
        Ignora totales.`;

                const result = await model.generateContent([
                    prompt,
                    { inlineData: { data: base64Data, mimeType: file.type || "image/jpeg" } },
                ]);

                const response = await result.response;
                let text = response.text();

                // Si llegamos aquí, ¡FUNCIONÓ! Procesamos y salimos.
                console.log(`✅ [Server] ¡ÉXITO con ${modelName}!`);

                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(text);

                if (!Array.isArray(parsed)) throw new Error("No es un array");

                const cleanData = parsed.map((item: any) => ({
                    name: item.name || "Item",
                    price: Number(item.price) || 0
                }));

                return { success: true, data: cleanData };

            } catch (innerError: any) {
                // Si es un error 404 (modelo no encontrado), probamos el siguiente
                if (innerError.message?.includes("404") || innerError.message?.includes("not found")) {
                    console.warn(`⚠️ [Server] ${modelName} no disponible. Probando siguiente...`);
                    continue;
                }
                // Si es otro error (ej: JSON malformado), lanzamos
                throw innerError;
            }
        }

        // Si termina el bucle y ninguno funcionó
        return { success: false, error: "ALL_MODELS_FAILED: Ningún modelo de Gemini está disponible en tu API Key." };

    } catch (error: any) {
        console.error("🔥 [Server CRASH]:", error);
        return { success: false, error: `GOOGLE_ERROR: ${error.message}` };
    }
}