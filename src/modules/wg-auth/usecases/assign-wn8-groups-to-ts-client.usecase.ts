import { TeamSpeak, TeamSpeakClient, TeamSpeakServerGroup } from "ts3-nodejs-library";
import { WN8Service } from "../../wn8/wn8.service";
import { BATTLES_COUNT_GROUPS, OVERALL_WN8_GROUPS, RECENT_WN8_GROUPS } from "../../../db/seeds/groups/groups.config";

export class AssignWN8GroupsToTSClientUsecase {
    constructor(
        private readonly wn8Service: WN8Service,
        private readonly teamspeakServer: TeamSpeak,
    ) { }

    public async execute({ accountId, tsClient }: AssignGroupsToTSClientBasedOnWN8UsecaseArgs) {
        const [recentWN8, { wn8: overallWN8, battlesCount }] = await Promise.all([
            this.wn8Service.getRecentWN8StatsByAccountID({ accountId }),
            this.wn8Service.getOverallWN8StatsByAccountID({ accountId })
        ]);

        const serverGroups = await this.teamspeakServer.serverGroupList();

        const isGrow = recentWN8 > overallWN8;

        const battlesCountGroup = this.getBattlesCountGroup(battlesCount, serverGroups);
        const overallWN8Group = this.getOverallWN8Group(overallWN8, serverGroups);
        const recentWN8Group = this.getRecentWN8Group(recentWN8, serverGroups, isGrow);

        const relevantGroupsSgids = [OVERALL_WN8_GROUPS, RECENT_WN8_GROUPS, BATTLES_COUNT_GROUPS]
            .flatMap(obj => Object.values(obj))
            .map(groupName => serverGroups.find(group => group.name === groupName))
            .filter((group): group is TeamSpeakServerGroup => !!group)
            .map(group => group.sgid);

        const groupsToAdd = [battlesCountGroup, overallWN8Group, recentWN8Group]
            .filter(group => !!group)
            .map(group => group.sgid);

        const possibleGroupsToRemove = relevantGroupsSgids.filter(sgid => !groupsToAdd.includes(sgid));

        const DEFAULT_NORMAL_GROUP_SGID = '4';

        const groupsToRemove = tsClient.servergroups.filter(sgid => possibleGroupsToRemove.includes(sgid)).filter(sgid => sgid !== DEFAULT_NORMAL_GROUP_SGID);

        const newGroupsToAdd = groupsToAdd.filter(groupsSgid => !tsClient.servergroups.includes(groupsSgid));

        if (groupsToRemove.length > 0) {
            await tsClient.delGroups(groupsToRemove);
        }
        if (newGroupsToAdd.length > 0) {
            await tsClient.addGroups(newGroupsToAdd);
        }

        return {
            overallWN8,
            recentWN8,
            battlesCount,
        }
    }

    private getBattlesCountGroup(battlesCount: number, groups: TeamSpeakServerGroup[]): TeamSpeakServerGroup | null {
        for (const count of [
            { count: 4999, group: BATTLES_COUNT_GROUPS.lessThan5k },
            { count: 5000, group: BATTLES_COUNT_GROUPS.moreThan5k },
            { count: 10000, group: BATTLES_COUNT_GROUPS.moreThan10k },
            { count: 15000, group: BATTLES_COUNT_GROUPS.moreThan15k },
            { count: 20000, group: BATTLES_COUNT_GROUPS.moreThan20k },
            { count: 25000, group: BATTLES_COUNT_GROUPS.moreThan25k },
            { count: 30000, group: BATTLES_COUNT_GROUPS.moreThan30k },
            { count: 35000, group: BATTLES_COUNT_GROUPS.moreThan35k },
            { count: 40000, group: BATTLES_COUNT_GROUPS.moreThan40k },
            { count: 45000, group: BATTLES_COUNT_GROUPS.moreThan45k },
            { count: 50000, group: BATTLES_COUNT_GROUPS.moreThan50k },
            { count: 55000, group: BATTLES_COUNT_GROUPS.moreThan55k },
            { count: 60000, group: BATTLES_COUNT_GROUPS.moreThan60k },
            { count: 65000, group: BATTLES_COUNT_GROUPS.moreThan65k },
            { count: 70000, group: BATTLES_COUNT_GROUPS.moreThan70k },
            { count: 75000, group: BATTLES_COUNT_GROUPS.moreThan75k },
            { count: 80000, group: BATTLES_COUNT_GROUPS.moreThan80k },
            { count: 85000, group: BATTLES_COUNT_GROUPS.moreThan85k },
            { count: 90000, group: BATTLES_COUNT_GROUPS.moreThan90k },
        ]) {
            if (battlesCount < count.count) {
                return groups.find(group => group.name === count.group.name) ?? null;
            }
        }

        return groups.find(group => group.name === BATTLES_COUNT_GROUPS.moreThan95k.name) ?? null;
    }

    private getOverallWN8Group(overallWN8: number, groups: TeamSpeakServerGroup[]): TeamSpeakServerGroup | null {
        for (const [name, group] of entries(this.WN8_GROUP_NAME_TO_NUMBER)) {
            if (overallWN8 > group.from && overallWN8 < group.to) {
                const groupName = OVERALL_WN8_GROUPS[name].name;

                return groups.find(group => group.name === groupName) ?? null;
            }
        }

        return null;
    }

    private getRecentWN8Group(recentWN8: number, groups: TeamSpeakServerGroup[], isGrow: boolean): TeamSpeakServerGroup | null {
        for (const [name, group] of entries(this.WN8_GROUP_NAME_TO_NUMBER)) {
            if (recentWN8 > group.from && recentWN8 < group.to) {
                const groupKey = (isGrow ? `${name}_up` : `${name}_down`) as `${typeof name}_${'up' | 'down'}`;
                const groupName = RECENT_WN8_GROUPS[groupKey].name;

                return groups.find(group => group.name === groupName) ?? null;
            }
        }

        return null;
    }

    private WN8_GROUP_NAME_TO_NUMBER = {
        purple: {
            from: 3714,
            to: Infinity,
        },
        blue: {
            from: 2695,
            to: 3714,
        },
        green: {
            from: 1736,
            to: 2695,
        },
        yellow: {
            from: 1107,
            to: 1736,
        },
        orange: {
            from: 595,
            to: 1107,
        },
        red: {
            from: 0,
            to: 595,
        },
    } as const;

   
}

type AssignGroupsToTSClientBasedOnWN8UsecaseArgs = {
    accountId: string;
    tsClient: TeamSpeakClient;
}

function entries<T extends Record<string, any>>(obj: T) {
    return Object.entries(obj) as [keyof T, T[keyof T]][];
}