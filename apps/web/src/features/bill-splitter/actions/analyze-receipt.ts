'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { RawItem } from "../types";

export async function analyzeReceiptAction(formData: FormData): Promise<RawItem[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    // Validación estricta de API Key
    if (!apiKey) {
        console.error("❌ ERROR CRÍTICO: GEMINI_API_KEY no está definida en Vercel.");
        throw new Error("Error de configuración del servidor (API Key faltante).");
    }

    const file = formData.get('file') as File;
    if (!file) {
        throw new Error("No se recibió ningún archivo de imagen.");
    }

    try {
        // 1. Convertir imagen a formato compatible con Gemini
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        // 2. Inicializar cliente (usando la librería estable)
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 3. Prompt optimizado para JSON
        const prompt = `Analiza este recibo. Extrae items y precios.
    Reglas:
    - Ignora totales, subtotales e impuestos.
    - Devuelve SOLO un array JSON válido: [{"name": "Item", "price": 10.0}]
    - Si no puedes leer algo, ignóralo.`;

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

        // Limpieza de respuesta (quita ```json y ```)
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(text);

        if (!Array.isArray(parsed)) throw new Error("Formato de respuesta inválido");

        return parsed.map((p: any) => ({
            name: p.name || "Item",
            price: Number(p.price) || 0
        }));

    } catch (error: any) {
        console.error("🔥 Error en IA:", error);
        throw new Error("No se pudo leer el recibo. Intenta con una foto más clara.");
    }
}