'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, Clock, ExternalLink } from 'lucide-react';
import { getRoomHistory, type RoomHistoryItem } from '@/lib/room-history';

export default function Home() {
  const [roomTitle, setRoomTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [roomHistory, setRoomHistory] = useState<RoomHistoryItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    setRoomHistory(getRoomHistory());
  }, []);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col items-center justify-center p-4 space-y-8">
      <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-primary">
            <Hash className="h-full w-full" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Tally Counter
          </CardTitle>
          <CardDescription>
            Create a collaborative room to count anything
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

      {roomHistory.length > 0 && (
        <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Recent Rooms
            </CardTitle>
            <CardDescription>
              Quick access to your previously visited rooms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roomHistory.map((room) => (
              <button
                key={room.id}
                onClick={() => router.push(`/${room.id}`)}
                className="w-full p-3 text-left rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {room.title}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {room.id}
                      </code>
                      <span>•</span>
                      <span>{formatDate(room.lastVisited)}</span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
