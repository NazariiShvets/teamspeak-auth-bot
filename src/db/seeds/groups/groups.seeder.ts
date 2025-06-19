import { TeamSpeak } from "ts3-nodejs-library";
import { LoggerService } from "../../../logger.service";
import fs from "node:fs/promises";
import path from "node:path";

import { OVERALL_WN8_GROUPS, RECENT_WN8_GROUPS, BATTLES_COUNT_GROUPS } from "./groups.config";


class GroupsSeeder {
    constructor(
        private readonly teamspeakServer: TeamSpeak,
        private readonly logger: LoggerService,
    ) {}

    public async seed() {
        this.logger.info("[GroupsSeeder] Seeding groups...");
        const groups = await this.teamspeakServer.serverGroupList();

        const groupsToCreate = [...Object.values(OVERALL_WN8_GROUPS), ...Object.values(RECENT_WN8_GROUPS), ...Object.values(BATTLES_COUNT_GROUPS)];

        const leftToCreate = groupsToCreate.filter(group => !groups.some(g => g.name === group.name));
        const groupsAlreadyCreated = groups
            .filter(group => groupsToCreate.some(g => g.name === group.name))
            .map(group => ({ group, iconPath: groupsToCreate.find(g => g.name === group.name)!.iconPath }));

        this.logger.info(`[GroupsSeeder] Found ${leftToCreate.length} groups to create`);

        for await (const group of leftToCreate) {
            const newGroup = await this.teamspeakServer.serverGroupCreate(group.name);
            const pathToIcon = path.join(process.cwd(), group.iconPath);
            const iconAsBuffer = await fs.readFile(pathToIcon);
            const iconId = await this.teamspeakServer.uploadIcon(iconAsBuffer);
            await this.teamspeakServer.serverGroupAddPerm(newGroup.sgid, { permname: 'i_icon_id', permvalue: iconId, permskip: true });
        }
        this.logger.info(`[GroupsSeeder] All groups have been created`);


        for (const { group, iconPath } of groupsAlreadyCreated) {
            try {
                await group.getIconId();
            } catch (error) {
                this.logger.info(`Group ${group.name} does not have an icon, uploading...`);

                void fs.readFile(path.join(process.cwd(), iconPath))
                    .then(iconAsBuffer => this.teamspeakServer.uploadIcon(iconAsBuffer))
                    .then(
                        iconId => this.teamspeakServer.serverGroupAddPerm(group.sgid, { permname: 'i_icon_id', permvalue: iconId, permskip: true })
                    );

            }
        }
    }
}

export default GroupsSeeder;