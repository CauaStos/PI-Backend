import swaggerJsdoc from "swagger-jsdoc";


const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Karaoke API",
            version: "1.0.0",
            description: "API para gerenciamento de um sistema para karaokes.",
        },

        servers: [
            {
                url: "http://localhost:3000/api/v1",
            },
        ],
        components: {
            schemas: {
                Product: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            example: 1,
                        },
                        name: {
                            type: "string",
                            example: "Coca-Cola",
                        },
                        price: {
                            type: "number",
                            example: 7.5,
                        },
                        description: {
                            type: "string",
                            example: "Refrigerante Coca-cola"
                        },
                        stock: {
                            type: "integer",
                            example: 10,
                        },
                    },
                },
            },
        },
    },

    apis: [
        "./src/modules/**/*.routes.ts",
    ],
};

export const swaggerSpec = swaggerJsdoc(options);