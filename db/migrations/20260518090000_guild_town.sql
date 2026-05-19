-- Create "guild_town_inventories" table
CREATE TABLE "guild_town_inventories" (
  "guild_id" text NOT NULL,
  "building_type" text NOT NULL,
  "quantity" integer NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  PRIMARY KEY ("guild_id", "building_type"),
  CONSTRAINT "guild_town_inventories_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "guild_town_inventories_building_type_check" CHECK (building_type IN ('tent', 'bonfire')),
  CONSTRAINT "guild_town_inventories_quantity_check" CHECK (quantity >= 0)
);
-- Seed MVP guild town inventory for existing guilds
INSERT INTO "guild_town_inventories" ("guild_id", "building_type", "quantity", "created_at", "updated_at")
SELECT "id", 'tent', 2, '2026-05-18T00:00:00Z', '2026-05-18T00:00:00Z'
FROM "guilds";
INSERT INTO "guild_town_inventories" ("guild_id", "building_type", "quantity", "created_at", "updated_at")
SELECT "id", 'bonfire', 3, '2026-05-18T00:00:00Z', '2026-05-18T00:00:00Z'
FROM "guilds";
-- Create "guild_town_placements" table
CREATE TABLE "guild_town_placements" (
  "id" text NOT NULL,
  "guild_id" text NOT NULL,
  "building_type" text NOT NULL,
  "x" double precision NOT NULL,
  "y" double precision NOT NULL,
  "width" double precision NOT NULL,
  "z_index" integer NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "guild_town_placements_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "guild_town_placements_building_type_check" CHECK (building_type IN ('tent', 'bonfire')),
  CONSTRAINT "guild_town_placements_width_check" CHECK (width > 0),
  CONSTRAINT "guild_town_placements_x_check" CHECK (x >= 0),
  CONSTRAINT "guild_town_placements_y_check" CHECK (y >= 0),
  CONSTRAINT "guild_town_placements_z_index_check" CHECK (z_index >= 0)
);
-- Create index "guild_town_placements_guild_id_z_index_idx" to table: "guild_town_placements"
CREATE INDEX "guild_town_placements_guild_id_z_index_idx" ON "guild_town_placements" ("guild_id", "z_index");
