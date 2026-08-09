package logging

import "testing"

func TestDefaultOptionsRotation(t *testing.T) {
	opts := DefaultOptions("/tmp/bokdy-logs", "app.log")
	if opts.MaxSizeMB != 10 || opts.MaxBackups != 10 {
		t.Fatalf("rotation=%dMB x %d", opts.MaxSizeMB, opts.MaxBackups)
	}
}
