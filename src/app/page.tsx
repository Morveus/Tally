'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash } from 'lucide-react';

export default function Home() {
  const [roomTitle, setRoomTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: roomTitle || 'New Room' })
      });

      if (!response.ok) throw new Error('Failed to create room');

      const room = await response.json();
      router.push(`/${room.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-primary">
            <Hash className="h-full w-full" />
          </div>
          <CardTitle className="text-3xl font-bold">Tally Counter</CardTitle>
          <CardDescription>
            Create a collaborative counting room to track anything with your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Room title (optional)"
            value={roomTitle}
            onChange={(e) => setRoomTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createRoom()}
            className="text-center"
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={createRoom}
            disabled={isCreating}
            className="w-full"
            size="lg"
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
