import type { Types } from "mongoose";

export const SONG_STATUSES = ["queued", "playing", "finished", "cancelled"] as const;

export type SongStatus = (typeof SONG_STATUSES)[number];

export interface ISong {
    title: string;
    tab: Types.ObjectId;
    tabName: string;
    status: SongStatus;
    position: number | null;
    requestedAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    cancelledAt: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICreateSongDTO {
    title: string;
    tab: string;
}
