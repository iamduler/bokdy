package service

import (
	"context"
	"errors"
	"time"

	"bokdy/db/generated/sqlc"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func SkillBelongs(levelSport, sport uuid.UUID) bool {
	return sport != uuid.Nil && levelSport == sport
}

type PlayerProfileView struct {
	Bio                   string `json:"bio"`
	PreferredPlayingTimes string `json:"preferred_playing_times"`
	PreferredLocations    string `json:"preferred_locations"`
	Visibility            string `json:"visibility"`
	IsOpenToInvitations   bool   `json:"is_open_to_invitations"`
	IsDiscoverable        bool   `json:"is_discoverable"`
	IsActivityVisible     bool   `json:"is_activity_visible"`
}

type PlayerProfileInput struct {
	Bio                   string `json:"bio"`
	PreferredPlayingTimes string `json:"preferred_playing_times"`
	PreferredLocations    string `json:"preferred_locations"`
	Visibility            string `json:"visibility"`
	IsOpenToInvitations   bool   `json:"is_open_to_invitations"`
	IsDiscoverable        bool   `json:"is_discoverable"`
	IsActivityVisible     bool   `json:"is_activity_visible"`
}

func parseVisibility(raw string) (dbsqlc.IdentityProfileVisibility, error) {
	switch dbsqlc.IdentityProfileVisibility(raw) {
	case dbsqlc.IdentityProfileVisibilityPublic, dbsqlc.IdentityProfileVisibilityMembers, dbsqlc.IdentityProfileVisibilityPrivate:
		return dbsqlc.IdentityProfileVisibility(raw), nil
	default:
		return "", apperr.Validation("invalid visibility")
	}
}

func (s *AuthService) GetPlayerProfile(ctx context.Context, userID uuid.UUID) (PlayerProfileView, error) {
	q, err := s.queries()
	if err != nil {
		return PlayerProfileView{}, err
	}
	row, err := q.GetPlayerProfile(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlayerProfileView{Visibility: "members", IsOpenToInvitations: true, IsDiscoverable: true, IsActivityVisible: true}, nil
		}
		return PlayerProfileView{}, apperr.Wrap(err, apperr.CodeInternal, "player profile")
	}
	return PlayerProfileView{
		Bio: row.Bio, PreferredPlayingTimes: row.PreferredPlayingTimes, PreferredLocations: row.PreferredLocations,
		Visibility: row.Visibility, IsOpenToInvitations: row.IsOpenToInvitations, IsDiscoverable: row.IsDiscoverable,
		IsActivityVisible: row.IsActivityVisible,
	}, nil
}

func (s *AuthService) SavePlayerProfile(ctx context.Context, userID uuid.UUID, in PlayerProfileInput) error {
	q, err := s.queries()
	if err != nil {
		return err
	}
	visibility, err := parseVisibility(in.Visibility)
	if err != nil {
		return err
	}
	return q.UpsertPlayerProfile(ctx, dbsqlc.UpsertPlayerProfileParams{
		ID: id.MustNewUUID(), UserID: userID, Bio: strPtr(in.Bio),
		PreferredPlayingTimes: strPtr(in.PreferredPlayingTimes), PreferredLocations: strPtr(in.PreferredLocations),
		Column6: visibility, IsOpenToInvitations: in.IsOpenToInvitations, IsDiscoverable: in.IsDiscoverable,
		IsActivityVisible: in.IsActivityVisible,
	})
}

func (s *AuthService) ListSportProfiles(ctx context.Context, userID uuid.UUID) ([]dbsqlc.ListPlayerSportProfilesRow, error) {
	q, err := s.queries()
	if err != nil {
		return nil, err
	}
	return q.ListPlayerSportProfiles(ctx, userID)
}

func (s *AuthService) SaveSportProfile(ctx context.Context, userID, sportID, skillID uuid.UUID, hand, style, experience string) error {
	q, err := s.queries()
	if err != nil {
		return err
	}
	levels, err := q.ListSkillLevelsBySport(ctx, sportID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "skill levels")
	}
	ok := false
	for _, level := range levels {
		if level.ID == skillID && SkillBelongs(level.SportID, sportID) {
			ok = true
			break
		}
	}
	if !ok {
		return apperr.Validation("skill level does not belong to the sport")
	}
	return q.UpsertPlayerSportProfile(ctx, dbsqlc.UpsertPlayerSportProfileParams{
		ID: id.MustNewUUID(), UserID: userID, SportID: sportID, SkillLevelID: skillID,
		DominantHand: strPtr(hand), PlayingStyle: strPtr(style), Experience: strPtr(experience),
	})
}

func (s *AuthService) DeleteSportProfile(ctx context.Context, userID, sportID uuid.UUID) error {
	q, err := s.queries()
	if err != nil {
		return err
	}
	return q.DeletePlayerSportProfile(ctx, dbsqlc.DeletePlayerSportProfileParams{UserID: userID, SportID: sportID})
}

