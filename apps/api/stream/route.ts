let clients : ReadableStreamDefaultController[] = [];

export async function GET(){
    const stream = new ReadableStream({
        start(controller){
            clients.push(controller);
        },
        cancel(controller){
            clients = clients.filter(c => c !== controller);
        }
    });

    return new Response(stream, {
        headers : {
            "Content-Type" : "text/event-stream",
            "Cache-Control" : "no-cache",
            "connection" : "keep-alive",
        },
    });
}

export function sendToClients(data : any){
    clients.forEach(c => {
        c.enqueue(`data: ${JSON.stringify(data)}\n\n`);
    });
}