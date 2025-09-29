"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hello = void 0;
const hello = async (_event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Go Serverless v4! Your function executed successfully!',
        }),
    };
};
exports.hello = hello;
