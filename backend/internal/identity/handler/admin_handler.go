package handler

import (
	"net/http"
	"strconv"
	"strings"

	"bokdy/internal/identity/dto"
	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"
	"bokdy/internal/identity/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminUserHandler struct {
	admin *service.AdminUserService
}

func NewAdminUserHandler(admin *service.AdminUserService) *AdminUserHandler {
	return &AdminUserHandler{admin: admin}
}

func (h *AdminUserHandler) RegisterAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/users/players", h.ListPlayers)
	admin.GET("/users/players/stats", h.PlayerStats)
	admin.GET("/users/players/:id", h.GetPlayer)
	admin.GET("/users/players/:id/summary", h.PlayerSummary)
	admin.GET("/users/owners", h.ListOwners)
	admin.GET("/users/owners/stats", h.OwnerStats)
	admin.GET("/users/owners/:id", h.GetOwner)
	admin.GET("/users/owners/:id/organizations", h.ListOrganizations)
	admin.GET("/users/admins", h.ListAdmins)
	admin.GET("/users/admins/stats", h.AdminStats)
	admin.GET("/users/admins/:id", h.GetAdmin)
	admin.POST("/users/:id/suspend", h.Suspend)
	admin.POST("/users/:id/restore", h.Restore)
	admin.POST("/users/:id/activate", h.Activate)
	admin.GET("/users/:id/sessions", h.ListSessions)
	admin.DELETE("/users/:id/sessions/:session_id", h.RevokeSession)
	admin.POST("/users/:id/sessions/revoke-all", h.RevokeAllSessions)
	admin.GET("/users/:id/permissions", h.ListPermissions)
	admin.GET("/users/:id/activity", h.ListActivity)
	admin.POST("/users/:id/reset-password", h.ResetPassword)
	admin.POST("/users/:id/force-email-verify", h.ForceEmailVerify)
}

type adminUserDTO struct {
	ID              string  `json:"id"`
	PublicID        string  `json:"public_id"`
	Email           string  `json:"email,omitempty"`
	DisplayName     string  `json:"display_name,omitempty"`
	FullName        string  `json:"full_name,omitempty"`
	Phone           string  `json:"phone,omitempty"`
	Status          string  `json:"status"`
	IsSystemAdmin   bool    `json:"is_system_admin"`
	LastLoginAt     *string `json:"last_login_at,omitempty"`
	EmailVerifiedAt *string `json:"email_verified_at,omitempty"`
	PhoneVerifiedAt *string `json:"phone_verified_at,omitempty"`
	CreatedAt       string  `json:"created_at,omitempty"`
}

type adminOwnerUserDTO struct {
	adminUserDTO
	StaffRole    string                   `json:"staff_role,omitempty"`
	StaffTitle   string                   `json:"staff_title,omitempty"`
	StaffStatus  string                   `json:"staff_status,omitempty"`
	PrimaryOrg   *adminUserOrganizationRef `json:"primary_organization,omitempty"`
}

type adminUserOrganizationRef struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	NameEn string `json:"name_en"`
	NameVi string `json:"name_vi"`
	Code   string `json:"code"`
}

type adminUserOrgDTO struct {
	OrganizationID string  `json:"organization_id"`
	StaffID        string  `json:"staff_id"`
	Name           string  `json:"name"`
	NameEn         string  `json:"name_en"`
	NameVi         string  `json:"name_vi"`
	Code           string  `json:"code"`
	StaffRole      string  `json:"staff_role"`
	StaffTitle     string  `json:"staff_title"`
	StaffStatus    string  `json:"staff_status"`
	BranchCount    int     `json:"branch_count"`
	JoinedAt       *string `json:"joined_at,omitempty"`
}

type adminUserStatsDTO struct {
	Total       int `json:"total"`
	Active      int `json:"active"`
	Suspended   int `json:"suspended"`
	Pending     int `json:"pending"`
	NewThisWeek int `json:"new_this_week"`
}

type adminPlayerSummaryDTO struct {
	BookingCount int `json:"booking_count"`
}

type adminUserPermissionsDTO struct {
	Roles []adminUserPermissionRoleDTO `json:"roles"`
}

type adminUserPermissionRoleDTO struct {
	RoleCode       string  `json:"role_code"`
	TenantID       *string `json:"tenant_id,omitempty"`
	OrganizationID *string `json:"organization_id,omitempty"`
}

type adminUserActivityDTO struct {
	ID        string  `json:"id"`
	EventType string  `json:"event_type"`
	IPAddress *string `json:"ip_address,omitempty"`
	UserAgent *string `json:"user_agent,omitempty"`
	CreatedAt string  `json:"created_at"`
}

