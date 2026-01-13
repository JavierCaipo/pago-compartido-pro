'use server';

import { GoogleGenAI, Type } from "@google/genai";
import { RawItem } from "../types";

const receiptSchema = {
    type: Type.ARRAY,
    description: "Lista de artículos de la factura.",
    items: {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: "Nombre del artículo.",
            },
            price: {
                type: Type.NUMBER,
                description: "Precio del artículo.",
            },
        },
        required: ["name", "price"],
    },
};

export async function analyzeReceiptAction(formData: FormData): Promise<RawItem[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("Server Error: GEMINI_API_KEY is not set");
    }

    const file = formData.get('file') as File;
    if (!file) {
        throw new Error("No file uploaded");
    }

    // Convertir File a ArrayBuffer y luego a Base64 para Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const ai = new GoogleGenAI({ apiKey });

    const prompt = "Analiza esta factura y extrae cada artículo con su precio. Devuelve los datos en formato JSON. No incluyas impuestos, propinas ni totales en la lista de artículos.";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash", // Actualizamos al modelo más rápido y reciente
            contents: {
                role: "user",
                parts: [
                    {
                        inlineData: {
                            mimeType: file.type,
                            data: base64Data
                        }
                    },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: receiptSchema,
            },
        });

        // En la v1 del SDK @google/genai, accedemos al texto así:
        const responseResult = await response;
        const textResponse = responseResult.text;
        if (!textResponse) throw new Error("Empty response from AI");

        const parsedResponse = JSON.parse(textResponse);

        if (Array.isArray(parsedResponse)) {
            return parsedResponse as RawItem[];
        } else {
            throw new Error("Invalid response format from AI");
        }

    } catch (error) {
        console.error("Error analyzing receipt:", error);
        throw new Error("Error procesando la factura. Intenta con una imagen más clara.");
    }
}
