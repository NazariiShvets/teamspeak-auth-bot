import z from "zod";

export const EnvConfigSchema = z.object({
    APPLICATION_ID: z
        .string()
        .describe("The ID of the application"),

    TEAMSPEAK_HOST: z.string()
        .refine(host => host.includes("."), {
            message: "The host of the TeamSpeak server must contain a dot"
        })
        .describe("The host of the TeamSpeak server"),

    TEAMSPEAK_USERNAME: z
        .string()
        .describe("The username that you get from ServerQuery Login"),

    TEAMSPEAK_PASSWORD: z
        .string()
        .describe("The password that you get from ServerQuery Login"),

    TEAMSPEAK_NICKNAME: z
        .string()
        .describe("The nickname for ServerQuery of the TeamSpeak servers"),

    TEAMSPEAK_SERVERPORT: z
        .coerce.number()
        .default(9987)
        .describe("The port for the TeamSpeak servers to connect to. Default port for voice is 9987"),

    PUBLIC_URL: z
        .string()
        .describe("The public URL of the application")
        .refine(url => !url.endsWith('/'), {
            message: "The public URL must not end with a slash"
        })
        .refine(url => url.startsWith("http") || url.startsWith("https"), {
            message: "The public URL must start with http or https"
        })
        .default("http://localhost"),

    LOCAL_SERVER_PORT: z
        .coerce.number()
        .default(3000)
        .describe("The port for the local server to run on. Default port is 3000"),
});

export type EnvConfig = z.infer<typeof EnvConfigSchema>;