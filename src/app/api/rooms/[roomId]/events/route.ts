import { NextRequest } from 'next/server';
import { roomEvents } from '@/lib/event-emitter';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const params = await context.params;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial connection message
      send({ type: 'connected', roomId: params.roomId });

      // Listen for room updates
      const listener = (data: any) => send(data);
      roomEvents.on(`room:${params.roomId}`, listener);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        roomEvents.off(`room:${params.roomId}`, listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}