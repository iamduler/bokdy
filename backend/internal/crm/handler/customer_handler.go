package handler

import (
	"bokdy/internal/crm/entity"
	"bokdy/internal/crm/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CustomerHandler struct {
	customers *service.CustomerService
}

func NewCustomerHandler(customers *service.CustomerService) *CustomerHandler {
	return &CustomerHandler{customers: customers}
}

type createGuestRequest struct {
	Phone    string `json:"phone" binding:"required"`
	FullName string `json:"full_name"`
	Email    string `json:"email" binding:"omitempty,email"`
	Code     string `json:"code"`
	Source   string `json:"source"`
}

type registerMeRequest struct {
	Phone    string `json:"phone" binding:"required"`
	FullName string `json:"full_name"`
	Email    string `json:"email" binding:"omitempty,email"`
	Code     string `json:"code"`
}

type updateCustomerRequest struct {
	FullName *string `json:"full_name"`
	Phone    *string `json:"phone"`
	Email    *string `json:"email" binding:"omitempty,email"`
	Code     *string `json:"code"`
	Source   *string `json:"source"`
}

type blacklistRequest struct {
	Reason string `json:"reason"`
}

type customerContactDTO struct {
	Type      string `json:"type"`
	Value     string `json:"value"`
	Label     string `json:"label,omitempty"`
	IsPrimary bool   `json:"is_primary"`
	Verified  bool   `json:"is_verified"`
}

type customerDTO struct {
	ID               string               `json:"id"`
	PublicID         string               `json:"public_id"`
	Code             string               `json:"code"`
	CustomerType     string               `json:"customer_type"`
	Status           string               `json:"status"`
	UserID           string               `json:"user_id,omitempty"`
	FullName         string               `json:"full_name,omitempty"`
	Phone            string               `json:"phone,omitempty"`
	Email            string               `json:"email,omitempty"`
	Source           string               `json:"source,omitempty"`
	OrganizationName string               `json:"organization_name,omitempty"`
	Contacts         []customerContactDTO `json:"contacts,omitempty"`
	CreatedAt        string               `json:"created_at"`
	UpdatedAt        string               `json:"updated_at"`
}

func (h *CustomerHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	customers := rg.Group("/customers", jwt, middleware.OptionalOrganization())
	{
		customers.POST("", h.CreateGuest)
		customers.GET("", h.List)
		customers.POST("/me", h.RegisterMe)
		customers.GET("/me", h.GetMe)
		customers.GET("/:id", h.Get)
		customers.PATCH("/:id", h.Update)
		customers.POST("/:id/blacklist", h.Blacklist)
		customers.POST("/:id/restore", h.Restore)
	}
}

func (h *CustomerHandler) CreateGuest(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	var req createGuestRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	customer, err := h.customers.CreateGuest(c.Request.Context(), uid, service.CreateGuestInput{
		Phone: req.Phone, FullName: req.FullName, Email: req.Email, Code: req.Code, Source: req.Source,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toCustomerDTO(customer))
}

func (h *CustomerHandler) RegisterMe(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	var req registerMeRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	customer, err := h.customers.RegisterMe(c.Request.Context(), uid, service.RegisterMeInput{
		Phone: req.Phone, FullName: req.FullName, Email: req.Email, Code: req.Code,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toCustomerDTO(customer))
}

func (h *CustomerHandler) List(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	var status *entity.CustomerStatus
	if raw := c.Query("status"); raw != "" {
		s := entity.CustomerStatus(raw)
		status = &s
	}
	items, err := h.customers.List(c.Request.Context(), uid, c.Query("q"), status)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]customerDTO, 0, len(items))
	for i := range items {
		out = append(out, toCustomerDTO(&items[i]))
	}
	httpx.OK(c, out)
}

func (h *CustomerHandler) Get(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	customerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid customer id"))
		return
	}
	customer, err := h.customers.Get(c.Request.Context(), customerID, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toCustomerDTO(customer))
}

func (h *CustomerHandler) GetMe(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	customer, err := h.customers.GetMe(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toCustomerDTO(customer))
}

func (h *CustomerHandler) Update(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	customerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid customer id"))
		return
	}
	var req updateCustomerRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	customer, err := h.customers.Update(c.Request.Context(), customerID, uid, service.UpdateCustomerInput{
		FullName: req.FullName, Phone: req.Phone, Email: req.Email, Code: req.Code, Source: req.Source,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toCustomerDTO(customer))
}

func (h *CustomerHandler) Blacklist(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	customerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid customer id"))
		return
	}
	var req blacklistRequest
	_ = c.ShouldBindJSON(&req)
	if err := h.customers.Blacklist(c.Request.Context(), customerID, uid, req.Reason); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *CustomerHandler) Restore(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	customerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid customer id"))
		return
	}
	if err := h.customers.Restore(c.Request.Context(), customerID, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func toCustomerDTO(c *entity.Customer) customerDTO {
	dto := customerDTO{
		ID: c.ID.String(), PublicID: c.PublicID, Code: c.Code, CustomerType: string(c.CustomerType),
		Status: string(c.Status), Source: c.Source, OrganizationName: c.OrganizationName,
		CreatedAt: c.CreatedAt.UTC().Format(timeRFC3339), UpdatedAt: c.UpdatedAt.UTC().Format(timeRFC3339),
	}
	if c.UserID != nil {
		dto.UserID = c.UserID.String()
	}
	if c.Profile != nil {
		dto.FullName = c.Profile.FullName
	}
	contacts := make([]customerContactDTO, 0, len(c.Contacts))
	for _, ct := range c.Contacts {
		contacts = append(contacts, customerContactDTO{
			Type: string(ct.ContactType), Value: ct.Value, Label: ct.Label, IsPrimary: ct.IsPrimary, Verified: ct.IsVerified,
		})
		if ct.ContactType == entity.ContactPhone && ct.IsPrimary {
			dto.Phone = ct.Value
		}
		if ct.ContactType == entity.ContactEmail && ct.IsPrimary {
			dto.Email = ct.Value
		}
	}
	dto.Contacts = contacts
	return dto
}

const timeRFC3339 = "2006-01-02T15:04:05Z07:00"
