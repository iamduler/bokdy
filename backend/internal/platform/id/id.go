// Package id centralizes identifier generation. All IDs are UUIDv7, minted
// by the Application layer; repositories must never generate IDs.
package id

import (
	"crypto/rand"
	"strings"

	"github.com/google/uuid"
)

// NewUUID generates an application-layer UUIDv7.
func NewUUID() (uuid.UUID, error) {
	return uuid.NewV7()
}

// MustNewUUID panics on failure; use only in bootstrap/test code where a
// generation failure would already be catastrophic (e.g. dead entropy source).
func MustNewUUID() uuid.UUID {
	generated, err := NewUUID()
	if err != nil {
		panic("id: failed to generate uuid v7: " + err.Error())
	}
	return generated
}

// crockfordAlphabet excludes I, L, O, U to avoid visual ambiguity, matching
// the encoding ULIDs use.
const crockfordAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

// PublicIDLength is the fixed length of every generated public ID.
const PublicIDLength = 26

// NewPublicID returns a 26-character, Crockford Base32 encoded random
// identifier safe to expose in URLs/APIs (e.g. invite codes, public slugs)
// without revealing the underlying UUID.
func NewPublicID() (string, error) {
	// 130 bits are consumed (26 * 5); read a couple of spare bytes so the
	// bit accumulator never has to pad with zero bits mid-stream.
	raw := make([]byte, 17)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}

	var sb strings.Builder
	sb.Grow(PublicIDLength)

	var acc uint32
	var bits uint
	next := 0

	for sb.Len() < PublicIDLength {
		for bits < 5 {
			if next < len(raw) {
				acc = acc<<8 | uint32(raw[next])
				bits += 8
				next++
			} else {
				acc <<= 5 - bits
				bits = 5
			}
		}
		bits -= 5
		sb.WriteByte(crockfordAlphabet[(acc>>bits)&0x1F])
		acc &= (1 << bits) - 1
	}

	return sb.String(), nil
}

// MustNewPublicID panics on failure; use only in bootstrap/test code.
func MustNewPublicID() string {
	generated, err := NewPublicID()
	if err != nil {
		panic("id: failed to generate public id: " + err.Error())
	}
	return generated
}
