import { TeamSpeak, TeamSpeakClient, TeamSpeakServerGroup } from "ts3-nodejs-library";
import { WN8Service } from "../../wn8/wn8.service";

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

        const relevantGroupsSgids = [this.OVERALL_WN8_GROUPS, this.RECENT_WN8_GROUPS, this.BATTLES_COUNT_GROUPS]
            .flatMap(obj => Object.values(obj))
            .map(groupName => serverGroups.find(group => group.name === groupName))
            .filter((group): group is TeamSpeakServerGroup => !!group)
            .map(group => group.sgid);

        const groupsToAdd = [battlesCountGroup, overallWN8Group, recentWN8Group]
            .filter(group => !!group)
            .map(group => group.sgid);

        const possibleGroupsToRemove = relevantGroupsSgids.filter(sgid => !groupsToAdd.includes(sgid));
        const groupsToRemove = tsClient.servergroups.filter(sgid => possibleGroupsToRemove.includes(sgid));

        const newGroupsToAdd = groupsToAdd.filter(groupsSgid => !tsClient.servergroups.includes(groupsSgid));

        if (groupsToRemove.length > 0) {
            await tsClient.delGroups(groupsToRemove);
        }
        if (newGroupsToAdd.length > 0) {
            await tsClient.addGroups(newGroupsToAdd);
        }
    }

    private getBattlesCountGroup(battlesCount: number, groups: TeamSpeakServerGroup[]): TeamSpeakServerGroup | null {
        for (const count of [
            { count: 5000, group: this.BATTLES_COUNT_GROUPS.lessThan5k },
            { count: 15000, group: this.BATTLES_COUNT_GROUPS.moreThan5k },
            { count: 30000, group: this.BATTLES_COUNT_GROUPS.moreThan15k },
            { count: 45000, group: this.BATTLES_COUNT_GROUPS.moreThan30k }
        ]) {
            if (battlesCount < count.count) {
                return groups.find(group => group.name === count.group) ?? null;
            }
        }
        return groups.find(group => group.name === this.BATTLES_COUNT_GROUPS.moreThan45k) ?? null;
    }

    private getOverallWN8Group(overallWN8: number, groups: TeamSpeakServerGroup[]): TeamSpeakServerGroup | null {
        for (const [name, group] of entries(this.WN8_GROUP_NAME_TO_NUMBER)) {
            if (overallWN8 > group.from && overallWN8 < group.to) {
                const groupName = this.OVERALL_WN8_GROUPS[name];

                return groups.find(group => group.name === groupName) ?? null;
            }
        }

        return null;
    }

    private getRecentWN8Group(recentWN8: number, groups: TeamSpeakServerGroup[], isGrow: boolean): TeamSpeakServerGroup | null {
        for (const [name, group] of entries(this.WN8_GROUP_NAME_TO_NUMBER)) {
            if (recentWN8 > group.from && recentWN8 < group.to) {
                const groupKey = (isGrow ? `${name}_grow` : `${name}_fall`) as `${typeof name}_${'grow' | 'fall'}`;
                const groupName = this.RECENT_WN8_GROUPS[groupKey];

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

    private OVERALL_WN8_GROUPS = {
        purple: '╠• Уникальный Игрок',
        blue: '╠• Отличный Игрок',
        green: '╠• Хороший Игрок',
        yellow: '╠• Нормальный Игрок',
        orange: '╠• Игрок Ниже Среднего',
        red: '╠• Твинк либо Плохой Игрок',
    } as const;

    private RECENT_WN8_GROUPS = {
        purple_grow: '╠• Фиолет, растет',
        purple_fall: '╠• Фиолет, сливает',
        blue_grow: '╠• Бирюза, растет',
        blue_fall: '╠• Бирюза, сливает',
        green_grow: '╠• Зеленый, растет',
        green_fall: '╠• Зеленый, сливает',
        yellow_grow: '╠• Желтый, растет',
        yellow_fall: '╠• Желтый, сливает',
        orange_grow: '╠• Рыжий, растет',
        orange_fall: '╠• Рыжий,  сливает',
        red_grow: '╠• Красный, растет',
        red_fall: '╠• Красный, сливает',
    } as const;

    private BATTLES_COUNT_GROUPS = {
        lessThan5k: '╠• Менее 5к боев',
        moreThan5k: '╠• Более 5к боев',
        moreThan15k: '╠• Более 15к боев',
        moreThan30k: '╠• Более 30к боев',
        moreThan45k: '╠• Более 45к боев',
    } as const;
}

type AssignGroupsToTSClientBasedOnWN8UsecaseArgs = {
    accountId: string;
    tsClient: TeamSpeakClient;
}

function entries<T extends Record<string, any>>(obj: T) {
    return Object.entries(obj) as [keyof T, T[keyof T]][];
}