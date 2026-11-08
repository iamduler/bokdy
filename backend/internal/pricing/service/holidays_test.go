package service

import (
	"testing"

	"bokdy/internal/pricing/entity"

	"github.com/google/uuid"
)

func TestResolveHolidaysNarrowLayerWins(t *testing.T) {
	system := []entity.CalendarHoliday{{Date: "2026-09-02", Name: "Quốc khánh"}}
	org := []entity.OrganizationHoliday{{
		OrganizationID: uuid.New(), Date: "2026-09-02", Name: "Mở cửa", Effect: entity.HolidayEffectExclude,
	}}
	branch := []entity.BranchHoliday{{
		BranchID: uuid.New(), Date: "2026-09-02", Name: "Quốc khánh", Effect: entity.HolidayEffectInclude,
	}}
	branch = append(branch, entity.BranchHoliday{
		BranchID: branch[0].BranchID, Date: "2026-11-20", Name: "Ngày địa phương", Effect: entity.HolidayEffectInclude,
	})

	resolved := ResolveHolidays(system, org, branch)
	if len(resolved) != 2 {
		t.Fatalf("dates = %d", len(resolved))
	}
	if resolved[0].Source != entity.HolidaySourceBranch || resolved[0].Effect != entity.HolidayEffectInclude || resolved[0].Name != "Quốc khánh" {
		t.Fatalf("national day = %+v", resolved[0])
	}
	if resolved[1].Date != "2026-11-20" || resolved[1].Source != entity.HolidaySourceBranch {
		t.Fatalf("local day = %+v", resolved[1])
	}

	open := ResolveHolidays(system, org, nil)
	if len(open) != 1 || open[0].Effect != entity.HolidayEffectExclude || open[0].Source != entity.HolidaySourceOrganization {
		t.Fatalf("org exclusion = %+v", open)
	}
}
