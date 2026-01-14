'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { RawItem } from "../types";

/**
 * Server Action para analizar recibos usando Gemini 1.5 Flash.
 * Optimizado para Next.js 15 y desplegado en Vercel.
 */
export async function analyzeReceiptAction(formData: FormData): Promise<RawItem[]> {
    console.log("🚀 [analyzeReceiptAction]: Inicio de análisis.");

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ [analyzeReceiptAction]: GEMINI_API_KEY no encontrada.");
        throw new Error("Configuración del servidor incompleta.");
    }

    const file = formData.get('file') as File;
    if (!file) {
        console.warn("⚠️ [analyzeReceiptAction]: No se recibió archivo.");
        throw new Error("No se seleccionó ninguna imagen.");
    }

    try {
        console.log(`📸 [analyzeReceiptAction]: Procesando imagen: ${file.name} (${file.type})`);

        // 1. Preparar datos para Gemini
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        // 2. Configurar IA
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        // 3. Prompt de sistema ultra-específico para evitar basura en el JSON
        const systemPrompt = `
            Actúa como un experto en OCR de recibos. Tu tarea es extraer items y precios de la imagen proporcionada.
            
            REGLAS ESTRICTAS:
            1. Devuelve ÚNICAMENTE un array JSON válido.
            2. Formato: [{"name": "Nombre del Item", "price": 10.50}]
            3. Ignora subtotales, impuestos (IVA/TAX), propinas (TIPS) y el total final.
            4. Si el nombre del item incluye cantidades (ej. 2x Pizza), inclúyelo tal cual.
            5. Convierte los precios a números float.
            6. Si la imagen es ilegible, devuelve un array vacío [].
            
            RESPUESTA ESPERADA: Un array JSON puro, sin bloques de código markdown.
        `;

        console.log("🤖 [analyzeReceiptAction]: Llamando a Gemini API...");

        const result = await model.generateContent([
            { text: systemPrompt },
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        console.log("✅ [analyzeReceiptAction]: Respuesta recibida de la IA.");

        // Limpieza de posibles bloques de código si la IA los incluye
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (!Array.isArray(parsed)) {
            throw new Error("La IA no devolvió un formato de lista válido.");
        }

        const items: RawItem[] = parsed.map((p: any) => ({
            name: String(p.name || "Item desconocido"),
            price: parseFloat(String(p.price || 0))
        }));

        console.log(`📊 [analyzeReceiptAction]: Se detectaron ${items.length} items.`);
        return items;

    } catch (error: any) {
        console.error("🔥 [analyzeReceiptAction]: Error Fatal:", error);
        throw new Error("No pudimos procesar el recibo. Intenta con una foto más nítida.");
    }
}