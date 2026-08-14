package metrics

import (
	"fmt"
	"html/template"
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	dto "github.com/prometheus/client_model/go"
)

// Handler serves Prometheus text for scrapers. Browsers (Accept: text/html)
// get a grouped HTML view. Override with ?format=html or ?format=prometheus.
func (c *Collector) Handler() http.Handler {
	prom := promhttp.HandlerFor(c.Registry, promhttp.HandlerOpts{EnableOpenMetrics: true})
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if wantsBrowse(r) {
			c.serveBrowse(w)
			return
		}
		prom.ServeHTTP(w, r)
	})
}

func wantsBrowse(r *http.Request) bool {
	switch strings.ToLower(strings.TrimSpace(r.URL.Query().Get("format"))) {
	case "html":
		return true
	case "prometheus", "prom", "text", "openmetrics":
		return false
	}
	return strings.Contains(r.Header.Get("Accept"), "text/html")
}

type browsePage struct {
	Families []browseFamily
}

type browseFamily struct {
	Name string
	Help string
	Type string
	Rows []browseRow
}

type browseRow struct {
	Labels  string
	Value   string
	Detail  string
	HasMore bool
}

func (c *Collector) serveBrowse(w http.ResponseWriter) {
	mfs, err := c.Registry.Gather()
	if err != nil {
		http.Error(w, "metrics gather failed", http.StatusInternalServerError)
		return
	}
	page := browsePage{Families: make([]browseFamily, 0, len(mfs))}
	for _, mf := range mfs {
		fam := browseFamily{
			Name: mf.GetName(),
			Help: mf.GetHelp(),
			Type: strings.ToLower(mf.GetType().String()),
			Rows: make([]browseRow, 0, len(mf.GetMetric())),
		}
		for _, m := range mf.GetMetric() {
			fam.Rows = append(fam.Rows, browseRowFrom(mf.GetType(), m))
		}
		page.Families = append(page.Families, fam)
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	if err := browseTmpl.Execute(w, page); err != nil {
		return
	}
}

func browseRowFrom(t dto.MetricType, m *dto.Metric) browseRow {
	row := browseRow{Labels: formatLabels(m.GetLabel())}
	switch t {
	case dto.MetricType_COUNTER:
		row.Value = fmtFloat(m.GetCounter().GetValue())
	case dto.MetricType_GAUGE:
		row.Value = fmtFloat(m.GetGauge().GetValue())
	case dto.MetricType_UNTYPED:
		row.Value = fmtFloat(m.GetUntyped().GetValue())
	case dto.MetricType_HISTOGRAM:
		h := m.GetHistogram()
		row.Value = fmt.Sprintf("count=%d  sum=%s", h.GetSampleCount(), fmtFloat(h.GetSampleSum()))
		row.Detail = formatBuckets(h.GetBucket())
		row.HasMore = row.Detail != ""
	case dto.MetricType_SUMMARY:
		s := m.GetSummary()
		row.Value = fmt.Sprintf("count=%d  sum=%s", s.GetSampleCount(), fmtFloat(s.GetSampleSum()))
		row.Detail = formatQuantiles(s.GetQuantile())
		row.HasMore = row.Detail != ""
	default:
		row.Value = "—"
	}
	return row
}

func formatLabels(ps []*dto.LabelPair) string {
	if len(ps) == 0 {
		return ""
	}
	parts := make([]string, 0, len(ps))
	for _, p := range ps {
		parts = append(parts, p.GetName()+"="+strconv.Quote(p.GetValue()))
	}
	return strings.Join(parts, "  ")
}

func formatBuckets(bs []*dto.Bucket) string {
	parts := make([]string, 0, len(bs))
	for _, b := range bs {
		le := "+Inf"
		if b.UpperBound != nil && !math.IsInf(b.GetUpperBound(), 0) {
			le = fmtFloat(b.GetUpperBound())
		}
		parts = append(parts, fmt.Sprintf("le=%s → %d", le, b.GetCumulativeCount()))
	}
	return strings.Join(parts, "\n")
}

func formatQuantiles(qs []*dto.Quantile) string {
	parts := make([]string, 0, len(qs))
	for _, q := range qs {
		parts = append(parts, fmt.Sprintf("q=%s → %s", fmtFloat(q.GetQuantile()), fmtFloat(q.GetValue())))
	}
	return strings.Join(parts, "\n")
}

func fmtFloat(v float64) string {
	return strconv.FormatFloat(v, 'f', -1, 64)
}

var browseTmpl = template.Must(template.New("metrics").Parse(browseHTML))

const browseHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bokdy metrics</title>
  <style>
    :root { color-scheme: light dark; }
    body { margin: 0; font: 15px/1.45 system-ui, sans-serif; background: #f4f5f7; color: #1a1d23; }
    main { max-width: 960px; margin: 0 auto; padding: 1.25rem 1rem 3rem; }
    h1 { font-size: 1.35rem; margin: 0 0 .35rem; }
    .sub { color: #5c6570; margin: 0 0 1.25rem; font-size: .9rem; }
    .sub a { color: inherit; }
    section { background: #fff; border: 1px solid #e3e6eb; border-radius: 10px; padding: 1rem 1.1rem; margin-bottom: .85rem; }
    h2 { font-size: 1rem; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; margin: 0 0 .25rem; word-break: break-all; }
    .type { display: inline-block; font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; background: #eef1f6; color: #3d4652; border-radius: 999px; padding: .1rem .5rem; margin-left: .35rem; vertical-align: middle; }
    .help { color: #5c6570; margin: 0 0 .75rem; font-size: .9rem; }
    table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    th, td { text-align: left; padding: .4rem .5rem .4rem 0; vertical-align: top; border-top: 1px solid #eef0f3; }
    th { color: #5c6570; font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; border-top: 0; }
    td.labels { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .82rem; color: #2a313a; word-break: break-word; }
    td.value { font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 600; }
    .empty { color: #8b939e; font-style: italic; }
    pre { margin: .35rem 0 0; font: .78rem/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #5c6570; white-space: pre-wrap; }
    @media (prefers-color-scheme: dark) {
      body { background: #121418; color: #e8eaed; }
      section { background: #1b1e24; border-color: #2c313a; }
      .sub, .help, th, pre { color: #9aa3ad; }
      .type { background: #2c313a; color: #c5ccd4; }
      th, td { border-top-color: #2c313a; }
      td.labels { color: #d5dae0; }
      .empty { color: #6b7380; }
    }
  </style>
</head>
<body>
  <main>
    <h1>Bokdy metrics</h1>
    <p class="sub">Human-readable view. Scrapers should use the same URL (<a href="/metrics?format=prometheus">Prometheus text</a>).</p>
    {{if .Families}}
      {{range .Families}}
      <section>
        <h2>{{.Name}}<span class="type">{{.Type}}</span></h2>
        {{if .Help}}<p class="help">{{.Help}}</p>{{end}}
        <table>
          <thead><tr><th>Labels</th><th>Value</th></tr></thead>
          <tbody>
            {{range .Rows}}
            <tr>
              <td class="labels">{{if .Labels}}{{.Labels}}{{else}}<span class="empty">none</span>{{end}}{{if .HasMore}}<pre>{{.Detail}}</pre>{{end}}</td>
              <td class="value">{{.Value}}</td>
            </tr>
            {{end}}
          </tbody>
        </table>
      </section>
      {{end}}
    {{else}}
      <section><p class="help">No metrics registered yet.</p></section>
    {{end}}
  </main>
</body>
</html>
`
