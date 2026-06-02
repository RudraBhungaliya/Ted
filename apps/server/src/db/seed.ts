import {
    db,
} from "./client.js";

async function main(){
    const existing = await db.user.findUnique({
        where : {
            email : "demo@ted.com",
        },
    });

    if(existing){
        console.log("User already exists");
        return;
    }

    await db.user.create({
        data : {
            email : "demo@ted.com",
            fullName : "Demo Ted",
        },
    });

    console.log("User created");
}

main().finally(async () => {
    await db.$disconnect();
});

