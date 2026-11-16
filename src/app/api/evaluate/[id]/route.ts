import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { finalScore, feedback, isApproved } = body;

    const updated = await db.evaluation.update({
      where: { id },
      data: {
        finalScore: Number(finalScore),
        feedback,
        isApproved: Boolean(isApproved),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error al aprobar evaluación:', error);
    return NextResponse.json({ error: 'No se pudo actualizar la evaluación' }, { status: 500 });
  }
}