CREATE TABLE guild_town_inventories (
  guild_id TEXT NOT NULL REFERENCES guilds(id),
  building_type TEXT NOT NULL CHECK (building_type IN ('tent', 'bonfire')),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (guild_id, building_type)
);

CREATE TABLE guild_town_placements (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL REFERENCES guilds(id),
  building_type TEXT NOT NULL CHECK (building_type IN ('tent', 'bonfire')),
  x DOUBLE PRECISION NOT NULL CHECK (x >= 0),
  y DOUBLE PRECISION NOT NULL CHECK (y >= 0),
  width DOUBLE PRECISION NOT NULL CHECK (width > 0),
  z_index INTEGER NOT NULL CHECK (z_index >= 0),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX guild_town_placements_guild_id_z_index_idx ON guild_town_placements(guild_id, z_index);
