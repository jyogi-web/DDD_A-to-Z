package guildtown

import (
	"testing"
	"time"

	guilddomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/guild"
)

func TestNewInventoryItemRejectsUnknownBuildingType(t *testing.T) {
	now := time.Date(2026, 5, 18, 9, 0, 0, 0, time.UTC)

	_, err := NewInventoryItem(InventoryItem{
		GuildID:      guilddomain.ID("guild_go"),
		BuildingType: BuildingType("unknown"),
		Quantity:     1,
		CreatedAt:    now,
		UpdatedAt:    now,
	})
	if err == nil {
		t.Fatal("NewInventoryItem() error = nil, 期待値 error")
	}
}

func TestNewPlacementRejectsUnknownBuildingType(t *testing.T) {
	now := time.Date(2026, 5, 18, 9, 0, 0, 0, time.UTC)

	_, err := NewPlacement(Placement{
		ID:           PlacementID("placement_1"),
		GuildID:      guilddomain.ID("guild_go"),
		BuildingType: BuildingType("unknown"),
		X:            1,
		Y:            1,
		Width:        100,
		ZIndex:       0,
		CreatedAt:    now,
		UpdatedAt:    now,
	})
	if err == nil {
		t.Fatal("NewPlacement() error = nil, 期待値 error")
	}
}
