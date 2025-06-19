import { TeamSpeakClient } from "ts3-nodejs-library";
import { v4 } from "uuid";

import { ConfigService } from "../../../config";
import { InMemoryDBRepository } from "../../../db";
import { WGAuthController } from "../wg-auth.controller";
import { LoggerService } from "../../../logger.service";

export type GenerateLinkForWGAuthUsecaseArgs = {
    tsClient: TeamSpeakClient;
}

export class PokeClientWithLinkForWGAuthUsecase {
    constructor(
        private readonly configService: ConfigService,
        private readonly dbRepository: InMemoryDBRepository,
        private readonly logger: LoggerService
    ) {}

    public async execute({ tsClient }: GenerateLinkForWGAuthUsecaseArgs) {
        this.logger.info(`[PokeClientWithLinkForWGAuthUsecase] Poking client ${tsClient.nickname} with link for WG Auth`);

        const uuid = v4();
        await this.dbRepository.setUUIDByTSClientUniqueIdentifier({ uniqueIdentifier: tsClient.uniqueIdentifier, uuid });

        const URL_FOR_AUTH = new URL("https://api.worldoftanks.eu/wot/auth/login/");
        const redirectUri = WGAuthController.ROUTES.successWGAuthRoute.createUrl(this.configService, { uuid });

        URL_FOR_AUTH.searchParams.set("application_id", this.configService.config.APPLICATION_ID);
        URL_FOR_AUTH.searchParams.set("redirect_uri", redirectUri);

        await this.dbRepository.setTSClientByClientID(tsClient.uniqueIdentifier, tsClient);
        await this.dbRepository.setURLByClientID(tsClient.uniqueIdentifier, URL_FOR_AUTH.toString());

        const link = WGAuthController.ROUTES.redirectToWGAuthRoute.createUrl(this.configService, { uuid });

        tsClient.poke("Нажмите на ссылку на WG авторизацию");
        tsClient.poke(link);
        tsClient.poke("Cсылка действительна в течении 1 часа");

        this.logger.info(`[PokeClientWithLinkForWGAuthUsecase] Poked client ${tsClient.nickname} with link for WG Auth`);
    }
}