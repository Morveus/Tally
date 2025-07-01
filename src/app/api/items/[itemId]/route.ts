import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { roomEvents } from '@/lib/event-emitter';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    const { name, count } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (count !== undefined) updateData.count = Math.max(0, count);

    const item = await prisma.item.update({
      where: { id: params.itemId },
      data: updateData,
      include: { room: true }
    });

    roomEvents.emitRoomUpdate(item.roomId);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  const params = await context.params;
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.itemId }
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    await prisma.item.delete({
      where: { id: params.itemId }
    });

    roomEvents.emitRoomUpdate(item.roomId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}