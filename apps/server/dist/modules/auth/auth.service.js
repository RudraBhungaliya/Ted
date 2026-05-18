import { randomUUID } from "crypto";
import { createUser, findUserByEmail, } from "./auth.repository.js";
import { hashPassword, comparePassword, } from "../../lib/hash.js";
import { generateAccessToken, } from "../../lib/jwt.js";
import { BadRequestError, UnauthorizedError, } from "../../utils/error.js";
export async function signup(data) {
    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
        throw new BadRequestError("Email already in use");
    }
    const hashedPassword = await hashPassword(data.password);
    const user = await createUser({
        id: randomUUID(),
        name: data.name,
        email: data.email,
        password: hashedPassword,
    });
    const accessToken = generateAccessToken({
        userId: user.id,
    });
    const refreshToken = generateAccessToken({
        userId: user.id,
    });
    return {
        accessToken,
        refreshToken,
        user,
    };
}
export async function login(data) {
    const user = await findUserByEmail(data.email);
    if (!user) {
        throw new UnauthorizedError("Invalid email or password");
    }
    const validPassword = await comparePassword(data.password, user.password);
    if (!validPassword) {
        throw new UnauthorizedError("Invalid email or password");
    }
    const accessToken = generateAccessToken({
        userId: user.id,
    });
    const refreshToken = generateAccessToken({
        userId: user.id,
    });
    return {
        accessToken,
        refreshToken,
        user,
    };
}
