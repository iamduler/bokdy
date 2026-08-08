package docsui

import (
	"net/http"
	"os"
	"path/filepath"

	"bokdy/internal/platform/config"
	"bokdy/internal/platform/env"

	"github.com/gin-gonic/gin"
)

const scalarHTML = `<!doctype html>
<html>
  <head>
    <title>Bokdy API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" data-url="/docs/openapi.yaml"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`

func Register(router *gin.Engine, cfg *config.Config) {
	if !cfg.Docs.Enabled {
		return
	}

	root := env.FindMonorepoRoot(env.MustGetWorkingDir())
	specPath := cfg.Docs.OpenAPIPath
	if !filepath.IsAbs(specPath) {
		specPath = filepath.Join(root, specPath)
	}

	router.GET("/docs", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(scalarHTML))
	})
	router.GET("/docs/openapi.yaml", func(c *gin.Context) {
		data, err := os.ReadFile(specPath)
		if err != nil {
			c.String(http.StatusNotFound, "openapi spec not found")
			return
		}
		c.Data(http.StatusOK, "application/yaml", data)
	})
}