type suspendUserRequest struct {
	Reason   string `json:"reason" binding:"required"`
	Note     string `json:"note"`
	Duration string `json:"duration"`
}

func (h *AdminUserHandler) ListPlayers(c *gin.Context) {
	status, ok := parseUserStatusQuery(c)
	if !ok {
		return
	}
	emailVerified := parseBoolQuery(c, "email_verified")
	items, err := h.admin.ListPlayers(c.Request.Context(), c.Query("q"), status, emailVerified, parseUserLimit(c))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]adminUserDTO, 0, len(items))
	for i := range items {
		out = append(out, toAdminUserDTO(items[i]))
	}
	httpx.OK(c, out)
}

func (h *AdminUserHandler) ListOwners(c *gin.Context) {
	status, ok := parseUserStatusQuery(c)
	if !ok {
		return
	}
	var staffRole *string
	if raw := strings.TrimSpace(c.Query("staff_role")); raw != "" {
		staffRole = &raw
	}
	var orgID *uuid.UUID
	if raw := strings.TrimSpace(c.Query("organization_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			httpx.Fail(c, apperr.CodeValidation, "invalid organization_id")
			return
		}
		orgID = &id
	}
	items, err := h.admin.ListOwners(c.Request.Context(), c.Query("q"), status, staffRole, orgID, parseUserLimit(c))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]adminOwnerUserDTO, 0, len(items))
	for i := range items {
		out = append(out, toAdminOwnerUserDTO(c, items[i]))
	}
	httpx.OK(c, out)
}

func (h *AdminUserHandler) ListAdmins(c *gin.Context) {
	status, ok := parseUserStatusQuery(c)
	if !ok {
		return
	}
	items, err := h.admin.ListAdmins(c.Request.Context(), c.Query("q"), status, parseUserLimit(c))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]adminUserDTO, 0, len(items))
	for i := range items {
		out = append(out, toAdminUserDTO(items[i]))
	}
	httpx.OK(c, out)
}

func (h *AdminUserHandler) PlayerStats(c *gin.Context) {
	stats, err := h.admin.PlayerStats(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminUserStatsDTO(stats))
}

func (h *AdminUserHandler) OwnerStats(c *gin.Context) {
	stats, err := h.admin.OwnerStats(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminUserStatsDTO(stats))
}

func (h *AdminUserHandler) AdminStats(c *gin.Context) {
	stats, err := h.admin.AdminStats(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminUserStatsDTO(stats))
}

func (h *AdminUserHandler) GetPlayer(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	row, err := h.admin.GetPlayer(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminUserDTO(*row))
}

func (h *AdminUserHandler) GetOwner(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	row, err := h.admin.GetOwner(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminOwnerUserDTO(c, *row))
}

func (h *AdminUserHandler) GetAdmin(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	row, err := h.admin.GetAdmin(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminUserDTO(*row))
}

func (h *AdminUserHandler) PlayerSummary(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	summary, err := h.admin.PlayerSummary(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, adminPlayerSummaryDTO{BookingCount: summary.BookingCount})
}

func (h *AdminUserHandler) Suspend(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	var req suspendUserRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	row, err := h.admin.Suspend(c.Request.Context(), id, req.Reason)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminUserDTO(*row))
}

func (h *AdminUserHandler) Restore(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	row, err := h.admin.Restore(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminUserDTO(*row))
}

func (h *AdminUserHandler) Activate(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	row, err := h.admin.Activate(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminUserDTO(*row))
}

func (h *AdminUserHandler) ListSessions(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	sessions, err := h.admin.ListSessions(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]dto.SessionDTO, 0, len(sessions))
	for _, session := range sessions {
		out = append(out, toSessionDTO(session))
	}
	httpx.OK(c, out)
}

