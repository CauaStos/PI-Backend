import type { Types } from "mongoose";
import type { TabStatus } from "../../shared/status.js";

export interface ITabMember {
    employee: Types.ObjectId;
    name: string;
    avatar: string;
}

export interface ITab {
    tableName: string;
    status: TabStatus;
    members: ITabMember[];
    orders: Types.ObjectId[];
    openedAt: Date;
    closedAt: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICreateTabDTO {
    tableName: string;
    memberIds?: string[];
}

export interface IUpdateTabDTO {
    tableName?: string;
    status?: TabStatus;
}
