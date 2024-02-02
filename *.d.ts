import { Armor, Character, Class, Command, Condition, Damagetype, Feats, ItemType, ItemRarity, Proficiency, Race, Senses, Server, Stats, Spell, Subclass, Subrace, User, Weapon } from "./database";
import { CustomError } from "./custom/errors";

type Config = { 
    token: string | undefined; 
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
    Command: Command;
    Condition: Condition;
    Damagetype: Damagetype;
    Feats: Feats;
    ItemType: ItemType;
    ItemRarity: ItemRarity;
    Proficiency: Proficiency;
    Race: typeof Race;
    Senses: Senses;
    Server: typeof Server;
    Stats: Stats;
    Spell: typeof Spell;
    Subclass: typeof Subclass;
    Subrace: typeof Subrace;
    User: typeof User;
    Weapon: typeof Weapon;
}

type Error = CustomError;