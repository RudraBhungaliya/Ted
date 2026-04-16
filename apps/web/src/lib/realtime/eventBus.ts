const clients : Record<string, ReadableStreamDefaultController[]> = {};

export function addClient(sessionId : string, controller : ReadableStreamDefaultController){
    if(!clients[sessionId]) clients[sessionId] = [];
    clients[sessionId].push(controller);
}

export function removeClient(sessionId : string, controller : ReadableStreamDefaultController){
    if(!clients[sessionId]) return;
    clients[sessionId] = clients[sessionId].filter(c => c !== controller);
}

export function emit(sessionId : string, data : any){
    const list = clients[sessionId];
    if(!list) return;

    list.forEach(c => {
        try{
            c.enqueue(`data : ${JSON.stringify(data)}\n\n`);
        }
        catch(err){ 
            // broken client
        }
    })


}