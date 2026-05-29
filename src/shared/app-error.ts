/**
 * Erro de aplicacao com status HTTP associado.
 *
 * Os services lancam AppError para sinalizar falhas de regra de negocio
 * (ex.: "Comanda nao esta aberta", 409). O error.middleware traduz qualquer
 * AppError em uma resposta HTTP uniforme.
 */
export class AppError extends Error {
    public readonly status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "AppError";
        this.status = status;
    }
}
