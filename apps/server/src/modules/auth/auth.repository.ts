type User = {
    id : string;
    name : string;
    email : string;
    password : string;
};

const users : User[] = [];

export async function findUserByEmail(
    email : string,
){
    return users.find(
        (user) => user.email === email
    );
}

export async function createUser(
    user : User,
){
    users.push(user);
    return user;
}