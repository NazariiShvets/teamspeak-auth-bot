import { Request, Response, Application } from "express";

import { InMemoryDBRepository, TeamSpeakChannelRepository } from "../../db";
import { ConfigService } from "../../config";
import z from "zod";
import { LoggerService } from "../../logger.service";
import { AssignWN8GroupsToTSClientUsecase } from "./usecases/assign-wn8-groups-to-ts-client.usecase";

const RedirectToWGAuthRouteParamsSchema = z.object({
    uuid: z.string().uuid(),
});

const SuccessWGAuthRouteParamsSchema = z.object({
    uuid: z.string().uuid(),
});
const SuccessWGAuthRouteQuerySchema = z.object({
    nickname: z.string(),
    account_id: z.string(),
});

export class WGAuthController {
    constructor(
        private readonly dbRepository: InMemoryDBRepository,
        private readonly teamSpeakChannelRepository: TeamSpeakChannelRepository,
        private readonly logger: LoggerService,
        private readonly assignWN8GroupsToTSClientUsecase: AssignWN8GroupsToTSClientUsecase
    ) { }

    public static ROUTES = {
        redirectToWGAuthRoute: {
            path: '/a/:uuid',
            createUrl: (configService: ConfigService, params: { uuid: string }) => {
                return `${configService.config.PUBLIC_URL}/a/${params.uuid}`;
            },
        },

        successWGAuthRoute: {
            path: '/success-auth/:uuid',
            createUrl: (configService: ConfigService, params: { uuid: string }) => {
                return `${configService.config.PUBLIC_URL}/success-auth/${params.uuid}`;
            },
        }
    }

    public setupRoutes(app: Application) {
        this.redirectToWGAuthRoute(app);
        this.successWGAuthRoute(app);
    }

    private redirectToWGAuthRoute(app: Application) {
        app.get(WGAuthController.ROUTES.redirectToWGAuthRoute.path, async (req: Request, res: Response) => {
            const params = RedirectToWGAuthRouteParamsSchema.safeParse(req.params);

            if (!params.success) {
                res.status(400).send("Param must be uuid");
                return;
            }

            const { uuid } = params.data;

            const tsClientUniqueID = await this.dbRepository.getTsClientUniqueIDByUUID(uuid);

            if (!tsClientUniqueID) {
                res.status(404).send("Client not found");
                return;
            }

            const url = await this.dbRepository.getURLByTsClientUniqueID(tsClientUniqueID);

            if (!url) {
                res.status(404).send("Client not found");
                return;
            }

            res.redirect(url);
        });
    }

    private successWGAuthRoute(app: Application) {
        app.get(WGAuthController.ROUTES.successWGAuthRoute.path, async (req: Request, res: Response) => {
            const params = SuccessWGAuthRouteParamsSchema.safeParse(req.params);

            if (!params.success) {
                res.status(400).send("Param must be uuid");
                return;
            }

            const { uuid } = params.data;

            const query = SuccessWGAuthRouteQuerySchema.safeParse(req.query);

            if (!query.success) {
                res.status(400).send("Query from WG Auth doesn't contain nickname or account_id");
                return;
            }

            const { nickname, account_id } = query.data;

            const uniqueIdentifier = await this.dbRepository.getTsClientUniqueIDByUUID(uuid);

            if (!uniqueIdentifier) {
                res.status(404).send("Client not found");
                return;
            }

            const client = await this.dbRepository.getTSClientByClientID(uniqueIdentifier);

            const {recentWN8} = await this.assignWN8GroupsToTSClientUsecase.execute({ accountId: account_id, tsClient: client });

            await client.edit({ clientDescription: `${nickname} (WN8: ${recentWN8})` });

            await client.poke(`${nickname} успешно авторизирован!`);

            const defaultChannel = this.teamSpeakChannelRepository.getDefaultChannel();

            if (defaultChannel) {
                await client.move(defaultChannel);
            } else {
                this.logger.error(`[WGAuthController] Authorization channel not found`);
            }


            res.send('Успешно авторизирован:' + nickname);
        });
    }
}