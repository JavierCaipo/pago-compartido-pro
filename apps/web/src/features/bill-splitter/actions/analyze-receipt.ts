'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { RawItem } from "../types";

export async function analyzeReceiptAction(formData: FormData): Promise<RawItem[]> {
    console.log("🔹 [Server] Iniciando análisis...");

    // 1. CHEQUEO DE SEGURIDAD
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ [FATAL] GEMINI_API_KEY no encontrada en variables de entorno Vercel.");
        throw new Error("Error de Servidor: API Key no configurada.");
    }

    const file = formData.get('file') as File;
    if (!file) {
        throw new Error("No se recibió archivo.");
    }

    try {
        // 2. PROCESAMIENTO
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 3. PROMPT DE INGENIERÍA
        const prompt = `Actúa como un sistema OCR financiero.
    Analiza la imagen y extrae una lista de productos consumidos y sus precios.
    REGLAS:
    - Ignora subtotales, impuestos, propinas y totales finales.
    - Devuelve SOLO un array JSON válido.
    - Formato: [{"name": "Nombre Plato", "price": 15.50}]
    - Si no puedes leer nada, devuelve array vacío [].`;

        console.log("🔹 [Server] Enviando a Gemini...");
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

        // Limpieza de Markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        console.log("🔹 [Server] Respuesta Raw:", text.substring(0, 50) + "...");

        const parsed = JSON.parse(text);

        if (!Array.isArray(parsed)) throw new Error("La IA no devolvió una lista válida.");

        return parsed.map((item: any) => ({
            name: item.name || "Item sin nombre",
            price: Number(item.price) || 0
        }));

    } catch (error: any) {
        console.error("🔥 [Server Error]:", error);
        // Este mensaje exacto se mostrará en la UI
        throw new Error(`Fallo al analizar: ${error.message}`);
    }
}