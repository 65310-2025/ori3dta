import { Server } from "http";
import { Server as SocketIOServer, Socket as SocketIO } from "socket.io";
import { IUser, ISocket } from "./types/types";

let io: SocketIOServer;

const userToSocketMap: { [key: string]: SocketIO } = {}; // maps user ID to socket object
const socketToUserMap: { [key: string]: IUser } = {}; // maps socket ID to user object

const getAllConnectedUsers = (): IUser[] => Object.values(socketToUserMap);
const getSocketFromUserID = (userid: string): SocketIO | undefined => userToSocketMap[userid];
const getUserFromSocketID = (socketid: string): IUser | undefined => socketToUserMap[socketid];
const getSocketFromSocketID = (socketid: string): SocketIO | undefined => io.sockets.sockets.get(socketid);

const addUser = (user: IUser, socket: SocketIO): void => {
  const oldSocket = userToSocketMap[user._id];
  if (oldSocket && oldSocket.id !== socket.id) {
    // there was an old tab open for this user, force it to disconnect
    // FIXME: is this the behavior you want?
    oldSocket.disconnect();
    delete socketToUserMap[oldSocket.id];
  }

  userToSocketMap[user._id] = socket;
  socketToUserMap[socket.id] = user;
};

const removeUser = (user: IUser | undefined, socket: SocketIO): void => {
  if (user) delete userToSocketMap[user._id];
  delete socketToUserMap[socket.id];
};

export default {
  init: (http: Server): void => {
    io = new SocketIOServer(http);

    io.on("connection", (socket: SocketIO) => {
      console.log(`socket has connected ${socket.id}`);
      socket.on("disconnect", (reason: string) => {
        const user = getUserFromSocketID(socket.id);
        removeUser(user, socket);
      });
    });
  },

  addUser: addUser,
  removeUser: removeUser,

  getSocketFromUserID: getSocketFromUserID,
  getUserFromSocketID: getUserFromSocketID,
  getSocketFromSocketID: getSocketFromSocketID,
  getIo: (): SocketIOServer => io,
};
