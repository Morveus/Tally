import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { roomEvents } from '@/lib/event-emitter';

export async function GET(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  const params = await context.params;
  try {
    const room = await prisma.room.findUnique({
      where: { id: params.roomId },
      include: { items: { orderBy: { createdAt: 'asc' } } }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ roomId: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    const { title } = body;

    const room = await prisma.room.update({
      where: { id: params.roomId },
      data: { title }
    });

    roomEvents.emitRoomUpdate(params.roomId);
    return NextResponse.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}