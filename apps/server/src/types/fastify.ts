import "@fastify/cookie";

declare module "fastify" {
    interface FastifyRequest {
        cookies: { [cookieName: string]: string | undefined };
        user ? : {
            userId : string;
            email? : string;
            fullName? : string;
        }
    }
}