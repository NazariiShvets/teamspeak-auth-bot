import { TeamSpeak } from "ts3-nodejs-library";

import { ConfigService } from "../config";
import { LoggerService } from "../logger.service";
import { PokeClientWithLinkForWGAuthUsecase } from "../modules/wg-auth/usecases/poke-client-with-link-for-wg-auth.usecase";
import { TeamSpeakChannelRepository } from "../db";

export class TeamSpeakBotService {
    constructor(
        private readonly logger: LoggerService,
        private readonly configService: ConfigService,

    ) {
        this.configService = configService;
    }

    public async connect(config: Partial<TeamSpeak.ConnectionParams> = {}) {
        const connectionConfig: Partial<TeamSpeak.ConnectionParams> = {
            host: this.configService.config.TEAMSPEAK_HOST,
            serverport: this.configService.config.TEAMSPEAK_SERVERPORT,
            username: this.configService.config.TEAMSPEAK_USERNAME,
            password: this.configService.config.TEAMSPEAK_PASSWORD,
            nickname: this.configService.config.TEAMSPEAK_NICKNAME,
            ...config,
        }

        try {
            this.logger.info(`[TeamSpeakBotService] Connecting to TeamSpeak ${connectionConfig.host}...`);

            const teamspeak = await TeamSpeak.connect(connectionConfig)

            this.logger.info(`[TeamSpeakBotService] Connected to TeamSpeak`);

            return teamspeak;
        } catch (error) {
            this.logger.error(`[TeamSpeakBotService] Failed to connect to TeamSpeak ${connectionConfig.host}.\n${error}`);

            throw error;
        }
    }

    public listen(
        teamspeakServer: TeamSpeak,
        pokeClientWithLinkForWGAuthUsecase: PokeClientWithLinkForWGAuthUsecase,
        teamSpeakChannelRepository: TeamSpeakChannelRepository
    ) {
        teamspeakServer.on("clientmoved", async ({ channel, client }) => {
            if (teamSpeakChannelRepository.isAuthorizationChannel(channel)) {
                pokeClientWithLinkForWGAuthUsecase.execute({ tsClient: client });
            }
        });
    }
}