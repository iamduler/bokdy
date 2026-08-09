package dto

type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,password_policy"`
	FullName  string `json:"full_name"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type VerifyRequest struct {
	Token string `json:"token" binding:"required"`
}

type PasswordResetRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type PasswordResetConfirmRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,password_policy"`
}

type UpdateProfileRequest struct {
	FirstName             *string `json:"first_name"`
	LastName              *string `json:"last_name"`
	FullName              *string `json:"full_name"`
	DisplayName           *string `json:"display_name"`
	Phone                 *string `json:"phone"`
	LocaleID              *string `json:"locale_id"`
	Timezone              *string `json:"timezone"`
	CountryID             *string `json:"country_id"`
	PreferredCurrencyCode *string `json:"preferred_currency_code"`
	Theme                 *string `json:"theme"`
	DateFormat            *string `json:"date_format"`
}

type TokenResponse struct {
	AccessToken  string  `json:"access_token"`
	RefreshToken string  `json:"refresh_token"`
	ExpiresAt    string  `json:"expires_at"`
	TokenType    string  `json:"token_type"`
	User         UserDTO `json:"user"`
}

type UserDTO struct {
	ID                    string   `json:"id"`
	PublicID              string   `json:"public_id"`
	Email                 string   `json:"email,omitempty"`
	FullName              string   `json:"full_name,omitempty"`
	FirstName             string   `json:"first_name,omitempty"`
	LastName              string   `json:"last_name,omitempty"`
	DisplayName           string   `json:"display_name,omitempty"`
	Phone                 string   `json:"phone,omitempty"`
	Status                string   `json:"status"`
	IsSystemAdmin         bool     `json:"is_system_admin"`
	Roles                 []string `json:"roles,omitempty"`
	EmailVerifiedAt       *string  `json:"email_verified_at"`
	PhoneVerifiedAt       *string  `json:"phone_verified_at"`
	LocaleID              *string  `json:"locale_id,omitempty"`
	Timezone              string   `json:"timezone,omitempty"`
	CountryID             *string  `json:"country_id,omitempty"`
	PreferredCurrencyCode string   `json:"preferred_currency_code,omitempty"`
	Theme                 string   `json:"theme,omitempty"`
	DateFormat            string   `json:"date_format,omitempty"`
}

type MeResponse struct {
	User UserDTO `json:"user"`
}
