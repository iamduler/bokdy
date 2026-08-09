package mail

import (
	"context"

	"bokdy/internal/platform/logging"

	"github.com/rs/zerolog"
)

type Message struct {
	To      string
	Subject string
	Body    string
}

type Mailer interface {
	Send(ctx context.Context, msg Message) error
}

type LogMailer struct {
	log *zerolog.Logger
}

func NewLogMailer(logger *zerolog.Logger) *LogMailer {
	return &LogMailer{log: logger}
}

func (m *LogMailer) Send(ctx context.Context, msg Message) error {
	logger := m.log
	if logger == nil {
		logger = logging.Log
	}
	logging.WithTrace(logger, ctx).Info().
		Str("event", "mail_send").
		Str("to", msg.To).
		Str("subject", msg.Subject).
		Msg("mail sent")
	return nil
}
