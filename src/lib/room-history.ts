const ROOM_HISTORY_KEY = 'tally-room-history';

export interface RoomHistoryItem {
  id: string;
  title: string;
  lastVisited: string;
}

export function getRoomHistory(): RoomHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(ROOM_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to parse room history:', error);
    return [];
  }
}

export function addToRoomHistory(roomId: string, title: string) {
  if (typeof window === 'undefined') return;

  try {
    const history = getRoomHistory();
    const existingIndex = history.findIndex(item => item.id === roomId);
    
    const newItem: RoomHistoryItem = {
      id: roomId,
      title,
      lastVisited: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing item and move to front
      history[existingIndex] = newItem;
      history.unshift(history.splice(existingIndex, 1)[0]);
    } else {
      // Add new item to front
      history.unshift(newItem);
    }

    // Keep only the last 10 rooms
    const limitedHistory = history.slice(0, 10);
    
    localStorage.setItem(ROOM_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Failed to save room history:', error);
  }
}

export function removeFromRoomHistory(roomId: string) {
  if (typeof window === 'undefined') return;

  try {
    const history = getRoomHistory();
    const filteredHistory = history.filter(item => item.id !== roomId);
    localStorage.setItem(ROOM_HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Failed to remove from room history:', error);
  }
}