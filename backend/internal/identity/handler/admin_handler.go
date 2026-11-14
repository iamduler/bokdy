package handler

import (
	"io"
	"net/http"
	"strconv"
	"strings"

	bookinghandler "bokdy/internal/booking/handler"
	"bokdy/internal/identity/dto"
	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"
	"bokdy/internal/identity/service"
	orgservice "bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/listpage"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminUserHandler struct {
	admin    *service.AdminUserService
	orgs     *orgservice.OrganizationService
	bookings *bookinghandler.BookingHandler
}

func NewAdminUserHandler(admin *service.AdminUserService, orgs *orgservice.OrganizationService, bookings *bookinghandler.BookingHandler) *AdminUserHandler {
	return &AdminUserHandler{admin: admin, orgs: orgs, bookings: bookings}
}

func (h *AdminUserHandler) RegisterAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/users/players", h.ListPlayers)
	admin.POST("/users/players", h.CreatePlayer)
	admin.GET("/users/players/stats", h.PlayerStats)
	admin.GET("/users/players/:id", h.GetPlayer)
	admin.GET("/users/players/:id/summary", h.PlayerSummary)
	admin.GET("/users/players/:id/bookings", h.ListPlayerBookings)
	admin.GET("/users/owners", h.ListOwners)
	admin.POST("/users/owners", h.CreateOwner)
	admin.GET("/users/owners/stats", h.OwnerStats)
	admin.GET("/users/owners/:id", h.GetOwner)
	admin.GET("/users/owners/:id/organizations", h.ListOrganizations)
	admin.PATCH("/users/owners/:id/staff/:staff_id", h.ReplaceStaffRole)
	admin.GET("/users/admins", h.ListAdmins)
	admin.POST("/users/admins", h.CreateAdmin)
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
	admin.POST("/users/:id/platform-roles", h.AssignPlatformRole)
	admin.POST("/users/:id/force-email-verify", h.ForceEmailVerify)
	admin.PATCH("/users/:id", h.UpdateProfile)
	admin.POST("/users/:id/media", h.UploadMedia)
}

type adminUserDTO struct {
	ID                    string  `json:"id"`
	PublicID              string  `json:"public_id"`
	Email                 string  `json:"email,omitempty"`
	DisplayName           string  `json:"display_name,omitempty"`
	FullName              string  `json:"full_name,omitempty"`
	FirstName             string  `json:"first_name,omitempty"`
	LastName              string  `json:"last_name,omitempty"`
	Phone                 string  `json:"phone,omitempty"`
	Gender                string  `json:"gender,omitempty"`
	DateOfBirth           string  `json:"date_of_birth,omitempty"`
	LocaleID              string  `json:"locale_id,omitempty"`
	Timezone              string  `json:"timezone,omitempty"`
	CountryID             string  `json:"country_id,omitempty"`
	PreferredCurrencyCode string  `json:"preferred_currency_code,omitempty"`
	Theme                 string  `json:"theme,omitempty"`
	DateFormat            string  `json:"date_format,omitempty"`
	ProvinceID            string  `json:"province_id,omitempty"`
	WardID                string  `json:"ward_id,omitempty"`
	AddressLine           string  `json:"address_line,omitempty"`
	AvatarFileID          string  `json:"avatar_file_id,omitempty"`
	BannerFileID          string  `json:"banner_file_id,omitempty"`
	Status                string  `json:"status"`
	IsSystemAdmin         bool    `json:"is_system_admin"`
	LastLoginAt           *string `json:"last_login_at,omitempty"`
	EmailVerifiedAt       *string `json:"email_verified_at,omitempty"`
	PhoneVerifiedAt       *string `json:"phone_verified_at,omitempty"`
	CreatedAt             string  `json:"created_at,omitempty"`
}

