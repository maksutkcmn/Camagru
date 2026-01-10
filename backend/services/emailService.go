package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/smtp"
)

func GenerateVerifyToken() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func SendVerifyEmail(toEmail, token string) error  {
	from := "makokcmn@gmail.com"
    password := "wqro nuwk hheh ilry"
    smtpHost := "smtp.gmail.com"
    smtpPort := "587"

    link := "http://localhost:8080/verify?token=" + token

    headers := make(map[string]string)
    headers["From"] = from
    headers["To"] = toEmail
    headers["Subject"] = "Camagru Hesap Dogrulama"
    headers["MIME-Version"] = "1.0"
    headers["Content-Type"] = "text/html; charset=\"UTF-8\""

    message := ""
    for k, v := range headers {
        message += fmt.Sprintf("%s: %s\r\n", k, v)
    }

    body := fmt.Sprintf(`
        <html>
            <body>
                <h1>Hoşgeldin!</h1>
                <p>Hesabını doğrulamak için lütfen <a href="%s">buraya tıkla</a></p>
            </body>
        </html>
    `, link)

    fullMessage := []byte(message + "\r\n" + body)

    auth := smtp.PlainAuth("", from, password, smtpHost)
    
    err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{toEmail}, fullMessage)
    return err
}