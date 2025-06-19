import { TeamSpeak, TeamSpeakChannel, TeamSpeakClient } from "ts3-nodejs-library";
import { LoggerService } from "../logger.service";

class TeamSpeakChannelRepository {
    private channels: TeamSpeakChannel[] = [];

    constructor(
        private readonly teamspeakServer: TeamSpeak,
        private readonly logger: LoggerService
    ) { }

    public async loadChannels() {
        this.logger.info("[TeamSpeakChannelRepository] Loading channels...");
        this.channels = await this.teamspeakServer.channelList();
        this.logger.info(`[TeamSpeakChannelRepository] Channels loaded: ${this.channels.length}`);
    }

    public getChannelByName(name: string) {
        return this.channels.find(channel => channel.name === name);
    }

    public isAuthorizationChannel(channel: TeamSpeakChannel) {
        const authorizationChannel = this.getAuthorizationChannel();

        if (!authorizationChannel) {
            return false;
        }

        return channel.name === authorizationChannel.name && channel.cid === authorizationChannel.cid;
    }

    public getAuthorizationChannel() {
        return this.getChannelByName("Authorization");
    }

    public getDefaultChannel() {
        return this.getChannelByName("Default Channel");
    }
}

class InMemoryDBRepository {
    private readonly CLIENT_ID_TO_UUID: Record<string, string> = {};
    private readonly CLIENT_ID_TO_TEAMSPEAK_CLIENTS: Record<string, TeamSpeakClient> = {};
    private readonly CLIENT_ID_TO_URL: Record<string, string> = {};

    public async getTsClientUniqueIDByUUID(uuid: string) {
        return this.CLIENT_ID_TO_UUID[uuid];
    }

    public async getTSClientByClientID(clientID: string) {
        return this.CLIENT_ID_TO_TEAMSPEAK_CLIENTS[clientID];
    }

    public async removeTSClientByClientID(clientID: string) {
        delete this.CLIENT_ID_TO_TEAMSPEAK_CLIENTS[clientID];
    }

    public async getURLByTsClientUniqueID(clientID: string) {
        return this.CLIENT_ID_TO_URL[clientID];
    }

    public async removeURLByTsClientUniqueID(clientID: string) {
        delete this.CLIENT_ID_TO_URL[clientID];
    }


    public async setUUIDByTSClientUniqueIdentifier(args: { uniqueIdentifier: string, uuid: string }) {
        this.CLIENT_ID_TO_UUID[args.uuid] = args.uniqueIdentifier;
    }

    public async setTSClientByClientID(clientID: string, tsClient: TeamSpeakClient) {
        this.CLIENT_ID_TO_TEAMSPEAK_CLIENTS[clientID] = tsClient;
    }

    public async setURLByClientID(clientID: string, url: string) {
        this.CLIENT_ID_TO_URL[clientID] = url;
    }
}



export {
    TeamSpeakChannelRepository,
    InMemoryDBRepository,
}