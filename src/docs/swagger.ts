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
                        id: { type: "string", example: "60d0fe4f5311236168a109ca" },
                        name: { type: "string", example: "Coca-Cola" },
                        price: { type: "number", example: 7.5 },
                        description: { type: "string", example: "Refrigerante Coca-cola" },
                        image: { type: "string", format: "uri", example: "data:image/png;base64,..." },
                        stock: { type: "integer", example: 10 },
                    },
                },
                Employee: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "60d0fe4f5311236168a109cb" },
                        name: { type: "string", example: "João Silva" },
                        email: { type: "string", example: "joao@karaoke.com" },
                        role: { type: "string", example: "garcom" },
                        avatar: { type: "string", example: "https://avatar.url/joao.png" },
                    },
                },
                TabMember: {
                    type: "object",
                    properties: {
                        employee: { type: "string", example: "60d0fe4f5311236168a109cb" },
                        name: { type: "string", example: "João Silva" },
                        avatar: { type: "string", example: "https://avatar.url/joao.png" },
                    }
                },
                Tab: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "60d0fe4f5311236168a109cc" },
                        tableName: { type: "string", example: "Mesa 04" },
                        status: { type: "string", example: "open" },
                        members: {
                            type: "array",
                            items: { $ref: "#/components/schemas/TabMember" }
                        },
                        orders: {
                            type: "array",
                            items: { type: "string", example: "60d0fe4f5311236168a109cd" }
                        },
                        openedAt: { type: "string", format: "date-time" },
                        closedAt: { type: "string", format: "date-time", nullable: true },
                    },
                },
                Order: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "60d0fe4f5311236168a109cd" },
                        tab: { type: "string", example: "60d0fe4f5311236168a109cc" },
                        product: { type: "string", example: "60d0fe4f5311236168a109ca" },
                        productName: { type: "string", example: "Coca-Cola" },
                        unitPrice: { type: "number", example: 7.5 },
                        employee: { type: "string", example: "60d0fe4f5311236168a109cb" },
                        employeeName: { type: "string", example: "João Silva" },
                        employeeAvatar: { type: "string", example: "https://avatar.url/joao.png" },
                        quantity: { type: "integer", example: 2 },
                        status: { type: "string", example: "in_progress" },
                        orderedAt: { type: "string", format: "date-time" },
                        deliveredAt: { type: "string", format: "date-time", nullable: true },
                    },
                },
                Song: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "60d0fe4f5311236168a109ce" },
                        title: { type: "string", example: "Evidencias - Chitaozinho & Xororo" },
                        tab: { type: "string", example: "60d0fe4f5311236168a109cc" },
                        tabName: { type: "string", example: "Mesa 04" },
                        status: { type: "string", example: "queued" },
                        position: { type: "integer", example: 2, nullable: true },
                        requestedAt: { type: "string", format: "date-time" },
                        startedAt: { type: "string", format: "date-time", nullable: true },
                    },
                },
            },
        },
    },
    apis: ["./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
