type Client = (data: any) => void;
let clients: Client[] = [];

export const subscribe = (fn: Client) => {
    clients.push(fn);
};

export const unsubscribe = (fn: Client) => {
    clients = clients.filter(c => c !== fn);
};

export const publish = (data: any) => {
    clients.forEach(fn => fn(data));
};
