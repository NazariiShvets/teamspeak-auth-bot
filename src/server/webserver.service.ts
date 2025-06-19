import express, { Request, Response } from 'express';

import { ConfigService } from "../config";
import { LoggerService } from "../logger.service";
import { WGAuthController } from './wg-auth';

export class WebServerService {
    constructor(
        private readonly logger: LoggerService,
        private readonly configService: ConfigService,
        private readonly wgAuthController: WGAuthController
    ) { }

    public async start() {
        this.logger.info(`[WebServerService] Starting web server...`);

        const app = express();

        this.setupRoutes(app);

        app.listen(this.configService.config.LOCAL_SERVER_PORT, () => {
            this.logger.info(`[WebServerService] Web server is running on port ${this.configService.config.LOCAL_SERVER_PORT}`);
        });
    }

    private setupRoutes(app: express.Application) {
        app.get('/', (req: Request, res: Response) => {
            res.send('Hello, world!');
        });

        this.wgAuthController.setupRoutes(app);
    }
}
