package server

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"bokdy/internal/platform/auth"
	"bokdy/internal/platform/cache"
	"bokdy/internal/platform/config"
	"bokdy/internal/platform/docsui"
	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/mail"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/queue"
	"bokdy/internal/platform/validation"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
	"github.com/redis/go-redis/v9"
)

type DomainRegistrar func(api *gin.RouterGroup, app *Application)

type Application struct {
	Config   *config.Config
	Router   *gin.Engine
	DB       *persistence.Database
	Redis    *redis.Client
	Tokens   auth.TokenService
	Mailer   mail.Mailer
	Asynq    *asynq.Client
	register DomainRegistrar
}

func NewApplication(cfg *config.Config, register DomainRegistrar) (*Application, error) {
	if err := validation.InitValidator(); err != nil {
		return nil, err
	}

	db, err := persistence.NewDatabase(cfg)
	if err != nil {
		return nil, err
	}

	redisClient := cache.NewRedisClient(cfg)
	if err := cache.PingRedis(context.Background(), redisClient); err != nil {
		db.Close()
		return nil, err
	}

	if !cfg.App.IsDevelopment() {
		gin.SetMode(gin.ReleaseMode)
	}

	app := &Application{
		Config:   cfg,
		DB:       db,
		Redis:    redisClient,
		Tokens:   auth.NewJWTService(cfg),
		Mailer:   mail.NewLogMailer(),
		Asynq:    queue.NewClient(cfg),
		register: register,
	}

	router := gin.New()
	app.Router = router
	app.registerMiddleware(router)
	app.registerRoutes(router)
	return app, nil
}

func (a *Application) registerMiddleware(router *gin.Engine) {
	origins := a.Config.CORSOrigins()
	router.Use(
		middleware.Recovery(),
		middleware.RequestID(),
		middleware.AccessLog(),
		middleware.CORS(origins),
		gzip.Gzip(gzip.DefaultCompression),
	)
}

func (a *Application) registerRoutes(router *gin.Engine) {
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": a.Config.App.Name,
			"version": a.Config.App.Version,
		})
	})

	router.GET("/ready", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()
		if err := a.DB.Ping(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not_ready", "error": "database"})
			return
		}
		if err := cache.PingRedis(ctx, a.Redis); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not_ready", "error": "redis"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ready"})
	})

	docsui.Register(router, a.Config)

	api := router.Group("/api/v1")
	if a.register != nil {
		a.register(api, a)
	}
}

func (a *Application) Run() error {
	srv := &http.Server{
		Addr:              a.Config.HTTP.Address(),
		Handler:           a.Router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		logging.Log.Info().Str("addr", a.Config.HTTP.Address()).Msg("api listening")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		return err
	case <-stop:
		logging.Log.Info().Msg("shutting down api")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	_ = a.Asynq.Close()
	a.DB.Close()
	_ = a.Redis.Close()
	return nil
}
