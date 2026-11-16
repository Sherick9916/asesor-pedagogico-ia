import Groq from 'groq-sdk';
import { z } from 'zod';

const apiKey = process.env.GROQ_API_KEY || '';
const preferredModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const fallbackModels = [
    preferredModel,
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-20b',
];

if (!apiKey) {
    console.error('¡ALERTA! La variable GROQ_API_KEY no está configurada en el archivo .env.local');
}

const groq = new Groq({ apiKey });

export interface RubricCriterion {
    nombre: string;
    peso: number;
    descripcion?: string;
}

export const evaluationSchema = z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    feedback: z.string(),
    recommendations: z.array(z.string()),
    criteriasEvaluated: z.array(
        z.object({
            criterionName: z.string(),
            score: z.number().min(0).max(5),
            evidenceFound: z.string(),
            justification: z.string(),
        })
    ),
    topicsDetected: z.array(
        z.object({
            topic: z.string(),
            category: z.string(),
            masteryLevel: z.enum(['Básico', 'Intermedio', 'Avanzado']),
            needsDeepening: z.boolean(),
        })
    ),
});

export type EvaluationResult = z.infer<typeof evaluationSchema> & {
    preliminaryScore: number;
};

function sanitizeJsonResponse(rawText: string): object {
    const cleaned = rawText.trim();
    const withoutCodeFence = cleaned
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    try {
        return JSON.parse(withoutCodeFence);
    } catch (error) {
        throw new Error(`La IA devolvió un JSON no válido: ${String(error)}`);
    }
}

async function createEvaluationWithModel(model: string, prompt: string) {
    return groq.chat.completions.create({
        model,
        messages: [
            {
                role: 'system',
                content: 'Eres un evaluador académico experto que siempre responde en formato JSON válido.',
            },
            { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
    });
}

export async function evaluateStudentWork(
    laboratoryDescription: string,
    rubricCriteria: RubricCriterion[],
    studentReportText: string,
    githubRepo?: string
): Promise<EvaluationResult> {
    if (!apiKey) {
        throw new Error('GROQ_API_KEY no está configurada. Revisa tu archivo .env.local');
    }

    try {
        const prompt = `
      Actúa como un evaluador académico riguroso de Ingeniería de Sistemas en el área de Inteligencia Artificial.
      Analiza la entrega del estudiante frente a la descripción del laboratorio y cada criterio de la rúbrica.

      ---
      DESCRIPCIÓN Y OBJETIVOS DEL LABORATORIO:
      ${laboratoryDescription}

      CRITERIOS DE LA RÚBRICA (Evalúa cada uno de 0.0 a 5.0):
      ${JSON.stringify(rubricCriteria, null, 2)}

      INFORME / DOCUMENTACIÓN DEL ESTUDIANTE:
      ${studentReportText}

      CÓDIGO FUENTE / REPOSITORIO:
      ${githubRepo || 'No adjuntado'}
      ---

      Devuelve estrictamente un objeto JSON válido (sin texto adicional ni bloques markdown fuera del JSON) con esta estructura exacta:
      {
        "strengths": ["fortaleza 1", "fortaleza 2"],
        "weaknesses": ["debilidad 1"],
        "feedback": "Retroalimentación general argumentada.",
        "recommendations": ["recomendación 1"],
        "criteriasEvaluated": [
          {
            "criterionName": "Debe coincidir exactamente con el nombre del criterio en la rúbrica",
            "score": 4.5,
            "evidenceFound": "Cita textual extraída de la entrega",
            "justification": "Por qué merece esta nota"
          }
        ],
        "topicsDetected": [
          {
            "topic": "Ej: Prompts Estructurados",
            "category": "Ej: Machine Learning",
            "masteryLevel": "Intermedio",
            "needsDeepening": false
          }
        ]
      }
    `;

        let lastError: any = null;

        for (const model of fallbackModels) {
            try {
                const completion = await createEvaluationWithModel(model, prompt);
                const responseText = completion.choices[0]?.message?.content;

                if (!responseText) {
                    throw new Error('La respuesta de la IA llegó vacía.');
                }

                const parsedData = sanitizeJsonResponse(responseText);
                const validated = evaluationSchema.parse(parsedData);

                let weightedSum = 0;
                for (const criterion of rubricCriteria) {
                    const evaluatedItem = validated.criteriasEvaluated.find(
                        (c) => c.criterionName.toLowerCase().trim() === criterion.nombre.toLowerCase().trim()
                    );
                    const score = evaluatedItem ? evaluatedItem.score : 0;
                    weightedSum += score * (Number(criterion.peso) / 100);
                }

                const preliminaryScore = Math.min(5, Math.max(0, Number(weightedSum.toFixed(2))));

                return {
                    ...validated,
                    preliminaryScore,
                };
            } catch (error: any) {
                lastError = error;

                const isModelIssue =
                    error?.status === 404 ||
                    /model.*(not found|not available|invalid)|unknown model|no model/i.test(String(error?.message || ''));

                if (!isModelIssue) {
                    throw error;
                }

                console.warn(`El modelo ${model} no respondió correctamente. Probando fallback...`);
            }
        }

        throw new Error(
            `No fue posible obtener una respuesta válida de Groq. Último error: ${
                lastError?.message || 'Error desconocido'
            }`
        );
    } catch (error: any) {
        console.error('Detalle del error con Groq:', error);
        const statusCode = error?.status || 'desconocido';
        const message = error?.message || 'Verifica tu API Key en .env.local';
        throw new Error(`Error de comunicación con la IA (Groq): ${message}. Código de estado: ${statusCode}`);
    }
}