package dto

type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FullName  string `json:"full_name"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
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
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type TokenResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    string    `json:"expires_at"`
	TokenType    string    `json:"token_type"`
	User         UserDTO   `json:"user"`
}

type UserDTO struct {
	ID            string   `json:"id"`
	PublicID      string   `json:"public_id"`
	Email         string   `json:"email,omitempty"`
	FullName      string   `json:"full_name,omitempty"`
	Status        string   `json:"status"`
	IsSystemAdmin bool     `json:"is_system_admin"`
	Roles         []string `json:"roles,omitempty"`
}

type MeResponse struct {
	User UserDTO `json:"user"`
}
