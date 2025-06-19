import { ConfigService } from "./config";
import { TeamSpeakBotService } from "./bot";

import { logger } from "./logger.service";
import { PokeClientWithLinkForWGAuthUsecase } from "./modules/wg-auth/usecases/poke-client-with-link-for-wg-auth.usecase";
import { InMemoryDBRepository, TeamSpeakChannelRepository } from "./db";
import { TomatoWN8StatsService } from "./modules/wn8/tomato-wn8.service";
import { WGAuthController } from "./modules/wg-auth/wg-auth.controller";
import { WebServerService } from "./server/webserver.service";
import { AssignWN8GroupsToTSClientUsecase } from "./modules/wg-auth/usecases/assign-wn8-groups-to-ts-client.usecase";

export async function run() {
    const configService = new ConfigService();
    const dbRepository = new InMemoryDBRepository();

    const teamspeakBotService = new TeamSpeakBotService(
        logger,
        configService,
    );

    const wn8Service = new TomatoWN8StatsService(configService);

    const teamspeakServer = await teamspeakBotService.connect();

    const teamSpeakChannelRepository = new TeamSpeakChannelRepository(teamspeakServer, logger);
    await teamSpeakChannelRepository.loadChannels();

    const webserverService = new WebServerService(
        logger,
        configService,
        new WGAuthController(
            dbRepository,
            teamSpeakChannelRepository,
            logger,
            new AssignWN8GroupsToTSClientUsecase(wn8Service, teamspeakServer)
        )
    );

    await webserverService.start();

    teamspeakBotService.listen(
        teamspeakServer,
        new PokeClientWithLinkForWGAuthUsecase(configService, dbRepository, logger),
        teamSpeakChannelRepository
    );

}

run();