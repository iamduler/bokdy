package service

import (
	"context"
	"strings"

	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
)

// PickRepresentativeFormer chooses one former ward for a branch address row.
// Prefer the successor whose former code equals the current ward code; else lowest former code.
// rows must already be ordered that way (ListFormerWardsForCurrent), but this still applies
// the rule so unit tests do not depend on SQL.
func PickRepresentativeFormer(rows []repository.FormerWardRef) *repository.FormerWardRef {
	if len(rows) == 0 {
		return nil
	}
	var best *repository.FormerWardRef
	for i := range rows {
		row := &rows[i]
		if row.WardFormerCode == row.WardCode {
			return row
		}
		if best == nil || row.WardFormerCode < best.WardFormerCode {
			best = row
		}
	}
	return best
}

func formerOrgAddress(orgID uuid.UUID, ref repository.FormerWardRef, line1, line2 string) entity.OrganizationAddress {
	province := ref.ProvinceFormerID
	district := ref.DistrictFormerID
	ward := ref.WardFormerID
	return entity.OrganizationAddress{
		ID:               id.MustNewUUID(),
		OrganizationID:   orgID,
		DivisionScheme:   entity.AdminDivisionFormerV3,
		ProvinceFormerID: &province,
		DistrictFormerID: &district,
		WardFormerID:     &ward,
		AddressLine1:     line1,
		AddressLine2:     line2,
	}
}

func formerBranchAddress(ref repository.FormerWardRef, template entity.BranchAddress) entity.BranchAddress {
	province := ref.ProvinceFormerID
	district := ref.DistrictFormerID
	ward := ref.WardFormerID
	return entity.BranchAddress{
		DivisionScheme:   entity.AdminDivisionFormerV3,
		CountryID:        template.CountryID,
		ProvinceFormerID: &province,
		DistrictFormerID: &district,
		WardFormerID:     &ward,
		AddressLine1:     template.AddressLine1,
		AddressLine2:     template.AddressLine2,
		Latitude:         template.Latitude,
		Longitude:        template.Longitude,
	}
}

// expandOrgFormerFromCurrent appends all former_v3 HQ rows for the given current ward.
func expandOrgFormerFromCurrent(
	ctx context.Context,
	orgs repository.OrganizationRepository,
	orgID, wardID uuid.UUID,
	line1, line2 string,
) ([]entity.OrganizationAddress, error) {
	refs, err := orgs.ListFormerWards(ctx, wardID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "map former wards")
	}
	out := make([]entity.OrganizationAddress, 0, len(refs))
	for _, ref := range refs {
		out = append(out, formerOrgAddress(orgID, ref, line1, line2))
	}
	return out, nil
}

// expandBranchFormerFromCurrent returns at most one former_v3 branch address when the
// client did not already supply former_v3. No-op when no successors exist.
func expandBranchFormerFromCurrent(
	ctx context.Context,
	orgs repository.OrganizationRepository,
	addrs []entity.BranchAddress,
) ([]entity.BranchAddress, error) {
	hasFormer := false
	var current *entity.BranchAddress
	for i := range addrs {
		switch addrs[i].DivisionScheme {
		case entity.AdminDivisionFormerV3:
			hasFormer = true
		case entity.AdminDivisionCurrentV2:
			current = &addrs[i]
		}
	}
	if hasFormer || current == nil || current.WardID == nil {
		return addrs, nil
	}
	refs, err := orgs.ListFormerWards(ctx, *current.WardID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "map former wards")
	}
	picked := PickRepresentativeFormer(refs)
	if picked == nil {
		return addrs, nil
	}
	return append(addrs, formerBranchAddress(*picked, *current)), nil
}

// normalizeAddressLines trims street lines used when copying current → former.
func normalizeAddressLines(line1, line2 string) (string, string) {
	return strings.TrimSpace(line1), strings.TrimSpace(line2)
}
