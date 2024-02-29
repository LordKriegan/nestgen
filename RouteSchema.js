export const RouteSchema = {
    type: "object",
    properties: {
        appName: {
            type: "string",
            required: true
        },
        packageType: {
            type: "string",
            enum: ["npm", "yarn"]
        },
        skipPackageInstallation: {
            type: "boolean",
        },
        children: {
            type: "array",
            required: true,
            items: {
                type: "object",
                id: "/Route",
                properties: {
                    routePrefix: {
                        type: "string",
                        required: true
                    },
                    routes: {
                        type: "array",
                        items: {
                            routeName: {
                                type: "string",
                                required: true
                            },
                            functionName: {
                                type: "string",
                                required: true
                            },
                            requestType: {
                                type: "string",
                                required: true,
                                enum: ["GET", "PUT", "POST", "DELETE"]
                            },
                            headers: {
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            },
                            body: {
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            },
                            query: {
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            },
                        }
                    },
                    children: {
                        type: "array",
                        required: false,
                        items: {
                                $ref: "/Route"
                        }
                    }
                }
            }
        }
    }
}