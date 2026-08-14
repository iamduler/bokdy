package service

import (
	"context"

	pricingentity "bokdy/internal/pricing/entity"
	pricingservice "bokdy/internal/pricing/service"
)

// PriceCalculator quotes a court time window. Implemented by the pricing module
// so booking never reads pricing tables.
type PriceCalculator interface {
	Calculate(ctx context.Context, in pricingservice.CalculateInput) (*pricingentity.Quote, error)
}
