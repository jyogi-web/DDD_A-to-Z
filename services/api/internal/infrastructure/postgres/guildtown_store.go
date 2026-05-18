package postgres

import (
	"context"
	"time"

	guilddomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/guild"
	guildtowndomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/guildtown"
	"gorm.io/gorm"
)

type GuildTownStore struct {
	db *gorm.DB
}

func NewGuildTownStore(db *gorm.DB) *GuildTownStore {
	return &GuildTownStore{db: db}
}

func (s *GuildTownStore) ListInventory(ctx context.Context, guildID guilddomain.ID) ([]guildtowndomain.InventoryItem, error) {
	var records []guildTownInventoryRecord
	if err := s.db.WithContext(ctx).Raw(`
		SELECT guild_id, building_type, quantity, created_at, updated_at
		FROM guild_town_inventories
		WHERE guild_id = ?
		ORDER BY building_type ASC
	`, guildID).Scan(&records).Error; err != nil {
		return nil, err
	}

	items := make([]guildtowndomain.InventoryItem, 0, len(records))
	for _, record := range records {
		item, err := record.toDomain()
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, nil
}

func (s *GuildTownStore) ListPlacements(ctx context.Context, guildID guilddomain.ID) ([]guildtowndomain.Placement, error) {
	var records []guildTownPlacementRecord
	if err := s.db.WithContext(ctx).Raw(`
		SELECT id, guild_id, building_type, x, y, width, z_index, created_at, updated_at
		FROM guild_town_placements
		WHERE guild_id = ?
		ORDER BY z_index ASC, created_at ASC, id ASC
	`, guildID).Scan(&records).Error; err != nil {
		return nil, err
	}

	placements := make([]guildtowndomain.Placement, 0, len(records))
	for _, record := range records {
		placement, err := record.toDomain()
		if err != nil {
			return nil, err
		}
		placements = append(placements, placement)
	}

	return placements, nil
}

func (s *GuildTownStore) ReplacePlacements(ctx context.Context, guildID guilddomain.ID, placements []guildtowndomain.Placement) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(`DELETE FROM guild_town_placements WHERE guild_id = ?`, guildID).Error; err != nil {
			return err
		}

		for _, placement := range placements {
			if err := tx.Exec(`
				INSERT INTO guild_town_placements (
					id, guild_id, building_type, x, y, width, z_index, created_at, updated_at
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`, placement.ID, guildID, placement.BuildingType, placement.X, placement.Y, placement.Width, placement.ZIndex, placement.CreatedAt, placement.UpdatedAt).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

type guildTownInventoryRecord struct {
	GuildID      guilddomain.ID               `gorm:"column:guild_id"`
	BuildingType guildtowndomain.BuildingType `gorm:"column:building_type"`
	Quantity     int                          `gorm:"column:quantity"`
	CreatedAt    time.Time                    `gorm:"column:created_at"`
	UpdatedAt    time.Time                    `gorm:"column:updated_at"`
}

func (r guildTownInventoryRecord) toDomain() (guildtowndomain.InventoryItem, error) {
	return guildtowndomain.NewInventoryItem(guildtowndomain.InventoryItem{
		GuildID:      r.GuildID,
		BuildingType: r.BuildingType,
		Quantity:     r.Quantity,
		CreatedAt:    r.CreatedAt,
		UpdatedAt:    r.UpdatedAt,
	})
}

type guildTownPlacementRecord struct {
	ID           guildtowndomain.PlacementID  `gorm:"column:id"`
	GuildID      guilddomain.ID               `gorm:"column:guild_id"`
	BuildingType guildtowndomain.BuildingType `gorm:"column:building_type"`
	X            float64                      `gorm:"column:x"`
	Y            float64                      `gorm:"column:y"`
	Width        float64                      `gorm:"column:width"`
	ZIndex       int                          `gorm:"column:z_index"`
	CreatedAt    time.Time                    `gorm:"column:created_at"`
	UpdatedAt    time.Time                    `gorm:"column:updated_at"`
}

func (r guildTownPlacementRecord) toDomain() (guildtowndomain.Placement, error) {
	return guildtowndomain.NewPlacement(guildtowndomain.Placement{
		ID:           r.ID,
		GuildID:      r.GuildID,
		BuildingType: r.BuildingType,
		X:            r.X,
		Y:            r.Y,
		Width:        r.Width,
		ZIndex:       r.ZIndex,
		CreatedAt:    r.CreatedAt,
		UpdatedAt:    r.UpdatedAt,
	})
}
