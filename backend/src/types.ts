export interface MappingTable {
    mysql_fields: string[];
    postgres_fields: string[];
}

export interface Mapping {
    tables: Record<string, MappingTable>;
}