func (s *AuthService) ListSkillCatalog(ctx context.Context) ([]dbsqlc.ListSportsWithSkillsRow, error) {
	q, err := s.queries()
	if err != nil {
		return nil, err
	}
	return q.ListSportsWithSkills(ctx)
}

func (s *AuthService) ListFavorites(ctx context.Context, userID uuid.UUID) ([]dbsqlc.ListPlayerFavoritesRow, error) {
	q, err := s.queries()
	if err != nil {
		return nil, err
	}
	return q.ListPlayerFavorites(ctx, userID)
}

func (s *AuthService) AddFavorite(ctx context.Context, userID uuid.UUID, targetType string, targetID uuid.UUID) error {
	if targetType != "branch" && targetType != "court" {
		return apperr.Validation("invalid favorite target")
	}
	q, err := s.queries()
	if err != nil {
		return err
	}
	return q.AddPlayerFavorite(ctx, dbsqlc.AddPlayerFavoriteParams{
		ID: id.MustNewUUID(), UserID: userID, Column3: dbsqlc.IdentityFavoriteTarget(targetType), TargetID: targetID,
	})
}

func (s *AuthService) RemoveFavorite(ctx context.Context, userID uuid.UUID, targetType string, targetID uuid.UUID) error {
	q, err := s.queries()
	if err != nil {
		return err
	}
	return q.DeletePlayerFavorite(ctx, dbsqlc.DeletePlayerFavoriteParams{UserID: userID, Column2: dbsqlc.IdentityFavoriteTarget(targetType), TargetID: targetID})
}

func (s *AuthService) PlayerActivity(ctx context.Context, userID uuid.UUID) (dbsqlc.PlayerActivitySummaryRow, error) {
	q, err := s.queries()
	if err != nil {
		return dbsqlc.PlayerActivitySummaryRow{}, err
	}
	row, err := q.PlayerActivitySummary(ctx, &userID)
	if err != nil {
		return dbsqlc.PlayerActivitySummaryRow{}, apperr.Wrap(err, apperr.CodeInternal, "player activity")
	}
	return row, nil
}

func (s *AuthService) ViewPlayer(ctx context.Context, viewer, target uuid.UUID) (PlayerProfileView, error) {
	view, err := s.GetPlayerProfile(ctx, target)
	if err != nil {
		return PlayerProfileView{}, err
	}
	return RedactPlayerProfile(view, viewer == target), nil
}

func strPtr(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

type AdminEmployeeInput struct {
	EmployeeCode     string `json:"employee_code"`
	Department       string `json:"department"`
	JobTitle         string `json:"job_title"`
	ManagerUserID    string `json:"manager_user_id"`
	WorkEmail        string `json:"work_email"`
	WorkPhone        string `json:"work_phone"`
	EmploymentStatus string `json:"employment_status"`
	MFARequired      bool   `json:"mfa_required"`
}

func (s *AuthService) GetAdminEmployee(ctx context.Context, userID uuid.UUID) (dbsqlc.GetPlatformAdminProfileRow, error) {
	q, err := s.queries()
	if err != nil {
		return dbsqlc.GetPlatformAdminProfileRow{}, err
	}
	row, err := q.GetPlatformAdminProfile(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return dbsqlc.GetPlatformAdminProfileRow{UserID: userID, EmploymentStatus: "active"}, nil
	}
	return row, err
}

func (s *AuthService) SaveAdminEmployee(ctx context.Context, actor, userID uuid.UUID, in AdminEmployeeInput) error {
	if actor == userID && in.MFARequired {
		current, err := s.GetAdminEmployee(ctx, userID)
		if err != nil {
			return err
		}
		if !current.IsMfaRequired {
			return apperr.New(apperr.CodeForbidden, "cannot change your own platform security policy")
		}
	}
	status := dbsqlc.IdentityEmploymentStatus(in.EmploymentStatus)
	switch status {
	case dbsqlc.IdentityEmploymentStatusActive, dbsqlc.IdentityEmploymentStatusLeave, dbsqlc.IdentityEmploymentStatusDeactivated:
	default:
		return apperr.Validation("invalid employment status")
	}
	var manager *uuid.UUID
	if in.ManagerUserID != "" {
		parsed, err := uuid.Parse(in.ManagerUserID)
		if err != nil {
			return apperr.Validation("invalid manager")
		}
		manager = &parsed
	}
	q, err := s.queries()
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	var deactivated *time.Time
	if status == dbsqlc.IdentityEmploymentStatusDeactivated {
		deactivated = &now
	}
	return q.UpsertPlatformAdminProfile(ctx, dbsqlc.UpsertPlatformAdminProfileParams{
		ID: id.MustNewUUID(), UserID: userID, EmployeeCode: strPtr(in.EmployeeCode), Department: strPtr(in.Department),
		JobTitle: strPtr(in.JobTitle), ManagerUserID: manager, WorkEmail: strPtr(in.WorkEmail), WorkPhone: strPtr(in.WorkPhone),
		Column9: status, IsMfaRequired: in.MFARequired, AssignedAt: &now, DeactivatedAt: deactivated,
	})
}
