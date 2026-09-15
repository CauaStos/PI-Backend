import { Server as SocketIOServer, type Socket } from "socket.io"
import type { Server as HttpServer } from "http"
import { auth } from "../config/auth.js"

let io: SocketIOServer | null = null

export function initRealtime(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN?.split(",").map((o) => o.trim()) ?? [
        "http://localhost:5173",
      ],
      credentials: true,
    },
  })

  io.use(async (socket: Socket, next) => {
    try {
      const headers = new Headers()
      for (const [key, value] of Object.entries(socket.request.headers)) {
        if (typeof value === "string") headers.set(key, value)
        else if (Array.isArray(value)) headers.set(key, value.join(", "))
      }
      const session = await auth.api.getSession({ headers })
      if (!session) {
        next(new Error("unauthorized"))
        return
      }
      next()
    } catch {
      next(new Error("unauthorized"))
    }
  })

  io.on("connection", (socket: Socket) => {
    socket.join("board")
  })

  return io
}

export function getIO(): SocketIOServer | null {
  return io
}
