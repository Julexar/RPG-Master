import { psql } from "../psql.ts";
import { NotFoundError, DuplicateError } from "../../custom/errors";
const query = psql.query;

interface armor {
    id: number;
    name: string;
    description: string;
    source: string;
    type_id: number;
    rarity_id: number;
    stats: JSON;
}