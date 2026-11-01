import { db, } from "./client.js";
async function main() {
    // Seed default subscription plans
    await db.subscriptionPlanConfig.upsert({
        where: { id: "monthly-premium" },
        update: {},
        create: {
            id: "monthly-premium",
            name: "Monthly Premium",
            price: 499,
            currency: "INR",
            durationDays: 30,
            active: true,
        },
    });
    await db.subscriptionPlanConfig.upsert({
        where: { id: "yearly-premium" },
        update: {},
        create: {
            id: "yearly-premium",
            name: "Yearly Premium",
            price: 1999,
            currency: "INR",
            durationDays: 365,
            active: true,
        },
    });
    const existing = await db.user.findUnique({
        where: {
            email: "demo@ted.com",
        },
    });
    if (existing) {
        console.log("Demo user already exists");
        return;
    }
    await db.user.create({
        data: {
            email: "demo@ted.com",
            fullName: "Demo Ted",
        },
    });
    console.log("Database seeded successfully with plans and demo user");
}
main().finally(async () => {
    await db.$disconnect();
});
