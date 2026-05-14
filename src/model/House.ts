export interface HouseMember {
    userId: string;
    name?: string;
    weight: number;
}

export interface House {
    houseId: string;
    name: string;
    members: HouseMember[];
    createdAt: string;
    updatedAt: string;
}
