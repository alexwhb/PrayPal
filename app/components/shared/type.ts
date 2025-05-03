import { type loader } from '#app/routes/_app+/_sharable+/share.board.tsx'

export type ShareType = Awaited<ReturnType<typeof loader>>['items'][number]