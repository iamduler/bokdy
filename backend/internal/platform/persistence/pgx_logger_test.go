package persistence

import "testing"

func TestInterpolateSQL(t *testing.T) {
	got := interpolateSQL("SELECT * FROM t WHERE a=$1 AND b=$2", []any{"hi", 3})
	want := "SELECT * FROM t WHERE a='hi' AND b=3"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestInterpolateSQLDollarTen(t *testing.T) {
	args := make([]any, 10)
	for i := range args {
		args[i] = i + 1
	}
	got := interpolateSQL("SELECT $1, $10", args)
	if got != "SELECT 1, 10" {
		t.Fatalf("got %q", got)
	}
}