type adminOwnerUserDTO struct {
	adminUserDTO
	StaffRole   string                    `json:"staff_role,omitempty"`
	StaffTitle  string                    `json:"staff_title,omitempty"`
	StaffStatus string                    `json:"staff_status,omitempty"`
	PrimaryOrg  *adminUserOrganizationRef `json:"primary_organization,omitempty"`
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
	page, err := h.admin.ListPlayers(c.Request.Context(), adminUserListQuery(c, status, parseBoolQuery(c, "email_verified"), nil, nil))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]adminUserDTO, 0, len(page.Items))
	for i := range page.Items {
		out = append(out, toAdminUserDTO(page.Items[i]))
	}
	httpx.OK(c, listpage.New(out, page.Total, page.Limit, page.Offset))
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
	page, err := h.admin.ListOwners(c.Request.Context(), adminUserListQuery(c, status, nil, staffRole, orgID))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]adminOwnerUserDTO, 0, len(page.Items))
	for i := range page.Items {
		out = append(out, toAdminOwnerUserDTO(c, page.Items[i]))
	}
	httpx.OK(c, listpage.New(out, page.Total, page.Limit, page.Offset))
}

func (h *AdminUserHandler) ListAdmins(c *gin.Context) {
	status, ok := parseUserStatusQuery(c)
	if !ok {
		return
	}
	page, err := h.admin.ListAdmins(c.Request.Context(), adminUserListQuery(c, status, nil, nil, nil))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]adminUserDTO, 0, len(page.Items))
	for i := range page.Items {
		out = append(out, toAdminUserDTO(page.Items[i]))
	}
	httpx.OK(c, listpage.New(out, page.Total, page.Limit, page.Offset))
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

func (h *AdminUserHandler) ListPlayerBookings(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	if _, err := h.admin.GetPlayer(c.Request.Context(), id); err != nil {
		httpx.Error(c, err)
		return
	}
	h.bookings.AdminListForUser(c, id)
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

type adminAccountBody struct {
	Email                 string `json:"email"`
	Password              string `json:"password"`
	FirstName             string `json:"first_name"`
	LastName              string `json:"last_name"`
	Phone                 string `json:"phone"`
	Gender                string `json:"gender"`
	DateOfBirth           string `json:"date_of_birth"`
	LocaleID              string `json:"locale_id"`
	Timezone              string `json:"timezone"`
	CountryID             string `json:"country_id"`
	PreferredCurrencyCode string `json:"preferred_currency_code"`
	Theme                 string `json:"theme"`
	DateFormat            string `json:"date_format"`
	ProvinceID            string `json:"province_id"`
	WardID                string `json:"ward_id"`
	AddressLine           string `json:"address_line"`
}

type adminOwnerCreateBody struct {
	adminAccountBody
	OrganizationID string `json:"organization_id"`
	StaffRole      string `json:"staff_role"`
	Title          string `json:"title"`
}

type adminStaffRoleBody struct {
	RoleCode string `json:"role_code"`
	Title    string `json:"title"`
}

func accountInput(body adminAccountBody) service.AccountInput {
	return service.AccountInput{
		Email: body.Email, Password: body.Password,
		FirstName: body.FirstName, LastName: body.LastName, Phone: body.Phone,
		Extras: service.ProfileExtras{
			Set: true, Gender: body.Gender, DateOfBirth: body.DateOfBirth,
			LocaleID: body.LocaleID, Timezone: body.Timezone, CountryID: body.CountryID,
			PreferredCurrencyCode: body.PreferredCurrencyCode,
			Theme:                 body.Theme, DateFormat: body.DateFormat,
			ProvinceID: body.ProvinceID, WardID: body.WardID, AddressLine: body.AddressLine,
		},
	}
}

func (h *AdminUserHandler) CreatePlayer(c *gin.Context) {
	var req adminAccountBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	actor, _ := requestctx.UserID(c.Request.Context())
	row, err := h.admin.CreatePlayer(c.Request.Context(), actor, accountInput(req))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toAdminUserDTO(*row))
}

