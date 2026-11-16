import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const laboratories = await db.laboratory.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(laboratories);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener los laboratorios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cohort, title, description, objectives, rubricJson } = body;

    // Validar estructura y que las ponderaciones sumen exactamente 100%
    if (!rubricJson || !Array.isArray(rubricJson.criterios) || rubricJson.criterios.length === 0) {
      return NextResponse.json(
        { error: 'La rúbrica debe contener una lista válida de "criterios".' },
        { status: 400 }
      );
    }

    const totalWeight = rubricJson.criterios.reduce(
      (acc: number, item: any) => acc + Number(item.peso || 0),
      0
    );

    if (totalWeight !== 100) {
      return NextResponse.json(
        {
          error: `Inconsistencia en la rúbrica: las ponderaciones suman ${totalWeight}%, pero deben sumar exactamente 100%.`,
        },
        { status: 400 }
      );
    }

    const newLaboratory = await db.laboratory.create({
      data: {
        cohort: Number(cohort),
        title,
        description,
        objectives,
        rubricJson,
      },
    });

    return NextResponse.json(newLaboratory, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear el laboratorio' }, { status: 500 });
  }
}