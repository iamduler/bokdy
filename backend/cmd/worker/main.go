package main

import (
	"context"
	"encoding/json"
	"net/http"
	"path/filepath"
	"time"

	bookingpg "bokdy/internal/booking/infrastructure/postgres"
	bookingservice "bokdy/internal/booking/service"
	crmpg "bokdy/internal/crm/infrastructure/postgres"
	identitypg "bokdy/internal/identity/infrastructure/postgres"
	orgpg "bokdy/internal/organization/infrastructure/postgres"
	orgservice "bokdy/internal/organization/service"
	paymentpg "bokdy/internal/payment/infrastructure/postgres"
	paymentservice "bokdy/internal/payment/service"
	"bokdy/internal/platform/audit"
	"bokdy/internal/platform/config"
	"bokdy/internal/platform/env"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/mail"
	"bokdy/internal/platform/metrics"
	"bokdy/internal/platform/otelx"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/queue"
	"bokdy/internal/platform/requestctx"
	pricingpg "bokdy/internal/pricing/infrastructure/postgres"
	pricingservice "bokdy/internal/pricing/service"
	reservationpg "bokdy/internal/reservation/infrastructure/postgres"
	reservationservice "bokdy/internal/reservation/service"
	schedpg "bokdy/internal/scheduling/infrastructure/postgres"
	schedservice "bokdy/internal/scheduling/service"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"go.opentelemetry.io/otel/trace"
)

