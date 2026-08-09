package middleware

import (
	"strings"
	"time"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/auth"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const OrganizationHeader = "X-Organization-ID"

func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		if logging.Log != nil {
			logging.Log.Error().Interface("panic", recovered).Msg("panic recovered")
		}
		httpx.Error(c, apperr.Internal("internal server error"))
	})
}

func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		reqID := c.GetHeader("X-Request-ID")
		if reqID == "" {
			reqID = uuid.NewString()
		}
		corrID := c.GetHeader("X-Correlation-ID")
		if corrID == "" {
			corrID = reqID
		}
		ctx := requestctx.WithRequestID(c.Request.Context(), reqID)
		ctx = requestctx.WithCorrelationID(ctx, corrID)
		c.Request = c.Request.WithContext(ctx)
		c.Header("X-Request-ID", reqID)
		c.Header("X-Correlation-ID", corrID)
		c.Next()
	}
}

func AccessLog() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		if logging.Log == nil {
			return
		}
		logging.Log.Info().
			Str("method", c.Request.Method).
			Str("path", c.Request.URL.Path).
			Int("status", c.Writer.Status()).
			Dur("latency", time.Since(start)).
			Str("request_id", requestctx.RequestID(c.Request.Context())).
			Msg("http_access")
	}
}

func CORS(allowedOrigins []string) gin.HandlerFunc {
	originSet := map[string]struct{}{}
	for _, o := range allowedOrigins {
		originSet[strings.TrimRight(o, "/")] = struct{}{}
	}
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" {
			if _, ok := originSet[strings.TrimRight(origin, "/")]; ok || len(allowedOrigins) == 0 {
				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Access-Control-Allow-Credentials", "true")
				c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept-Language, X-Organization-ID, X-Request-ID, X-Correlation-ID")
				c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
			}
		}
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func Locale() gin.HandlerFunc {
	return func(c *gin.Context) {
		loc := i18n.ParseLocale(c.GetHeader("Accept-Language"))
		c.Request = c.Request.WithContext(requestctx.WithLocale(c.Request.Context(), loc))
		c.Next()
	}
}

func JWTAuth(tokens auth.TokenService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			httpx.Error(c, apperr.Unauthorized("missing bearer token"))
			return
		}
		raw := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
		claims, err := tokens.ParseAccessToken(raw)
		if err != nil {
			httpx.Error(c, err)
			return
		}
		ctx := c.Request.Context()
		ctx = requestctx.WithUserID(ctx, claims.UserID)
		ctx = requestctx.WithSessionID(ctx, claims.SessionID)
		ctx = requestctx.WithEmail(ctx, claims.Email)
		ctx = requestctx.WithIsSystemAdmin(ctx, claims.IsSystemAdmin)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

func RequireSystemAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !requestctx.IsSystemAdmin(c.Request.Context()) {
			httpx.Error(c, apperr.Forbidden("platform admin required"))
			return
		}
		c.Next()
	}
}

func OptionalOrganization() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := c.GetHeader(OrganizationHeader)
		if raw == "" {
			c.Next()
			return
		}
		orgID, err := uuid.Parse(raw)
		if err != nil {
			httpx.Error(c, apperr.BadRequest("invalid X-Organization-ID"))
			return
		}
		ctx := requestctx.WithOrganizationID(c.Request.Context(), orgID)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
