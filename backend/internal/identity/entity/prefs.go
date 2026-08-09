package entity

import "strings"

type Theme string

const (
	ThemeLight  Theme = "light"
	ThemeDark   Theme = "dark"
	ThemeSystem Theme = "system"
)

func ParseTheme(raw string) (Theme, bool) {
	t := Theme(strings.ToLower(strings.TrimSpace(raw)))
	switch t {
	case ThemeLight, ThemeDark, ThemeSystem:
		return t, true
	default:
		return "", false
	}
}

type DateFormat string

const (
	DateFormatDMY DateFormat = "dmy"
	DateFormatMDY DateFormat = "mdy"
	DateFormatYMD DateFormat = "ymd"
)

func ParseDateFormat(raw string) (DateFormat, bool) {
	d := DateFormat(strings.ToLower(strings.TrimSpace(raw)))
	switch d {
	case DateFormatDMY, DateFormatMDY, DateFormatYMD:
		return d, true
	default:
		return "", false
	}
}
