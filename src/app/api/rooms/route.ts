import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRoomId } from '@/lib/room-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title } = body;

    let roomId = generateRoomId(6);
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existingRoom = await prisma.room.findUnique({
        where: { id: roomId }
      });

      if (!existingRoom) {
        break;
      }

      roomId = generateRoomId(Math.min(6 + attempts, 8));
      attempts++;
    }

    if (attempts === maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique room ID' },
        { status: 500 }
      );
    }

    const room = await prisma.room.create({
      data: {
        id: roomId,
        title: title || 'New Room'
      }
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}