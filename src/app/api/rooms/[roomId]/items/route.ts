import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { roomEvents } from '@/lib/event-emitter';

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    const { name } = body;

    const item = await prisma.item.create({
      data: {
        name,
        roomId: params.roomId
      }
    });

    roomEvents.emitRoomUpdate(params.roomId);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}