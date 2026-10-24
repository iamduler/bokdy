// Package entitycode holds PREFIX constants for auto-generated business codes.
// Format: {PREFIX}{5-digit seq} e.g. BRN00001.
// Scope of uniqueness follows ERD unique keys per table.
package entitycode

const SeqWidth = 5

// Prefixes keyed to ERD tables that expose a business `code` column.
const (
	// organization.tenants / organization.organizations
	Organization = "ORG"
	// organization.business_units
	BusinessUnit = "BU"
	// organization.locations (Branch)
	Branch = "BRN"
	// organization.teams
	Team = "TEM"
	// crm.customers
	Customer = "CUS"
	// catalog.sports
	Sport = "SPT"
	// catalog.service_categories
	ServiceCategory = "SVC"
	// catalog.services
	Service = "SRV"
	// catalog.resource_categories
	ResourceCategory = "RCC"
	// catalog.resources (Court when resource_type = court)
	Court = "CRT"
	// catalog.resource_capabilities
	ResourceCapability = "CAP"
	// infrastructure / reference job-like catalogs (optional discovery)
	JobDefinition = "JOB"
)

// Format builds PREFIX + zero-padded sequence (1-based).
func Format(prefix string, seq int) string {
	if seq < 1 {
		seq = 1
	}
	return prefix + padSeq(seq, SeqWidth)
}

func padSeq(seq, width int) string {
	digits := make([]byte, width)
	for i := width - 1; i >= 0; i-- {
		digits[i] = byte('0' + seq%10)
		seq /= 10
	}
	return string(digits)
}
