'use server';

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { RawItem } from "../types";

const receiptSchema: any = {
    type: SchemaType.ARRAY,
    description: "Lista de artículos de la factura.",
    items: {
        type: SchemaType.OBJECT,
        properties: {
            name: {
                type: SchemaType.STRING,
                description: "Nombre del artículo.",
            },
            price: {
                type: SchemaType.NUMBER,
                description: "Precio del artículo.",
            },
        },
        required: ["name", "price"],
    },
};

export async function analyzeReceiptAction(formData: FormData): Promise<RawItem[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("CRITICAL: GEMINI_API_KEY is not set in environment variables.");
        throw new Error("Server Error: Configuración de API no encontrada.");
    }

    const file = formData.get('file') as File;
    if (!file) {
        throw new Error("No se subió ningún archivo.");
    }

    try {
        // Convertir File a ArrayBuffer y luego a Base64 para Gemini
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: receiptSchema,
            }
        });

        const prompt = "Analiza esta factura y extrae cada artículo con su precio. Devuelve los datos en formato JSON. No incluyas impuestos, propinas ni totales en la lista de artículos.";

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: file.type,
                    data: base64Data
                }
            },
            { text: prompt }
        ]);

        const response = result.response;
        const textResponse = response.text();

        if (!textResponse) {
            console.error("Gemini Error: Empty response text.");
            throw new Error("La IA devolvió una respuesta vacía.");
        }

        const parsedResponse = JSON.parse(textResponse);

        if (Array.isArray(parsedResponse)) {
            return parsedResponse as RawItem[];
        } else {
            console.error("Gemini Error: Invalid response format.", textResponse);
            throw new Error("Formato de respuesta inválido.");
        }

    } catch (error) {
        console.error("CRITICAL ERROR in analyzeReceiptAction:", error);
        throw new Error("Error procesando la factura. Intenta con una imagen más clara.");
    }
}
