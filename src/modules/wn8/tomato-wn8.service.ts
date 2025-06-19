import axios, { AxiosResponse } from "axios";
import z from "zod";
import { WN8Service } from "./wn8.service";
import { ConfigService } from "../../config";

export class TomatoWN8StatsService implements WN8Service {
    constructor(
        private readonly configService: ConfigService
    ) { }

    private readonly instance = axios.create({
        baseURL: 'https://api.tomato.gg/dev/api-v2'
    })

    public async getRecentWN8StatsByAccountID(args: { accountId: string }) {
        const response: AxiosResponse<GetRecentWN8StatsByAccountIDResponse> = await this.instance.get(`/player/recents/${this.configService.config.WN8_REGION}/${args.accountId}?cache=false&battles=1000`);
        const data = this.recentWN8StatsSchema.parse(response.data);

        return data.data.battles["1000"].overall.wn8;
    }


    public async getOverallWN8StatsByAccountID(args: { accountId: string }) {
        const response: AxiosResponse<GetOverralWN8StatsByAccountIDResponse> = await this.instance.get(`/player/overall/${this.configService.config.WN8_REGION}/${args.accountId}?cache=false`);
        const data = this.overallWN8StatsSchema.parse(response.data);

        return { wn8: data.data.overallWN8, battlesCount: data.data.battles };
    }


    private readonly recentWN8StatsSchema = z.object({
        data: z.object({
            battles: z.object({
                "1000": z.object({
                    overall: z.object({
                        wn8: z.number(),
                    })
                })
            })
        })
    });

    private readonly overallWN8StatsSchema = z.object({
        data: z.object({
            overallWN8: z.number(),
            battles: z.number(),

        })
    })
}

type GetRecentWN8StatsByAccountIDResponse = {
    meta: {
        id: string;
        cached: boolean;
        status: "good";
    };
    data: {
        days: {}
        battles: {
            "1000": {
                overall: {
                    battles: number,
                    tankcount: number,
                    tier: number,
                    wn8: number,
                    wins: number,
                    losses: number,
                    totalDamage: number,
                    totalDamageReceived: number,
                    totalFrags: number,
                    totalDestroyed: number,
                    totalSurvived: number,
                    totalSpotted: number,
                    totalDef: number,
                    ratios: {
                        rDAMAGE: number,
                        rSPOT: number,
                        rFRAG: number,
                        rDEF: number,
                        rWIN: number
                    },
                    winrate: number,
                    lossrate: number,
                    dpg: number,
                    frags: number,
                    survival: number,
                    spots: number,
                    def: number,
                    kd: number,
                    dmgRatio: number
                },
                tankStats: any[]
            }
        }
    }
}


type GetOverralWN8StatsByAccountIDResponse = {
    meta: {
        id: string;
        cached: boolean;
        status: "good";
    };
    data: {
        server: string,
        id: number,
        battles: number,
        overallWN8: number,
        avgTier: number,
        wins: number,
        losses: number,
        draws: number,
        totalDamage: number,
        totalDamageReceived: number,
        totalFrags: number,
        totalDestroyed: number,
        totalSurvived: number,
        totalSpotted: number,
        totalCap: number,
        totalDef: number,
        totalXp: number,
        winrate: number,
        lossrate: number,
        drawrate: number,
        dpg: number,
        frags: number,
        survival: number,
        spots: number,
        cap: number,
        def: number,
        xp: number,
        kd: number,
        tanks: any[];
    }
}
