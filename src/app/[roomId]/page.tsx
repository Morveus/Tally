'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Trash2, Edit2, Check, X, Copy } from 'lucide-react';
import { addToRoomHistory } from '@/lib/room-history';

interface Item {
  id: string;
  name: string;
  count: number;
  roomId: string;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: string;
  title: string;
  items: Item[];
  createdAt: string;
  updatedAt: string;
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editingCount, setEditingCount] = useState<string | null>(null);
  const [editCountValue, setEditCountValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchRoom();

    // Set up Server-Sent Events for real-time updates
    const eventSource = new EventSource(`/api/rooms/${roomId}/events`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        fetchRoom();
      }
    };

    eventSource.onerror = (error) => {
      // SSE errors are normal during reconnection, especially in dev mode
      if (eventSource.readyState === EventSource.CONNECTING) {
        console.log('SSE reconnecting...');
        return;
      }
      
      // Only log actual errors
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('SSE connection closed, falling back to polling');
        eventSource.close();
        // Fallback to polling if SSE fails
        const interval = setInterval(fetchRoom, 5000);
        return () => clearInterval(interval);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [roomId]);

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (!response.ok) throw new Error('Room not found');
      const data = await response.json();
      setRoom(data);
      
      // Add room to history when successfully loaded
      if (data && data.id && data.title) {
        addToRoomHistory(data.id, data.title);
      }
    } catch (error) {
      console.error('Error fetching room:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRoomTitle = async () => {
    if (!room || newTitle.trim() === room.title) {
      setEditingTitle(false);
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) throw new Error('Failed to update title');
      
      const updatedRoom = await response.json();
      setRoom({ ...room, title: updatedRoom.title });
      setEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName })
      });

      if (!response.ok) throw new Error('Failed to add item');
      
      const newItem = await response.json();
      setRoom(room => room ? {
        ...room,
        items: [...room.items, newItem]
      } : null);
      setNewItemName('');
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const updateItemCount = async (itemId: string, delta: number) => {
    if (!room) return;
    
    const item = room.items.find(i => i.id === itemId);
    if (!item) return;

    const newCount = Math.max(0, item.count + delta);

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: newCount })
      });

      if (!response.ok) throw new Error('Failed to update count');
      
      const updatedItem = await response.json();
      setRoom({
        ...room,
        items: room.items.map(i => i.id === itemId ? updatedItem : i)
      });
    } catch (error) {
      console.error('Error updating count:', error);
    }
  };

  const updateItemCountDirect = async (itemId: string) => {
    if (!room || !editCountValue.trim()) {
      setEditingCount(null);
      return;
    }

    const newCount = Math.max(0, parseInt(editCountValue) || 0);

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: newCount })
      });

      if (!response.ok) throw new Error('Failed to update count');
      
      const updatedItem = await response.json();
      setRoom({
        ...room,
        items: room.items.map(i => i.id === itemId ? updatedItem : i)
      });
      setEditingCount(null);
    } catch (error) {
      console.error('Error updating count:', error);
    }
  };

  const updateItemName = async (itemId: string) => {
    if (!room || !editItemName.trim()) {
      setEditingItem(null);
      return;
    }

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editItemName })
      });

      if (!response.ok) throw new Error('Failed to update name');
      
      const updatedItem = await response.json();
      setRoom({
        ...room,
        items: room.items.map(i => i.id === itemId ? updatedItem : i)
      });
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!room) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete item');
      
      setRoom({
        ...room,
        items: room.items.filter(i => i.id !== itemId)
      });
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const copyRoomUrl = async () => {
    const roomUrl = `${window.location.protocol}//${window.location.host}/${roomId}`;
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = roomUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Room not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              {editingTitle ? (
                <>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') updateRoomTitle();
                      if (e.key === 'Escape') setEditingTitle(false);
                    }}
                    className="text-2xl font-bold"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={updateRoomTitle}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingTitle(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <CardTitle className="text-2xl flex-1 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {room.title}
                  </CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setNewTitle(room.title);
                      setEditingTitle(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-muted-foreground">
                Share this room:
              </p>
              <code className="bg-muted px-2 py-1 rounded text-sm flex-1 min-w-0 overflow-hidden">
                {typeof window !== 'undefined' ? 
                  `${window.location.protocol}//${window.location.host}/${room.id}` : 
                  `https://your-domain/${room.id}`
                }
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copyRoomUrl}
                className="shrink-0"
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Add new item..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
              />
              <Button onClick={addItem} disabled={!newItemName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-3">
              {room.items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No items yet. Add your first item above!
                </p>
              ) : (
                room.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg bg-accent/10 hover:bg-accent/20 transition-all duration-200 border border-border/30"
                  >
                    {/* Top row: Edit button, Item name, Delete button */}
                    <div className="flex items-center gap-3 mb-3">
                      {editingItem === item.id ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => updateItemName(item.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Input
                            value={editItemName}
                            onChange={(e) => setEditItemName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateItemName(item.id);
                              if (e.key === 'Escape') setEditingItem(null);
                            }}
                            className="flex-1 text-sm"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditItemName(item.name);
                              setEditingItem(item.id);
                            }}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <span className="flex-1 text-sm text-muted-foreground">{item.name}</span>
                          {showDeleteConfirm === item.id ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  deleteItem(item.id);
                                  setShowDeleteConfirm(null);
                                }}
                                className="text-xs px-2 py-1 h-6"
                              >
                                Delete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(null)}
                                className="text-xs px-2 py-1 h-6"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowDeleteConfirm(item.id)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Bottom row: Counter controls */}
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => updateItemCount(item.id, -1)}
                        disabled={item.count === 0}
                        className="hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive h-12 w-12"
                      >
                        <Minus className="h-6 w-6" />
                      </Button>
                      
                      {editingCount === item.id ? (
                        <Input
                          value={editCountValue}
                          onChange={(e) => setEditCountValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateItemCountDirect(item.id);
                            if (e.key === 'Escape') setEditingCount(null);
                          }}
                          className="w-20 text-center font-bold text-3xl h-12"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditCountValue(item.count.toString());
                            setEditingCount(item.id);
                          }}
                          className="w-20 text-center font-bold text-3xl text-primary hover:bg-primary/10 rounded-md h-12 transition-colors"
                        >
                          {item.count}
                        </button>
                      )}
                      
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => updateItemCount(item.id, 1)}
                        className="hover:bg-primary/10 hover:border-primary/50 hover:text-primary h-12 w-12"
                      >
                        <Plus className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}