package wiring

import (
	bookinghandler "bokdy/internal/booking/handler"
	bookingpg "bokdy/internal/booking/infrastructure/postgres"
	bookingservice "bokdy/internal/booking/service"
	cataloghandler "bokdy/internal/catalog/handler"
	catalogpg "bokdy/internal/catalog/infrastructure/postgres"
	catalogservice "bokdy/internal/catalog/service"
	crmhandler "bokdy/internal/crm/handler"
	crmpg "bokdy/internal/crm/infrastructure/postgres"
	crmservice "bokdy/internal/crm/service"
	"bokdy/internal/identity/entity"
	identityhandler "bokdy/internal/identity/handler"
	identitypg "bokdy/internal/identity/infrastructure/postgres"
	identityservice "bokdy/internal/identity/service"
	orghandler "bokdy/internal/organization/handler"
	orgpg "bokdy/internal/organization/infrastructure/postgres"
	orgservice "bokdy/internal/organization/service"
	paymenthandler "bokdy/internal/payment/handler"
	paymentpg "bokdy/internal/payment/infrastructure/postgres"
	paymentservice "bokdy/internal/payment/service"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/server"
	"bokdy/internal/platform/validation"
	pricinghandler "bokdy/internal/pricing/handler"
	pricingpg "bokdy/internal/pricing/infrastructure/postgres"
	pricingservice "bokdy/internal/pricing/service"
	reservationhandler "bokdy/internal/reservation/handler"
	reservationpg "bokdy/internal/reservation/infrastructure/postgres"
	reservationservice "bokdy/internal/reservation/service"
	schedhandler "bokdy/internal/scheduling/handler"
	schedpg "bokdy/internal/scheduling/infrastructure/postgres"
	schedservice "bokdy/internal/scheduling/service"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(api *gin.RouterGroup, app *server.Application) {
	if err := validation.RegisterStringRule("password_policy", func(s string) bool {
		return entity.ValidatePassword(s) == nil
	}); err != nil {
		panic(err)
	}
	userRepo := identitypg.NewUserRepo(app.DB.Pool)
	identRepo := identitypg.NewIdentityRepo(app.DB.Pool)
	credRepo := identitypg.NewCredentialRepo(app.DB.Pool)
	sessionRepo := identitypg.NewSessionRepo(app.DB.Pool)
	roleRepo := identitypg.NewRoleRepo(app.DB.Pool)

	outbox := events.NewAsynqEnqueuer(app.Asynq)
	authSvc := identityservice.NewAuthService(
		app.DB.Pool, userRepo, identRepo, credRepo, sessionRepo, roleRepo,
		app.Tokens, app.Mailer, app.Config, outbox,
	)
	authHandler := identityhandler.NewAuthHandler(authSvc)

	orgRepo := orgpg.NewOrgRepo(app.DB.Pool)
	staffRepo := orgpg.NewStaffRepo(app.DB.Pool)
	inviteRepo := orgpg.NewInvitationRepo(app.DB.Pool)
	branchRepo := orgpg.NewBranchRepo(app.DB.Pool)
	orgSvc := orgservice.NewOrganizationService(
		app.DB.Pool, orgRepo, staffRepo, inviteRepo, roleRepo, userRepo, app.Mailer, outbox,
	)
	branchSvc := orgservice.NewBranchService(app.DB.Pool, orgRepo, branchRepo, orgSvc, outbox)
	customerRepo := crmpg.NewCustomerRepo(app.DB.Pool)
	customerSvc := crmservice.NewCustomerService(app.DB.Pool, customerRepo, orgRepo, orgSvc, outbox)
	orgHandler := orghandler.NewOrganizationHandler(orgSvc)
	branchHandler := orghandler.NewBranchHandler(branchSvc)
	customerHandler := crmhandler.NewCustomerHandler(customerSvc)

	syncEnqueuer := schedservice.NewAsynqSyncEnqueuer(app.Asynq)
	schedRepo := schedpg.NewScheduleRepo(app.DB.Pool)
	schedSvc := schedservice.NewScheduleService(
		app.DB.Pool, schedRepo, schedRepo, orgRepo, branchRepo, orgSvc, outbox, syncEnqueuer,
	)
	schedHandler := schedhandler.NewScheduleHandler(schedSvc)

	courtTypeRepo := catalogpg.NewCourtTypeRepo(app.DB.Pool)
	courtRepo := catalogpg.NewCourtRepo(app.DB.Pool)
	catalogSvc := catalogservice.NewCatalogService(
		app.DB.Pool, courtTypeRepo, courtRepo, orgRepo, branchRepo, orgSvc, outbox, syncEnqueuer,
	)
	catalogHandler := cataloghandler.NewCatalogHandler(catalogSvc)

	jwt := middleware.JWTAuth(app.Tokens)
	authHandler.RegisterRoutes(api, jwt)
	orgHandler.RegisterRoutes(api, jwt)
	branchHandler.RegisterRoutes(api, jwt)
	customerHandler.RegisterRoutes(api, jwt)
	catalogHandler.RegisterRoutes(api, jwt)
	schedHandler.RegisterRoutes(api, jwt)

	pricingRepo := pricingpg.NewPricingRepo(app.DB.Pool)
	pricingSvc := pricingservice.NewPricingService(app.DB.Pool, pricingRepo, orgRepo, orgSvc, outbox)
	pricingHandler := pricinghandler.NewPricingHandler(pricingSvc)
	pricingHandler.RegisterRoutes(api, jwt)

	occupancySvc := schedservice.NewOccupancyService(schedRepo, syncEnqueuer)
	bookingSvc := bookingservice.NewBookingService(
		app.DB.Pool, bookingpg.NewBookingRepo(app.DB.Pool), bookingpg.NewInvoiceRepo(app.DB.Pool),
		customerRepo, orgRepo, orgSvc, occupancySvc, pricingSvc, outbox,
	)
	bookinghandler.NewBookingHandler(bookingSvc).RegisterRoutes(api, jwt)

	reservationSvc := reservationservice.NewReservationService(
		app.DB.Pool, reservationpg.NewReservationRepo(app.DB.Pool),
		customerRepo, orgRepo, orgSvc, occupancySvc, pricingSvc, bookingSvc, outbox,
	)
	reservationhandler.NewReservationHandler(reservationSvc).RegisterRoutes(api, jwt)

	paymentSvc := paymentservice.NewPaymentService(
		app.DB.Pool,
		paymentpg.NewInvoiceRepo(app.DB.Pool),
		paymentpg.NewIntentRepo(app.DB.Pool),
		paymentpg.NewRefundRepo(app.DB.Pool),
		bookingpg.NewBookingRepo(app.DB.Pool),
		customerRepo, orgRepo, orgSvc, bookingSvc, outbox,
	)
	paymenthandler.NewPaymentHandler(paymentSvc).RegisterRoutes(api, jwt)

	admin := api.Group("/admin", jwt, middleware.RequireSystemAdmin())
	orgHandler.RegisterAdminRoutes(admin)
}
