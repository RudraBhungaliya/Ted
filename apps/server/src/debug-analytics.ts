import { db } from "./db/client.js";

async function run() {
  try {
    const user = await db.user.findUnique({
      where: { email: "rud28b@gmail.com" },
    });
    if (!user) {
      console.log("User rud28b@gmail.com not found in database.");
      return;
    }
    
    console.log("Found user:", user.fullName, "(", user.id, ")");
    
    const sessions = await db.session.findMany({
      where: { userId: user.id },
      include: {
        analytics: true,
        summary: true,
        _count: {
          select: { transcripts: true }
        }
      }
    });
    
    console.log("Sessions count:", sessions.length);
    console.log("Sessions detail:", JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error("Query failed:", err);
  }
}

run();