func main() {
	moduleRoot := env.MustGetWorkingDir()
	monoRoot := env.FindMonorepoRoot(moduleRoot)

	_ = godotenv.Load(filepath.Join(monoRoot, ".env"))

	cfg := config.Load()
	logging.InitLogger(cfg, logging.DefaultOptions(filepath.Join(moduleRoot, "logs"), "worker.log"))
	queueLog := logging.Channel("queue.log", "queue")

	shutdownTracer, err := otelx.Init(context.Background(), otelx.OptionsFromConfig(cfg, cfg.App.Name+"-worker"))
	if err != nil {
		logging.Log.Fatal().Err(err).Msg("otel init")
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := shutdownTracer(ctx); err != nil {
			logging.Log.Error().Err(err).Msg("otel shutdown")
		}
	}()

	db, err := persistence.NewDatabase(cfg)
	if err != nil {
		logging.Log.Fatal().Err(err).Msg("worker database")
	}
	defer db.Close()

	pool := db.Pool
	metrics.Default.RegisterDBPool(
		func() float64 { return float64(pool.Stat().AcquiredConns()) },
		func() float64 { return float64(pool.Stat().IdleConns()) },
		func() float64 { return float64(pool.Stat().MaxConns()) },
	)
	inspector := asynq.NewInspector(queue.RedisOpt(cfg))
	defer inspector.Close()
	metrics.Default.RegisterQueueDepth(func() float64 {
		return queue.QueueDepth(inspector, queue.DefaultQueue)
	})
	startWorkerMetrics(cfg.WorkerMetricsAddr)

	asynqClient := queue.NewClient(cfg)
	defer asynqClient.Close()
	outbox := events.NewAsynqEnqueuer(asynqClient)
	orgSvc := orgservice.NewOrganizationService(
		pool,
		orgpg.NewOrgRepo(pool),
		orgpg.NewStaffRepo(pool),
		orgpg.NewInvitationRepo(pool),
		identitypg.NewRoleRepo(pool),
		identitypg.NewUserRepo(pool),
		mail.NewLogMailer(queueLog),
		outbox,
	)

	consumer := audit.NewConsumer(db.Pool)
	schedRepo := schedpg.NewScheduleRepo(pool)
	syncSvc := schedservice.NewSyncService(pool, schedRepo, outbox)

	syncEnqueuer := schedservice.NewAsynqSyncEnqueuer(asynqClient)
	occupancySvc := schedservice.NewOccupancyService(schedRepo, syncEnqueuer)
	customerRepo := crmpg.NewCustomerRepo(pool)
	orgRepo := orgpg.NewOrgRepo(pool)
	pricingSvc := pricingservice.NewPricingService(pool, pricingpg.NewPricingRepo(pool), orgRepo, orgSvc, outbox)
	bookingSvc := bookingservice.NewBookingService(
		pool, bookingpg.NewBookingRepo(pool), bookingpg.NewInvoiceRepo(pool),
		customerRepo, orgRepo, orgSvc, occupancySvc, pricingSvc, outbox,
	)
	reservationSvc := reservationservice.NewReservationService(
		pool, reservationpg.NewReservationRepo(pool),
		customerRepo, orgRepo, orgSvc, occupancySvc, pricingSvc, bookingSvc, outbox,
	)
	paymentSvc := paymentservice.NewPaymentService(
		pool, paymentpg.NewInvoiceRepo(pool), paymentpg.NewIntentRepo(pool),
		paymentpg.NewRefundRepo(pool), bookingpg.NewBookingRepo(pool),
		customerRepo, orgRepo, orgSvc, bookingSvc, outbox,
	)

	mux := asynq.NewServeMux()
	mux.HandleFunc(queue.TaskPlatformHealth, loggedTask(queueLog, func(ctx context.Context, t *asynq.Task) error {
		return nil
	}))
	mux.HandleFunc(queue.TaskOutboxAudit, loggedTask(queueLog, consumer.HandleAuditTask))
	mux.HandleFunc(queue.TaskOutboxSweep, loggedTask(queueLog, consumer.HandleSweepTask))
	mux.HandleFunc(queue.TaskInvitationExpire, loggedTask(queueLog, func(ctx context.Context, t *asynq.Task) error {
		n, err := orgSvc.ExpireInvitations(ctx)
		if err != nil {
			return err
		}
		logging.WithTrace(queueLog, ctx).Info().Int("expired", n).Msg("invitations expired")
		return nil
	}))
	mux.HandleFunc(queue.TaskAvailabilitySync, loggedTask(queueLog, func(ctx context.Context, t *asynq.Task) error {
		var p queue.AvailabilitySyncPayload
		if err := json.Unmarshal(t.Payload(), &p); err != nil {
			return err
		}
		ctx = otelx.ExtractMap(ctx, p.Trace)
		if p.ResourceID != "" {
			id, err := uuid.Parse(p.ResourceID)
			if err != nil {
				return err
			}
			return syncSvc.SyncCourt(ctx, id)
		}
		if p.LocationID != "" {
			id, err := uuid.Parse(p.LocationID)
			if err != nil {
				return err
			}
			return syncSvc.SyncBranch(ctx, id)
		}
		return nil
	}))
	mux.HandleFunc(queue.TaskReservationExpire, loggedTask(queueLog, func(ctx context.Context, t *asynq.Task) error {
		n, err := reservationSvc.ExpireDue(ctx)
		if err != nil {
			return err
		}
		logging.WithTrace(queueLog, ctx).Info().Int("expired", n).Msg("reservations expired")
		return nil
	}))
	mux.HandleFunc(queue.TaskBookingExpireUnpaid, loggedTask(queueLog, func(ctx context.Context, t *asynq.Task) error {
		n, err := bookingSvc.ExpireUnpaid(ctx)
		if err != nil {
			return err
		}
		logging.WithTrace(queueLog, ctx).Info().Int("expired", n).Msg("unpaid bookings expired")
		return nil
	}))
	mux.HandleFunc(queue.TaskPaymentExpire, loggedTask(queueLog, func(ctx context.Context, t *asynq.Task) error {
		n, err := paymentSvc.ExpireDue(ctx)
		if err != nil {
			return err
		}
		logging.WithTrace(queueLog, ctx).Info().Int("expired", n).Msg("payments expired")
		return nil
	}))

	scheduler := asynq.NewScheduler(queue.RedisOpt(cfg), nil)
	if _, err := scheduler.Register("@every 15s", asynq.NewTask(queue.TaskOutboxSweep, nil)); err != nil {
		logging.Log.Fatal().Err(err).Msg("register outbox sweep")
	}
	if _, err := scheduler.Register("@every 5m", asynq.NewTask(queue.TaskInvitationExpire, nil)); err != nil {
		logging.Log.Fatal().Err(err).Msg("register invitation expire")
	}
	if _, err := scheduler.Register("@every 1m", asynq.NewTask(queue.TaskReservationExpire, nil)); err != nil {
		logging.Log.Fatal().Err(err).Msg("register reservation expire")
	}
	if _, err := scheduler.Register("@every 1m", asynq.NewTask(queue.TaskBookingExpireUnpaid, nil)); err != nil {
		logging.Log.Fatal().Err(err).Msg("register booking expire unpaid")
	}
	if _, err := scheduler.Register("@every 1m", asynq.NewTask(queue.TaskPaymentExpire, nil)); err != nil {
		logging.Log.Fatal().Err(err).Msg("register payment expire")
	}
	go func() {
		if err := scheduler.Run(); err != nil {
			logging.Log.Error().Err(err).Msg("scheduler stopped")
		}
	}()

	srv := queue.NewServer(cfg, queueLog)
	logging.Log.Info().Msg("worker listening")
	if err := srv.Run(mux); err != nil {
		logging.Log.Fatal().Err(err).Msg("worker failed")
	}
	scheduler.Shutdown()
}

func startWorkerMetrics(addr string) {
	if addr == "" {
		return
	}
	go func() {
		mux := http.NewServeMux()
		mux.Handle("/metrics", metrics.Handler())
		srv := &http.Server{Addr: addr, Handler: mux, ReadHeaderTimeout: 5 * time.Second}
		logging.Log.Info().Str("addr", addr).Msg("worker metrics listening")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logging.Log.Error().Err(err).Msg("worker metrics stopped")
		}
	}()
}

func loggedTask(logger *zerolog.Logger, next asynq.HandlerFunc) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		ctx = queue.ContextWithTaskTrace(ctx, t)
		ctx, span := otelx.Start(ctx, "asynq."+t.Type(), trace.WithSpanKind(trace.SpanKindConsumer))
		defer span.End()
		if tid := otelx.TraceID(ctx); tid != "" {
			ctx = requestctx.WithTraceID(ctx, tid)
		}
		log := logging.WithTrace(logger, ctx).With().
			Str("event", "queue_task").
			Str("task_type", t.Type()).
			Logger()
		log.Info().Msg("task started")
		err := next(ctx, t)
		metrics.ObserveAsynq(t.Type(), err)
		if err != nil {
			otelx.RecordError(span, err)
			log.Error().Err(err).Msg("task failed")
			return err
		}
		log.Info().Msg("task ok")
		return nil
	}
}
