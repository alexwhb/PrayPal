import { createContext, useContext } from "react"
import io, { type Socket } from "socket.io-client"

let socket: Socket | null = null
let reconnectTimer: NodeJS.Timeout | null = null
let currentUserId: string | null = null

export function connect(userId?: string) {
	// If we already have a connected socket with the same user, reuse it
	if (socket?.connected && userId === currentUserId) {
		console.log("Reusing existing connected socket for user:", userId)
		return socket
	}

	// Clean up existing socket if it exists
	if (socket) {
		console.log("Cleaning up existing socket")
		socket.disconnect()
		socket = null
	}

	// Store the current user ID
	if (userId) {
		currentUserId = userId
	}

	console.log("Creating new socket connection for user:", userId)
	socket = io(
		process.env.NODE_ENV === "production" 
			? "https://your-app.fly.dev" 
			: "http://localhost:3000",
		{
			withCredentials: true,
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			reconnectionAttempts: 5
		}
	)

	socket.on("connect", () => {
		console.log("Socket connected")
		if (userId) {
			socket?.emit('set-user-id', userId)
		}
	})

	socket.on("disconnect", (reason) => {
		console.log("Socket disconnected:", reason)
		if (reason === "io server disconnect") {
			// Reconnect if server initiated disconnect
			if (reconnectTimer) clearTimeout(reconnectTimer)
			reconnectTimer = setTimeout(() => {
				console.log("Attempting to reconnect...")
				socket?.connect()
			}, 1000)
		}
	})

	socket.on("user-typing", (data) => {
		// Broadcast to all users in the conversation except the sender
		socket.to(data.conversationId).emit("user-typing", {
			userId: data.userId,
			username: data.username,
			conversationId: data.conversationId
		})
	})

	return socket
}

export function disconnect() {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer)
		reconnectTimer = null
	}
	if (socket) {
		socket.disconnect()
		socket = null
	}
}

export const SocketContext = createContext<Socket | undefined>(undefined)

export function useSocket() {
	return useContext(SocketContext)
}