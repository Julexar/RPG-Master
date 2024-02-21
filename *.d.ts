import { Armor, Character, Class, Command, Condition, Damagetype, Feats, ItemType, ItemRarity, Proficiency, Race, Senses, Server, Stats, Spell, Subclass, Subrace, User, Weapon } from "./database";
import { CustomError } from "./custom/errors";

type Config = { 
    token: string; 
    default_prefix: string; 
    owners: string[]; 
    presence: { 
        activities: { 
            name: string; 
            type: number; 
        }[]; 
        status: string; 
    }; 
};

type Database = {
    Armor: Armor;
    Character: typeof Character;
    Class: typeof Class;
    Command: typeof Command;
    Condition: typeof Condition;
    Damagetype: typeof Damagetype;
    Feats: typeof Feats;
    ItemType: typeof ItemType;
    ItemRarity: typeof ItemRarity;
    Proficiency: typeof Proficiency;
    Race: typeof Race;
    Senses: typeof Senses;
    Server: typeof Server;
    Stats: typeof Stats;
    Spell: typeof Spell;
    Subclass: typeof Subclass;
    Subrace: typeof Subrace;
    User: typeof User;
    Weapon: typeof Weapon;
}

type Error = CustomError;

type Character = {
    id: bigint;
    user_id: bigint;
    name: string;
    portrait: string;
    ac: number;
    hp_current: number;
    hp_max: number;
    hp_temp: number;
    initiative: number;
    level: number;
    xp: number;
    currency: {
        cp: number;
        sp: number;
        ep: number;
        gp: number;
        pp: number;
    };
    race_id: bigint;
    subrace_id: bigint;
    class_id: bigint;
    subclass_id: bigint;
    class_level: number;
    multiclass: {
        class_id: bigint;
        level: number;
        enabled: boolean;
    }[] | null;
    created_at: Date;
    deleted_at: Date | null;
}

type Server = {
    id: bigint;
    name: string;
    gm_roleid: bigint;
    admin_roleid: bigint;
    mod_roleid: bigint;
    sumary_channelid: bigint;
    log_channelid: bigint;
    ping_roleid: bigint;
    hp_method: number;
    leveling_method: number;
    gm_edit: boolean;
    duplicate_sessions: boolean;
    print_logs: boolean;
}