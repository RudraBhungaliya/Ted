export function validateSchema(// generic
schema, data) {
    return schema.parse(data);
}
