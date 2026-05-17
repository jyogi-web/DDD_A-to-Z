// Package guild owns guild concepts used by game use cases.
package guild

import (
	"errors"
	"strings"
	"time"

	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/user"
)

type ID string

type Guild struct {
	ID          ID
	Slug        string
	Name        string
	Description string
	Icon        string
	Color       string
	SortOrder   int
	MemberCount int64
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type MembershipID string

type Membership struct {
	ID        MembershipID
	UserID    user.ID
	GuildID   ID
	JoinedAt  time.Time
	LeftAt    *time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

type MembershipWithGuild struct {
	Membership Membership
	Guild      Guild
}

func NewGuild(guild Guild) (Guild, error) {
	if guild.ID == "" {
		return Guild{}, errors.New("guild id is required")
	}
	if strings.TrimSpace(guild.Slug) == "" {
		return Guild{}, errors.New("guild slug is required")
	}
	if strings.TrimSpace(guild.Name) == "" {
		return Guild{}, errors.New("guild name is required")
	}
	if strings.TrimSpace(guild.Description) == "" {
		return Guild{}, errors.New("guild description is required")
	}
	if strings.TrimSpace(guild.Icon) == "" {
		return Guild{}, errors.New("guild icon is required")
	}
	if !isHexColor(guild.Color) {
		return Guild{}, errors.New("guild color must be a 6-digit hex color")
	}
	if guild.SortOrder < 0 {
		return Guild{}, errors.New("guild sort order cannot be negative")
	}
	if guild.MemberCount < 0 {
		return Guild{}, errors.New("guild member count cannot be negative")
	}
	if guild.CreatedAt.IsZero() {
		return Guild{}, errors.New("guild created at is required")
	}
	if guild.UpdatedAt.IsZero() {
		return Guild{}, errors.New("guild updated at is required")
	}

	return guild, nil
}

func NewMembership(membership Membership) (Membership, error) {
	if membership.ID == "" {
		return Membership{}, errors.New("guild membership id is required")
	}
	if membership.UserID == "" {
		return Membership{}, errors.New("guild membership user id is required")
	}
	if membership.GuildID == "" {
		return Membership{}, errors.New("guild membership guild id is required")
	}
	if membership.JoinedAt.IsZero() {
		return Membership{}, errors.New("guild membership joined at is required")
	}
	if membership.LeftAt != nil && membership.LeftAt.Before(membership.JoinedAt) {
		return Membership{}, errors.New("guild membership left at cannot be before joined at")
	}
	if membership.CreatedAt.IsZero() {
		return Membership{}, errors.New("guild membership created at is required")
	}
	if membership.UpdatedAt.IsZero() {
		return Membership{}, errors.New("guild membership updated at is required")
	}

	return membership, nil
}

func (m Membership) Active() bool {
	return m.LeftAt == nil
}

func (m Membership) Leave(now time.Time) (Membership, error) {
	if now.IsZero() {
		return Membership{}, errors.New("leave time is required")
	}
	if !m.Active() {
		return Membership{}, errors.New("guild membership is already left")
	}

	leftAt := now
	m.LeftAt = &leftAt
	m.UpdatedAt = now

	return NewMembership(m)
}

func isHexColor(value string) bool {
	if len(value) != 7 || value[0] != '#' {
		return false
	}

	for _, char := range value[1:] {
		if !isHexDigit(char) {
			return false
		}
	}

	return true
}

func isHexDigit(char rune) bool {
	return (char >= '0' && char <= '9') ||
		(char >= 'a' && char <= 'f') ||
		(char >= 'A' && char <= 'F')
}
