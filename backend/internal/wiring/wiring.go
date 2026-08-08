package wiring

import (
	identityhandler "bokdy/internal/identity/handler"
	identitypg "bokdy/internal/identity/infrastructure/postgres"
	identityservice "bokdy/internal/identity/service"
	orghandler "bokdy/internal/organization/handler"
	orgpg "bokdy/internal/organization/infrastructure/postgres"
	orgservice "bokdy/internal/organization/service"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/server"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(api *gin.RouterGroup, app *server.Application) {
	userRepo := identitypg.NewUserRepo(app.DB.Pool)
	identRepo := identitypg.NewIdentityRepo(app.DB.Pool)
	credRepo := identitypg.NewCredentialRepo(app.DB.Pool)
	sessionRepo := identitypg.NewSessionRepo(app.DB.Pool)
	roleRepo := identitypg.NewRoleRepo(app.DB.Pool)

	authSvc := identityservice.NewAuthService(
		app.DB.Pool, userRepo, identRepo, credRepo, sessionRepo, roleRepo,
		app.Tokens, app.Mailer, app.Config,
	)
	authHandler := identityhandler.NewAuthHandler(authSvc)

	orgRepo := orgpg.NewOrgRepo(app.DB.Pool)
	orgSvc := orgservice.NewOrganizationService(app.DB.Pool, orgRepo, roleRepo, app.Mailer)
	orgHandler := orghandler.NewOrganizationHandler(orgSvc)

	jwt := middleware.JWTAuth(app.Tokens)
	authHandler.RegisterRoutes(api, jwt)
	orgHandler.RegisterRoutes(api, jwt)

	admin := api.Group("/admin", jwt, middleware.RequireSystemAdmin())
	admin.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "scope": "admin"})
	})
}
