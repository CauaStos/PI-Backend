import mongoose, { Schema } from "mongoose";
import { SONG_STATUSES, type ISong } from "./songs.types.js";

const songSchema = new Schema<ISong>(
    {
        title: { type: String, required: true, trim: true, maxlength: 160 },
        tab: { type: Schema.Types.ObjectId, ref: "Tab", required: true },
        tabName: { type: String, required: true, trim: true },
        status: { type: String, enum: SONG_STATUSES, required: true, default: "queued" },
        position: { type: Number, default: null },
        requestedAt: { type: Date, required: true, default: Date.now },
        startedAt: { type: Date, default: null },
        finishedAt: { type: Date, default: null },
        cancelledAt: { type: Date, default: null },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret: Record<string, unknown>) => {
                ret["id"] = ret["_id"];
                delete ret["_id"];
            },
        },
    }
);

songSchema.index({ status: 1, position: 1, requestedAt: 1 });

const Song = mongoose.model<ISong>("Song", songSchema);

export default Song;
