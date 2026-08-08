package mail

import (
	"context"

	"bokdy/internal/platform/logging"
)

type Message struct {
	To      string
	Subject string
	Body    string
}

type Mailer interface {
	Send(ctx context.Context, msg Message) error
}

type LogMailer struct{}

func NewLogMailer() *LogMailer {
	return &LogMailer{}
}

func (m *LogMailer) Send(ctx context.Context, msg Message) error {
	_ = ctx
	if logging.Log != nil {
		logging.Log.Info().
			Str("to", msg.To).
			Str("subject", msg.Subject).
			Msg("mail (log provider)")
	}
	return nil
}
