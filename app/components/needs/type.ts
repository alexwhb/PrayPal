import { type loader } from '#app/routes/_needs+/needs.board.tsx'

export type Need = Awaited<ReturnType<typeof loader>>['needs'][number]