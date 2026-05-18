package guildtown

import (
	"context"
	"errors"
	"strings"
	"time"

	guilddomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/guild"
	guildtowndomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/guildtown"
)

var (
	ErrUnauthenticated          = errors.New("unauthenticated")
	ErrActiveMembershipNotFound = errors.New("active guild membership not found")
	ErrUnknownBuildingType      = errors.New("unknown guild town building type")
	ErrInsufficientInventory    = errors.New("insufficient guild town inventory")
)

type UseCase struct {
	repository Repository
	current    CurrentUserRepository
	guilds     GuildRepository
	ids        IDGenerator
	now        func() time.Time
}

type TownState struct {
	Buildings  []guildtowndomain.BuildingMaster
	Inventory  []guildtowndomain.InventoryItem
	Placements []guildtowndomain.Placement
}

type SavePlacementCommand struct {
	ID           guildtowndomain.PlacementID
	BuildingType guildtowndomain.BuildingType
	X            float64
	Y            float64
	Width        float64
	ZIndex       int
}

func NewUseCase(repository Repository, current CurrentUserRepository, guilds GuildRepository, ids IDGenerator) *UseCase {
	if repository == nil {
		panic("guild town repository is required")
	}
	if current == nil {
		panic("current user repository is required")
	}
	if guilds == nil {
		panic("guild repository is required")
	}
	if ids == nil {
		panic("guild town placement id generator is required")
	}

	return &UseCase{repository: repository, current: current, guilds: guilds, ids: ids, now: time.Now}
}

func (u *UseCase) GetTown(ctx context.Context, sessionToken string) (TownState, error) {
	guildID, err := u.requireGuildID(ctx, sessionToken)
	if err != nil {
		return TownState{}, err
	}

	inventory, err := u.repository.ListInventory(ctx, guildID)
	if err != nil {
		return TownState{}, err
	}
	placements, err := u.repository.ListPlacements(ctx, guildID)
	if err != nil {
		return TownState{}, err
	}

	return TownState{
		Buildings:  guildtowndomain.DefaultBuildingMasters,
		Inventory:  inventory,
		Placements: placements,
	}, nil
}

func (u *UseCase) SavePlacements(ctx context.Context, sessionToken string, commands []SavePlacementCommand) (TownState, error) {
	guildID, err := u.requireGuildID(ctx, sessionToken)
	if err != nil {
		return TownState{}, err
	}

	inventory, err := u.repository.ListInventory(ctx, guildID)
	if err != nil {
		return TownState{}, err
	}
	owned := make(map[guildtowndomain.BuildingType]int, len(inventory))
	for _, item := range inventory {
		owned[item.BuildingType] = item.Quantity
	}

	now := u.now()
	used := map[guildtowndomain.BuildingType]int{}
	placements := make([]guildtowndomain.Placement, 0, len(commands))
	for index, command := range commands {
		if _, ok := guildtowndomain.FindBuildingMaster(command.BuildingType); !ok {
			return TownState{}, ErrUnknownBuildingType
		}
		used[command.BuildingType]++
		if used[command.BuildingType] > owned[command.BuildingType] {
			return TownState{}, ErrInsufficientInventory
		}

		id := command.ID
		if id == "" {
			generatedID, err := u.ids.NewID()
			if err != nil {
				return TownState{}, err
			}
			id = guildtowndomain.PlacementID(generatedID)
		}
		placement, err := guildtowndomain.NewPlacement(guildtowndomain.Placement{
			ID:           id,
			GuildID:      guildID,
			BuildingType: command.BuildingType,
			X:            command.X,
			Y:            command.Y,
			Width:        command.Width,
			ZIndex:       index,
			CreatedAt:    now,
			UpdatedAt:    now,
		})
		if err != nil {
			return TownState{}, err
		}
		placements = append(placements, placement)
	}

	if err := u.repository.ReplacePlacements(ctx, guildID, placements); err != nil {
		return TownState{}, err
	}

	return u.GetTown(ctx, sessionToken)
}

func (u *UseCase) requireGuildID(ctx context.Context, sessionToken string) (guilddomain.ID, error) {
	if strings.TrimSpace(sessionToken) == "" {
		return "", ErrUnauthenticated
	}

	appUser, ok, err := u.current.FindUserBySessionToken(ctx, sessionToken, u.now())
	if err != nil {
		return "", err
	}
	if !ok {
		return "", ErrUnauthenticated
	}

	membership, ok, err := u.guilds.FindActiveMembershipByUserID(ctx, appUser.ID)
	if err != nil {
		return "", err
	}
	if !ok {
		return "", ErrActiveMembershipNotFound
	}

	return membership.Guild.ID, nil
}
