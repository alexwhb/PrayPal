import { createContext, useContext } from "react"
import io, { type Socket } from "socket.io-client"

let socket: Socket | null = null
let reconnectTimer: NodeJS.Timeout | null = null

export function connect() {
	if (socket?.connected) {
		console.log("Reusing existing connected socket")
		return socket
	}

	if (socket) {
		console.log("Cleaning up existing disconnected socket")
		socket.disconnect()
		socket = null
	}

	console.log("Creating new socket connection")
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