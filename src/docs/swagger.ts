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
    },

    apis: [
        "./src/modules/**/*.routes.ts",
    ],
};
