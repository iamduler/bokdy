package handler

import (
	"context"

	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BranchHandler struct {
	branches *service.BranchService
}

func NewBranchHandler(branches *service.BranchService) *BranchHandler {
	return &BranchHandler{branches: branches}
}

type branchAddressRequest struct {
	CountryID    *string `json:"country_id" binding:"omitempty,uuid"`
	State        string  `json:"state"`
	City         string  `json:"city"`
	District     string  `json:"district"`
	Ward         string  `json:"ward"`
	AddressLine1 string  `json:"address_line_1"`
	AddressLine2 string  `json:"address_line_2"`
	PostalCode   string  `json:"postal_code"`
}

type createBranchRequest struct {
	NameEn   string                `json:"name_en"`
	NameVi   string                `json:"name_vi"`
	Code     string                `json:"code"`
	Phone    string                `json:"phone"`
	Email    string                `json:"email" binding:"omitempty,email"`
	Timezone string                `json:"timezone"`
	Address  *branchAddressRequest `json:"address"`
}

type updateBranchRequest struct {
	NameEn   *string               `json:"name_en"`
	NameVi   *string               `json:"name_vi"`
	Code     *string               `json:"code"`
	Phone    *string               `json:"phone"`
	Email    *string               `json:"email" binding:"omitempty,email"`
	Timezone *string               `json:"timezone"`
	Address  *branchAddressRequest `json:"address"`
}

type branchAddressDTO struct {
	CountryID    string `json:"country_id,omitempty"`
	State        string `json:"state,omitempty"`
	City         string `json:"city,omitempty"`
	District     string `json:"district,omitempty"`
	Ward         string `json:"ward,omitempty"`
	AddressLine1 string `json:"address_line_1,omitempty"`
	AddressLine2 string `json:"address_line_2,omitempty"`
	PostalCode   string `json:"postal_code,omitempty"`
}

type branchDTO struct {
	ID             string            `json:"id"`
	PublicID       string            `json:"public_id"`
	OrganizationID string            `json:"organization_id"`
	Code           string            `json:"code"`
	Name           string            `json:"name"`
	NameEn         string            `json:"name_en,omitempty"`
	NameVi         string            `json:"name_vi,omitempty"`
	Phone          string            `json:"phone,omitempty"`
	Email          string            `json:"email,omitempty"`
	Timezone       string            `json:"timezone,omitempty"`
	Status         string            `json:"status"`
	Address        *branchAddressDTO `json:"address,omitempty"`
}

func (h *BranchHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	branches := rg.Group("/branches", jwt, middleware.OptionalOrganization())
	{
		branches.POST("", h.Create)
		branches.GET("", h.List)
		branches.GET("/:id", h.Get)
		branches.PATCH("/:id", h.Update)
		branches.POST("/:id/open", h.Open)
		branches.POST("/:id/close", h.Close)
		branches.POST("/:id/archive", h.Archive)
	}
}

func (h *BranchHandler) Create(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	var req createBranchRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	in, err := toCreateBranchInput(req)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	branch, err := h.branches.Create(c.Request.Context(), uid, in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toBranchDTO(c.Request.Context(), branch))
}

func (h *BranchHandler) List(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	branches, err := h.branches.List(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]branchDTO, 0, len(branches))
	for i := range branches {
		out = append(out, toBranchDTO(c.Request.Context(), &branches[i]))
	}
	httpx.OK(c, out)
}

func (h *BranchHandler) Get(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid branch id"))
		return
	}
	branch, err := h.branches.Get(c.Request.Context(), branchID, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBranchDTO(c.Request.Context(), branch))
}

func (h *BranchHandler) Update(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid branch id"))
		return
	}
	var req updateBranchRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	in, err := toUpdateBranchInput(req)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	branch, err := h.branches.Update(c.Request.Context(), branchID, uid, in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBranchDTO(c.Request.Context(), branch))
}

func (h *BranchHandler) Open(c *gin.Context) {
	h.statusAction(c, h.branches.Open)
}

func (h *BranchHandler) Close(c *gin.Context) {
	h.statusAction(c, h.branches.Close)
}

func (h *BranchHandler) Archive(c *gin.Context) {
	h.statusAction(c, h.branches.Archive)
}

func (h *BranchHandler) statusAction(c *gin.Context, fn func(context.Context, uuid.UUID, uuid.UUID) error) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid branch id"))
		return
	}
	if err := fn(c.Request.Context(), branchID, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func toCreateBranchInput(req createBranchRequest) (service.CreateBranchInput, error) {
	in := service.CreateBranchInput{
		NameEn: req.NameEn, NameVi: req.NameVi, Code: req.Code, Phone: req.Phone, Email: req.Email, Timezone: req.Timezone,
	}
	addr, err := toAddressInput(req.Address)
	if err != nil {
		return in, err
	}
	in.Address = addr
	return in, nil
}

func toUpdateBranchInput(req updateBranchRequest) (service.UpdateBranchInput, error) {
	in := service.UpdateBranchInput{
		NameEn: req.NameEn, NameVi: req.NameVi, Code: req.Code, Phone: req.Phone, Email: req.Email, Timezone: req.Timezone,
	}
	addr, err := toAddressInput(req.Address)
	if err != nil {
		return in, err
	}
	in.Address = addr
	return in, nil
}

func toAddressInput(req *branchAddressRequest) (*service.BranchAddressInput, error) {
	if req == nil {
		return nil, nil
	}
	out := &service.BranchAddressInput{
		State: req.State, City: req.City, District: req.District, Ward: req.Ward,
		AddressLine1: req.AddressLine1, AddressLine2: req.AddressLine2, PostalCode: req.PostalCode,
	}
	if req.CountryID != nil && *req.CountryID != "" {
		id, err := uuid.Parse(*req.CountryID)
		if err != nil {
			return nil, apperr.New(apperr.CodeValidation, "invalid country_id")
		}
		out.CountryID = &id
	}
	return out, nil
}

func toBranchDTO(ctx context.Context, branch *entity.Branch) branchDTO {
	dto := branchDTO{
		ID: branch.ID.String(), PublicID: branch.PublicID, OrganizationID: branch.OrganizationID.String(),
		Code: branch.Code, Name: i18n.DisplayName(i18n.FromContext(ctx), branch.NameEn, branch.NameVi),
		NameEn: branch.NameEn, NameVi: branch.NameVi, Phone: branch.Phone, Email: branch.Email,
		Timezone: branch.Timezone, Status: string(branch.Status),
	}
	if branch.Address != nil {
		addr := &branchAddressDTO{
			State: branch.Address.State, City: branch.Address.City, District: branch.Address.District,
			Ward: branch.Address.Ward, AddressLine1: branch.Address.AddressLine1,
			AddressLine2: branch.Address.AddressLine2, PostalCode: branch.Address.PostalCode,
		}
		if branch.Address.CountryID != nil {
			addr.CountryID = branch.Address.CountryID.String()
		}
		dto.Address = addr
	}
	return dto
}
