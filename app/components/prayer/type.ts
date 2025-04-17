import { type loader } from '#app/routes/_prayer+/prayer.board.tsx'

export type Prayer = Awaited<ReturnType<typeof loader>>['prayers'][number]