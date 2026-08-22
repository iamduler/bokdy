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
	DivisionScheme   string  `json:"division_scheme" binding:"required,oneof=former_v3 current_v2"`
	CountryID        *string `json:"country_id" binding:"omitempty,uuid"`
	ProvinceFormerID *string `json:"province_former_id" binding:"omitempty,uuid"`
	DistrictFormerID *string `json:"district_former_id" binding:"omitempty,uuid"`
	WardFormerID     *string `json:"ward_former_id" binding:"omitempty,uuid"`
	ProvinceID       *string `json:"province_id" binding:"omitempty,uuid"`
	WardID           *string `json:"ward_id" binding:"omitempty,uuid"`
	AddressLine1     string  `json:"address_line_1"`
	AddressLine2     string  `json:"address_line_2"`
}

type createBranchRequest struct {
	NameEn    string                 `json:"name_en"`
	NameVi    string                 `json:"name_vi"`
	Code      string                 `json:"code"`
	Phone     string                 `json:"phone"`
	Email     string                 `json:"email" binding:"omitempty,email"`
	Timezone  string                 `json:"timezone"`
	Addresses []branchAddressRequest `json:"addresses"`
}

type updateBranchRequest struct {
	NameEn    *string                 `json:"name_en"`
	NameVi    *string                 `json:"name_vi"`
	Code      *string                 `json:"code"`
	Phone     *string                 `json:"phone"`
	Email     *string                 `json:"email" binding:"omitempty,email"`
	Timezone  *string                 `json:"timezone"`
	Addresses *[]branchAddressRequest `json:"addresses"`
}

type branchAddressDTO struct {
	DivisionScheme   string `json:"division_scheme"`
	CountryID        string `json:"country_id,omitempty"`
	ProvinceFormerID string `json:"province_former_id,omitempty"`
	DistrictFormerID string `json:"district_former_id,omitempty"`
	WardFormerID     string `json:"ward_former_id,omitempty"`
	ProvinceID       string `json:"province_id,omitempty"`
	WardID           string `json:"ward_id,omitempty"`
	AddressLine1     string `json:"address_line_1,omitempty"`
	AddressLine2     string `json:"address_line_2,omitempty"`
}

type branchDTO struct {
	ID             string             `json:"id"`
	PublicID       string             `json:"public_id"`
	OrganizationID string             `json:"organization_id"`
	Code           string             `json:"code"`
	Name           string             `json:"name"`
	NameEn         string             `json:"name_en,omitempty"`
	NameVi         string             `json:"name_vi,omitempty"`
	Phone          string             `json:"phone,omitempty"`
	Email          string             `json:"email,omitempty"`
	Timezone       string             `json:"timezone,omitempty"`
	Status         string             `json:"status"`
	Addresses      []branchAddressDTO `json:"addresses,omitempty"`
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
	addrs, err := toAddressInputs(req.Addresses)
	if err != nil {
		return in, err
	}
	in.Addresses = addrs
	return in, nil
}

func toUpdateBranchInput(req updateBranchRequest) (service.UpdateBranchInput, error) {
	in := service.UpdateBranchInput{
		NameEn: req.NameEn, NameVi: req.NameVi, Code: req.Code, Phone: req.Phone, Email: req.Email, Timezone: req.Timezone,
	}
	if req.Addresses != nil {
		addrs, err := toAddressInputs(*req.Addresses)
		if err != nil {
			return in, err
		}
		in.Addresses = &addrs
	}
	return in, nil
}

func toAddressInputs(reqs []branchAddressRequest) ([]service.BranchAddressInput, error) {
	out := make([]service.BranchAddressInput, 0, len(reqs))
	for _, req := range reqs {
		addr, err := toAddressInput(req)
		if err != nil {
			return nil, err
		}
		out = append(out, addr)
	}
	return out, nil
}

func toAddressInput(req branchAddressRequest) (service.BranchAddressInput, error) {
	out := service.BranchAddressInput{
		DivisionScheme: entity.AdminDivisionScheme(req.DivisionScheme),
		AddressLine1:   req.AddressLine1,
		AddressLine2:   req.AddressLine2,
	}
	var err error
	if out.CountryID, err = parseOptionalUUID(req.CountryID, "country_id"); err != nil {
		return out, err
	}
	if out.ProvinceFormerID, err = parseOptionalUUID(req.ProvinceFormerID, "province_former_id"); err != nil {
		return out, err
	}
	if out.DistrictFormerID, err = parseOptionalUUID(req.DistrictFormerID, "district_former_id"); err != nil {
		return out, err
	}
	if out.WardFormerID, err = parseOptionalUUID(req.WardFormerID, "ward_former_id"); err != nil {
		return out, err
	}
	if out.ProvinceID, err = parseOptionalUUID(req.ProvinceID, "province_id"); err != nil {
		return out, err
	}
	if out.WardID, err = parseOptionalUUID(req.WardID, "ward_id"); err != nil {
		return out, err
	}
	return out, nil
}

func parseOptionalUUID(raw *string, field string) (*uuid.UUID, error) {
	if raw == nil || *raw == "" {
		return nil, nil
	}
	id, err := uuid.Parse(*raw)
	if err != nil {
		return nil, apperr.New(apperr.CodeValidation, "invalid "+field)
	}
	return &id, nil
}

func toBranchDTO(ctx context.Context, branch *entity.Branch) branchDTO {
	dto := branchDTO{
		ID: branch.ID.String(), PublicID: branch.PublicID, OrganizationID: branch.OrganizationID.String(),
		Code: branch.Code, Name: i18n.DisplayName(i18n.FromContext(ctx), branch.NameEn, branch.NameVi),
		NameEn: branch.NameEn, NameVi: branch.NameVi, Phone: branch.Phone, Email: branch.Email,
		Timezone: branch.Timezone, Status: string(branch.Status),
	}
	if len(branch.Addresses) > 0 {
		dto.Addresses = make([]branchAddressDTO, 0, len(branch.Addresses))
		for _, addr := range branch.Addresses {
			dto.Addresses = append(dto.Addresses, toBranchAddressDTO(addr))
		}
	}
	return dto
}

func toBranchAddressDTO(addr entity.BranchAddress) branchAddressDTO {
	dto := branchAddressDTO{
		DivisionScheme: string(addr.DivisionScheme),
		AddressLine1:   addr.AddressLine1,
		AddressLine2:   addr.AddressLine2,
	}
	if addr.CountryID != nil {
		dto.CountryID = addr.CountryID.String()
	}
	if addr.ProvinceFormerID != nil {
		dto.ProvinceFormerID = addr.ProvinceFormerID.String()
	}
	if addr.DistrictFormerID != nil {
		dto.DistrictFormerID = addr.DistrictFormerID.String()
	}
	if addr.WardFormerID != nil {
		dto.WardFormerID = addr.WardFormerID.String()
	}
	if addr.ProvinceID != nil {
		dto.ProvinceID = addr.ProvinceID.String()
	}
	if addr.WardID != nil {
		dto.WardID = addr.WardID.String()
	}
	return dto
}
