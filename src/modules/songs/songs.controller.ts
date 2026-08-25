import type { Request, Response } from "express";
import songService from "./songs.service.js";

class SongController {
    public async create(request: Request, response: Response): Promise<Response> {
        const { title, tab } = request.body;
        const song = await songService.create({ title, tab });
        return response.status(201).json(song);
    }

    public async getSongs(_request: Request, response: Response): Promise<Response> {
        const songs = await songService.get();
        return response.status(200).json(songs);
    }

    public async cancel(request: Request, response: Response): Promise<Response> {
        const song = await songService.cancel(String(request.params.id));
        return response.status(200).json(song);
    }

    public async advance(_request: Request, response: Response): Promise<Response> {
        const queue = await songService.advance();
        return response.status(200).json(queue);
    }
}

export default new SongController();