func (h *AdminUserHandler) CreateAdmin(c *gin.Context) {
	var req adminAccountBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	actor, _ := requestctx.UserID(c.Request.Context())
	row, err := h.admin.CreateAdmin(c.Request.Context(), actor, accountInput(req))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toAdminUserDTO(*row))
}

func (h *AdminUserHandler) CreateOwner(c *gin.Context) {
	var req adminOwnerCreateBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	orgID, err := uuid.Parse(strings.TrimSpace(req.OrganizationID))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "organization is required")
		return
	}
	actor, _ := requestctx.UserID(c.Request.Context())
	account := accountInput(req.adminAccountBody)
	if err := h.admin.CheckExtras(c.Request.Context(), account); err != nil {
		httpx.Error(c, err)
		return
	}
	userID, err := h.orgs.CreateStaffUser(c.Request.Context(), actor, orgservice.CreateStaffUserInput{
		OrganizationID: orgID,
		RoleCode:       req.StaffRole,
		Title:          req.Title,
		Account:        account,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	row, err := h.admin.GetOwner(c.Request.Context(), userID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toAdminOwnerUserDTO(c, *row))
}

func (h *AdminUserHandler) UpdateProfile(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	var req adminAccountBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	row, err := h.admin.UpdateProfile(c.Request.Context(), id, accountInput(req))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminUserDTO(*row))
}

func (h *AdminUserHandler) UploadMedia(c *gin.Context) {
	id, ok := parseUserID(c)
	if !ok {
		return
	}
	actor, _ := requestctx.UserID(c.Request.Context())
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "file is required")
		return
	}
	defer file.Close()
	body, err := io.ReadAll(io.LimitReader(file, 5<<20+1))
	if err != nil {
		httpx.Error(c, apperr.Wrap(err, apperr.CodeBadRequest, "read file"))
		return
	}
	mimeType := header.Header.Get("Content-Type")
	row, err := h.admin.SaveImage(c.Request.Context(), id, actor, c.PostForm("kind"), header.Filename, mimeType, body)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminUserDTO(*row))
}

func (h *AdminUserHandler) ReplaceStaffRole(c *gin.Context) {
	userID, ok := parseUserID(c)
	if !ok {
		return
	}
	staffID, err := uuid.Parse(c.Param("staff_id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid staff id")
		return
	}
	var req adminStaffRoleBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	actor, _ := requestctx.UserID(c.Request.Context())
	if err := h.orgs.ReplaceStaffRole(c.Request.Context(), userID, staffID, actor, req.RoleCode, req.Title); err != nil {
		httpx.Error(c, err)
		return
	}
	row, err := h.admin.GetOwner(c.Request.Context(), userID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAdminOwnerUserDTO(c, *row))
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
	if err != nil || limit < 0 {
		return 0
	}
	return limit
}

func adminUserListQuery(c *gin.Context, status *entity.UserStatus, emailVerified *bool, staffRole *string, orgID *uuid.UUID) service.AdminUserListQuery {
	return service.AdminUserListQuery{
		Q: c.Query("q"), Status: status, EmailVerified: emailVerified, StaffRole: staffRole, OrganizationID: orgID,
		LimitRaw: c.Query("limit"), OffsetRaw: c.Query("offset"), Sort: c.Query("sort"), Order: c.Query("order"),
	}
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
		DisplayName: row.DisplayName, FullName: row.FullName,
		FirstName: row.FirstName, LastName: row.LastName, Phone: row.Phone,
		Gender: row.Gender, DateOfBirth: row.DateOfBirth, LocaleID: row.LocaleID,
		Timezone: row.Timezone, CountryID: row.CountryID,
		PreferredCurrencyCode: row.PreferredCurrencyCode,
		Theme:                 row.Theme, DateFormat: row.DateFormat,
		ProvinceID: row.ProvinceID, WardID: row.WardID, AddressLine: row.AddressLine,
		AvatarFileID: row.AvatarFileID, BannerFileID: row.BannerFileID,
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
			Name:   i18n.DisplayName(loc, row.PrimaryOrgNameEn, row.PrimaryOrgNameVi),
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
