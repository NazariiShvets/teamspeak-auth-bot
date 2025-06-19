import { ConfigService } from "./config";
import { WebServerService } from "./server";
import { TeamSpeakBotService } from "./bot";

import { logger } from "./logger.service";
import { PokeClientWithLinkForWGAuthUsecase } from "./usecases/poke-client-with-link-for-wg-auth.usecase";
import { WGAuthController } from "./server/wg-auth";
import { InMemoryDBRepository, TeamSpeakChannelRepository } from "./db";

export async function run() {
    const configService = new ConfigService();
    const dbRepository = new InMemoryDBRepository();

    const teamspeakBotService = new TeamSpeakBotService(
        logger,
        configService,
    );

    const teamspeakServer = await teamspeakBotService.connect();

    const teamSpeakChannelRepository = new TeamSpeakChannelRepository(teamspeakServer, logger);
    await teamSpeakChannelRepository.loadChannels();

    const webserverService = new WebServerService(
        logger,
        configService,
        new WGAuthController(teamspeakServer, dbRepository, teamSpeakChannelRepository, logger)
    );

    await webserverService.start();

    teamspeakBotService.listen(
        teamspeakServer,
        new PokeClientWithLinkForWGAuthUsecase(configService, dbRepository, logger),
        teamSpeakChannelRepository
    );

}

run();