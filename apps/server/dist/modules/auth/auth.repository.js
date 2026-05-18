const users = [];
export async function findUserByEmail(email) {
    return users.find((user) => user.email === email);
}
export async function createUser(user) {
    users.push(user);
    return user;
}
