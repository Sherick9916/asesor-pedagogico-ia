import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { evaluateStudentWork, RubricCriterion } from '@/lib/groq';

export async function GET() {
  try {
    const evaluations = await db.evaluation.findMany({
      include: {
        laboratory: true,
        submission: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(evaluations);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener evaluaciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { laboratoryId, studentName, studentEmail, cohort, studentReportText, githubRepo } = body;

    const laboratory = await db.laboratory.findUnique({
      where: { id: laboratoryId },
    });

    if (!laboratory) {
      return NextResponse.json({ error: 'Laboratorio no encontrado' }, { status: 404 });
    }

    if (!studentReportText || studentReportText.trim() === '') {
      return NextResponse.json(
        { error: 'Debe ingresar el texto de la solución o informe del estudiante.' },
        { status: 400 }
      );
    }

    // Guardar entrega del estudiante en el portafolio académico
    const submission = await db.studentSubmission.create({
      data: {
        studentName,
        studentEmail,
        cohort: Number(cohort),
        pdfUrl: studentReportText.slice(0, 15000),
        githubRepo: githubRepo || '',
      },
    });

    const rubricObj = laboratory.rubricJson as unknown as { criterios: RubricCriterion[] };

    // Ejecutar evaluación estructurada + cálculo determinista
    const evaluationResult = await evaluateStudentWork(
      `${laboratory.title}: ${laboratory.description} - Objetivos: ${laboratory.objectives}`,
      rubricObj.criterios,
      studentReportText,
      githubRepo
    );

    // Guardar evaluación en BD (pendiente de aprobación docente)
    const savedEvaluation = await db.evaluation.create({
      data: {
        laboratoryId,
        submissionId: submission.id,
        rawAiOutput: JSON.parse(JSON.stringify(evaluationResult)),
        finalScore: evaluationResult.preliminaryScore,
        feedback: evaluationResult.feedback,
        isApproved: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        evaluation: savedEvaluation,
        analysis: evaluationResult,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error en evaluación:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar la evaluación' },
      { status: 500 }
    );
  }
}