package service

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"strings"
	"time"
)

func GenerateTOTPSecret() (string, error) {
	buf := make([]byte, 20)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(buf), nil
}

func VerifyTOTP(secret, code string, now time.Time) bool {
	code = strings.TrimSpace(code)
	if len(code) != 6 {
		return false
	}
	key, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(strings.TrimSpace(secret)))
	if err != nil {
		return false
	}
	counter := now.Unix() / 30
	for _, skew := range []int64{-1, 0, 1} {
		if hotp(key, uint64(counter+skew)) == code {
			return true
		}
	}
	return false
}

func hotp(key []byte, counter uint64) string {
	var msg [8]byte
	binary.BigEndian.PutUint64(msg[:], counter)
	mac := hmac.New(sha1.New, key)
	_, _ = mac.Write(msg[:])
	sum := mac.Sum(nil)
	offset := sum[len(sum)-1] & 0x0f
	bin := (int(sum[offset])&0x7f)<<24 | int(sum[offset+1])<<16 | int(sum[offset+2])<<8 | int(sum[offset+3])
	value := bin % 1000000
	out := make([]byte, 6)
	for i := 5; i >= 0; i-- {
		out[i] = byte('0' + value%10)
		value /= 10
	}
	return string(out)
}

func MFAAllows(required bool, verifiedAt *time.Time) bool {
	return !required || verifiedAt != nil
}

func PointsForAmount(amount float64) int {
	points := int(amount / 10000)
	if points < 1 {
		return 1
	}
	return points
}

func RedactPlayerProfile(view PlayerProfileView, sameUser bool) PlayerProfileView {
	if sameUser {
		return view
	}
	if view.Visibility == "public" && view.IsDiscoverable {
		if view.IsActivityVisible {
			return view
		}
		view.PreferredPlayingTimes = ""
		view.PreferredLocations = ""
		return view
	}
	return PlayerProfileView{Visibility: view.Visibility}
}

func CanAssignOwnPlatformRole(actor, target string) bool {
	return actor != "" && actor != target
}
