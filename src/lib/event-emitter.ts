import { EventEmitter } from 'events';

class RoomEventEmitter extends EventEmitter {
  private static instance: RoomEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(0);
  }

  static getInstance(): RoomEventEmitter {
    if (!RoomEventEmitter.instance) {
      RoomEventEmitter.instance = new RoomEventEmitter();
    }
    return RoomEventEmitter.instance;
  }

  emitRoomUpdate(roomId: string) {
    this.emit(`room:${roomId}`, { type: 'update', roomId });
  }
}

export const roomEvents = RoomEventEmitter.getInstance();