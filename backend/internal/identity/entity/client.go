package entity

import (
	"strings"

	iderrors "bokdy/internal/identity/errors"
)

const HeaderClient = "X-Client"

type Client string

const (
	ClientPlayer Client = "player"
	ClientOwner  Client = "owner"
	ClientAdmin  Client = "admin"
)

func ParseClient(raw string) (Client, error) {
	c := Client(strings.ToLower(strings.TrimSpace(raw)))
	switch c {
	case ClientPlayer, ClientOwner, ClientAdmin:
		return c, nil
	case "":
		return "", iderrors.ErrClientRequired
	default:
		return "", iderrors.ErrClientInvalid
	}
}

func (c Client) AllowsRegister() bool {
	return c == ClientPlayer || c == ClientOwner
}

func (c Client) AllowsLogin(isSystemAdmin bool) bool {
	if c == ClientAdmin {
		return isSystemAdmin
	}
	return !isSystemAdmin
}
