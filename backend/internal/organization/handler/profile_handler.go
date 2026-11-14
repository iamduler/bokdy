package handler

import (
	membershipservice "bokdy/internal/membership/service"
	"bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (h *OrganizationHandler) SetMembership(m *membershipservice.Service) { h.membership = m }

type transferBody struct {
	SuccessorUserID string `json:"successor_user_id"`
}

type kycBody struct {
	Documents []struct {
		FileID       string `json:"file_id"`
		DocumentType string `json:"document_type"`
	} `json:"documents"`
}

type reviewBody struct {
	Approve bool   `json:"approve"`
	Reason  string `json:"reason"`
}

type membershipBody struct {
	UserID     string `json:"user_id"`
	TierName   string `json:"tier_name"`
	Points     int32  `json:"points"`
	ValidUntil string `json:"valid_until"`
}

func (h *OrganizationHandler) TransferOwnership(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid organization")
		return
	}
	var req transferBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	successor, err := uuid.Parse(req.SuccessorUserID)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid successor")
		return
	}
	if err := h.orgs.TransferOwnership(c.Request.Context(), orgID, uid, successor); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *OrganizationHandler) SubmitKYC(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid organization")
		return
	}
	var req kycBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	docs := make([]service.KYCDocumentInput, 0, len(req.Documents))
	for _, doc := range req.Documents {
		fileID, err := uuid.Parse(doc.FileID)
		if err != nil {
			httpx.Fail(c, apperr.CodeValidation, "invalid file_id")
			return
		}
		docs = append(docs, service.KYCDocumentInput{FileID: fileID, DocumentType: doc.DocumentType})
	}
	caseID, err := h.orgs.SubmitKYC(c.Request.Context(), orgID, uid, docs)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, gin.H{"id": caseID.String()})
}

func (h *OrganizationHandler) ListKYC(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid organization")
		return
	}
	if err := h.orgs.CanReadKYC(c.Request.Context(), orgID, uid, requestctx.IsSystemAdmin(c.Request.Context())); err != nil {
		httpx.Error(c, err)
		return
	}
	rows, err := h.orgs.ListKYC(c.Request.Context(), orgID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, rows)
}

func (h *OrganizationHandler) ReviewKYC(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	caseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid kyc case")
		return
	}
	var req reviewBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.orgs.ReviewKYC(c.Request.Context(), caseID, uid, req.Approve, req.Reason); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *OrganizationHandler) OpenMembership(c *gin.Context) {
	if h.membership == nil {
		httpx.Error(c, apperr.New(apperr.CodeInternal, "membership is not configured"))
		return
	}
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid organization")
		return
	}
	var req membershipBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid user_id")
		return
	}
	accountID, err := h.membership.OpenAccount(c.Request.Context(), membershipservice.OpenAccountInput{
		OrganizationID: orgID, UserID: userID, TierName: req.TierName, Points: req.Points, ValidUntil: req.ValidUntil,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, gin.H{"id": accountID.String()})
}
