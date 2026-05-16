import { ZodSchema } from "zod";

export function validateSchema<T>(// generic
    schema : ZodSchema<T>,
    data : unknown,
){
    return schema.parse(data);
}