func (h *AdminUserHandler) RevokeSession(c *gin.Context) {
	userID, ok := parseUserID(c)
	if !ok {
		return
	}
	sessionID, err := uuid.Parse(c.Param("session_id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeBadRequest, "invalid session id")
		return
	}
	if err := h.admin.RevokeSession(c.Request.Context(), userID, sessionID); err != nil {
		httpx.Error(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *AdminUserHandler) RevokeAllSessions(c *gin.Context) {
	userID, ok := parseUserID(c)
	if !ok {
		return
	}
	if err := h.admin.RevokeAllSessions(c.Request.Context(), userID); err != nil {
		httpx.Error(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *AdminUserHandler) ListOrganizations(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	rows, err := h.admin.ListOrganizations(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]adminUserOrgDTO, 0, len(rows))
	loc := i18n.FromContext(c.Request.Context())
	for _, row := range rows {
		out = append(out, adminUserOrgDTO{
			OrganizationID: row.OrganizationID.String(),
			StaffID:        row.StaffID.String(),
			Name:           i18n.DisplayName(loc, row.NameEn, row.NameVi),
			NameEn:         row.NameEn,
			NameVi:         row.NameVi,
			Code:           row.Code,
			StaffRole:      row.StaffRole,
			StaffTitle:     row.StaffTitle,
			StaffStatus:    row.StaffStatus,
			BranchCount:    row.BranchCount,
			JoinedAt:       row.JoinedAt,
		})
	}
	httpx.OK(c, out)
}

func (h *AdminUserHandler) ListPermissions(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	scope := strings.TrimSpace(c.Query("scope"))
	roles, err := h.admin.ListPermissions(c.Request.Context(), id, scope)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]adminUserPermissionRoleDTO, 0, len(roles))
	for _, role := range roles {
		d := adminUserPermissionRoleDTO{RoleCode: role.RoleCode}
		if role.TenantID != nil {
			s := role.TenantID.String()
			d.TenantID = &s
		}
		out = append(out, d)
	}
	httpx.OK(c, adminUserPermissionsDTO{Roles: out})
}

func (h *AdminUserHandler) ListActivity(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	rows, err := h.admin.ListActivity(c.Request.Context(), id, parseUserLimit(c))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]adminUserActivityDTO, 0, len(rows))
	for _, row := range rows {
		out = append(out, adminUserActivityDTO{
			ID: row.ID.String(), EventType: row.EventType, IPAddress: row.IPAddress,
			UserAgent: row.UserAgent, CreatedAt: row.CreatedAt,
		})
	}
	httpx.OK(c, out)
}

func (h *AdminUserHandler) ResetPassword(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	if err := h.admin.ResetPassword(c.Request.Context(), id); err != nil {
		httpx.Error(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *AdminUserHandler) ForceEmailVerify(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	row, err := h.admin.ForceEmailVerify(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminUserDTO(*row))
}

func parseUserID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeBadRequest, "invalid user id")
		return uuid.Nil, false
	}
	return id, true
}

func parseUserLimit(c *gin.Context) int {
	raw := c.Query("limit")
	if raw == "" {
		return 0
	}
	limit, err := strconv.Atoi(raw)
	if err != nil {
		return 0
	}
	return limit
}

func parseUserStatusQuery(c *gin.Context) (*entity.UserStatus, bool) {
	raw := strings.TrimSpace(c.Query("status"))
	if raw == "" {
		return nil, true
	}
	st, ok := service.ParseUserStatus(raw)
	if !ok {
		httpx.Fail(c, apperr.CodeValidation, "invalid status")
		return nil, false
	}
	return &st, true
}

func parseBoolQuery(c *gin.Context, key string) *bool {
	raw := strings.TrimSpace(c.Query(key))
	if raw == "" {
		return nil
	}
	switch raw {
	case "true", "1":
		v := true
		return &v
	case "false", "0":
		v := false
		return &v
	default:
		return nil
	}
}

func toAdminUserDTO(row repository.AdminUserRow) adminUserDTO {
	return adminUserDTO{
		ID: row.ID.String(), PublicID: row.PublicID, Email: row.Email,
		DisplayName: row.DisplayName, FullName: row.FullName, Phone: row.Phone,
		Status: row.Status, IsSystemAdmin: row.IsSystemAdmin,
		LastLoginAt: row.LastLoginAt, EmailVerifiedAt: row.EmailVerifiedAt,
		PhoneVerifiedAt: row.PhoneVerifiedAt, CreatedAt: row.CreatedAt,
	}
}

func toAdminOwnerUserDTO(c *gin.Context, row repository.AdminOwnerRow) adminOwnerUserDTO {
	d := adminOwnerUserDTO{
		adminUserDTO: toAdminUserDTO(row.AdminUserRow),
		StaffRole:    row.StaffRole,
		StaffTitle:   row.StaffTitle,
		StaffStatus:  row.StaffStatus,
	}
	if row.PrimaryOrgID != uuid.Nil {
		loc := i18n.FromContext(c.Request.Context())
		d.PrimaryOrg = &adminUserOrganizationRef{
			ID: row.PrimaryOrgID.String(), Code: row.PrimaryOrgCode,
			Name: i18n.DisplayName(loc, row.PrimaryOrgNameEn, row.PrimaryOrgNameVi),
			NameEn: row.PrimaryOrgNameEn, NameVi: row.PrimaryOrgNameVi,
		}
	}
	return d
}

func toAdminUserStatsDTO(stats repository.AdminUserDirectoryStats) adminUserStatsDTO {
	return adminUserStatsDTO{
		Total: stats.Total, Active: stats.Active, Suspended: stats.Suspended,
		Pending: stats.Pending, NewThisWeek: stats.NewThisWeek,
	}
}
