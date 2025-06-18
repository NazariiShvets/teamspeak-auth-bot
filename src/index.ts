import { TeamSpeak, QueryProtocol,type TeamSpeak as TeamSpeakType, ResponseError,TeamSpeakClient, TeamSpeakServerGroup } from "ts3-nodejs-library";
import express, { Request, Response } from 'express';
import { v4 } from "uuid";

const AUTHORIZATION_CHANNEL_NAME="Authorization";

import dotenv from "dotenv";
dotenv.config();

const PORT = 3000;


const APPLICATION_ID = process.env.APPLICATION_ID!;
let PUBLIC_URL = process.env.PUBLIC_URL!;

if(PUBLIC_URL.includes("localhost")) {
    PUBLIC_URL = `${PUBLIC_URL}:${PORT}`;
}

const TEAMSPEAK_HOST = process.env.TEAMSPEAK_HOST!;
const TEAMSPEAK_USERNAME = process.env.TEAMSPEAK_USERNAME!;
const TEAMSPEAK_PASSWORD = process.env.TEAMSPEAK_PASSWORD!;
const TEAMSPEAK_NICKNAME = process.env.TEAMSPEAK_NICKNAME!;

export function run() {
    //create a new connection
    TeamSpeak.connect({
        host: TEAMSPEAK_HOST,
        serverport: 9987,
        username: TEAMSPEAK_USERNAME,
        password: TEAMSPEAK_PASSWORD,
        nickname: TEAMSPEAK_NICKNAME
    }).then(async teamspeak => {
        const app = express();

        const CLIENT_ID_TO_UUID: Record<string, string> = {};
        const CLIENT_ID_TO_TEAMSPEAK_CLIENTS: Record<string, TeamSpeakClient> = {};
        const CLIENT_ID_TO_URL: Record<string, string> = {};
        const CLIENT_ID_TO_WG_INFO: Record<string, { nickname: string, account_id: string }> = {};

        app.get('/', (req: Request, res: Response) => {
            res.send('Hello, world!');
        });

        app.get('/a/:uuid', (req: Request, res: Response) => {
            const { uuid } = req.params;
            const CLIENT_ID = Object.entries(CLIENT_ID_TO_UUID).find(([_, v]) => v === uuid)?.[0];
  
            if(!CLIENT_ID) {
                res.status(404).send("Client not found");
                return;
            }

            const url = CLIENT_ID_TO_URL[CLIENT_ID];

            if(!url) {
                res.status(404).send("Client not found");
                return;
            }

            res.redirect(url);
        });
    
        app.get('/success-auth/:uuid', async (req: Request, res: Response) => {
            const { uuid } = req.params;
            const { nickname, account_id } = req.query as { nickname: string, account_id: string };

            const uniqueIdentifier = Object.entries(CLIENT_ID_TO_UUID).find(([_, v]) => v === uuid)?.[0];
  
            if(!uniqueIdentifier) {
                res.status(404).send("Client not found");
                return;
            }

            CLIENT_ID_TO_WG_INFO[uniqueIdentifier] = { nickname, account_id };

            const client = CLIENT_ID_TO_TEAMSPEAK_CLIENTS[uniqueIdentifier];
            const groups = await teamspeak.serverGroupList();
            const WN8 = 2200;
            const groupsWithWN8 = [
                { condition: WN8 < 500, group: 'Рак' },
                { condition: WN8 < 900, group: 'Говно'},
                { condition: WN8 < 1700, group: 'Моча'},
                { condition: WN8 < 2700, group: 'Зелень'},
                { condition: WN8 < 3650, group: 'Бірюза'},
                { condition: WN8 >= 3650, group: 'Фіолет' }
            ];

            const resolvedGroup = groupsWithWN8.find(group => group.condition);

            if(resolvedGroup) {
                const group = groups.find(group => group.name === resolvedGroup.group)!;
                await client.addGroups([group]);
                client.poke(`${nickname} успешно авторизирован!`);
            }


            res.send('Успешно авторизирован:' + nickname);
        });
    
        app.listen(PORT, () => {
            console.log(`Server is running at ${PUBLIC_URL}`);
        });

         teamspeak.on("clientmoved", async ({channel,client}) => {
            if(channel.name !== AUTHORIZATION_CHANNEL_NAME) {
                return;
            }

            const uuid = v4();
            CLIENT_ID_TO_UUID[client.uniqueIdentifier] = uuid;

            const URL_FOR_AUTH = new URL("https://api.worldoftanks.eu/wot/auth/login/");
            URL_FOR_AUTH.searchParams.set("application_id", APPLICATION_ID);
            URL_FOR_AUTH.searchParams.set("redirect_uri", `${PUBLIC_URL}/success-auth/${uuid}`);

            CLIENT_ID_TO_TEAMSPEAK_CLIENTS[client.uniqueIdentifier] = client;
            CLIENT_ID_TO_URL[client.uniqueIdentifier] = URL_FOR_AUTH.toString();

            client.poke("Нажмите на ссылку на WG авторизацию");
            client.poke(`${PUBLIC_URL}/a/${uuid}`);
            client.poke("Cсылка действительна в течении 1 часа"); 
         });
        
    }).catch(e => {
        console.log("Catched an error!")
        console.error(e)
    })
}

run();