import dotenv from "dotenv";
import { EnvConfig, EnvConfigSchema } from "./env.schema";
import { logger } from "../logger.service";

export class ConfigService {
    public readonly config: EnvConfig;

    constructor() {
        logger.info("[ConfigService] Reading envs...");
        dotenv.config();
        logger.info("[ConfigService] Env vars loaded");

        logger.info("[ConfigService] Parsing envs...");
        this.config = EnvConfigSchema.parse(process.env);
        logger.info("[ConfigService] Env vars parsed");

        this.fixConfigDefaultValues();
    }

    private fixConfigDefaultValues() {
        this.fixPublicURLIfLocalhost();
    }
    

    private fixPublicURLIfLocalhost() {
        if(this.config.PUBLIC_URL.includes("localhost")) {
            this.config.PUBLIC_URL = `${this.config.PUBLIC_URL}:${this.config.LOCAL_SERVER_PORT}`;
        }
    }
}

